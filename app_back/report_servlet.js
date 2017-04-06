/**
 * Handles static content.
 */
'use strict';
const util = require('util');
const chalk = require('chalk');

const nodemailer = require('nodemailer');
const url = require('url');
const mu = require('mustache');

const chalkInfo = chalk.white;
const chalkOk = chalk.green;
const chalkError = chalk.red;
const chalkDebug = chalk.black.bgYellow;

const Spreadsheet = require('edit-google-spreadsheet');

// The constructor function.
function ReportServlet(config) {
  this.config = config;
  this.debug = util.debuglog(this.config.report_config.debug.debug_name);

  // If DEBUG is 'on', then don't send any data to spreadsheet and don't send mails.
  this.DEBUG_MODE = process.env.DEBUG === 'on';

  if (this.DEBUG_MODE) {
    this.debug(chalkDebug('DEBUG mode ON.'));
  }

  this.handlers = [{
    regexp: /app\/report/i,
    handler: this.sendReport,
  }, {
    regexp: /app\/status/i,
    handler: this.sendStatus,
  }];

  this.state = {
    settings: {
      defaultMailto: config.report_config.defaultTo,
      lastDate: false,
      documentUrl: `https://docs.google.com/a/alasdoo.com/spreadsheets/d/${config.report_config.spreadsheetId}`,
    },
    history: undefined,
    messages: [],
    hash: {
      settings: `${Date.now()}`,
      history: 0,
      messages: 0,
    },
  };

  this.saveMessage('Server started');
  this.fetchDataFromDocs();
};

ReportServlet.prototype.saveMessage = function (message) {
  this.state.messages.push({
    tstamp: Date.now(),
    message,
  });

  // Update hash.
  this.state.hash.messages = `${Date.now()}`;
};

ReportServlet.prototype.handleRequest = function (req, res) {
  this.config.cors_headers.forEach(({header, value}) => {
    res.setHeader(header, value);
  });

  var path = ('./' + req.url.pathname).replace('//', '/').replace(/%(..)/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  for (var i = 0; i < this.handlers.length; i++) {
    if (this.handlers[i].regexp.test(path)) {
      this.debug(chalkInfo(`Matched ${this.handlers[i].regexp.toString()}`));
      this.handlers[i].handler.call(this, req, res);
      return;
    }
  }

  this.debug(chalkDebug(`Path ${req.url.pathname} not matched with any endpoint.`));
  res.end();
};

ReportServlet.prototype.sendStatus = function (req, res) {
  var urlParts = url.parse(req.url, true);
  var query = urlParts.query;

  const response = {};

  const { settings, history, messages } = query;

  if (settings !== this.state.hash.settings) {
    response.settings = this.state.settings;
    response.settingsHash = this.state.hash.settings;
  }

  if (history !== this.state.hash.history) {
    if (this.state.history) {
      const { rows } = this.state.history;
      response.historyHash = this.state.hash.history;

      response.history = rows.slice(-10)
        .reverse()
        .map((row) => ({
          date: row[1],
          hour: row[3],
          task: row[2],
        }));
    }
  }

  if (messages !== this.state.hash.messages) {
    response.messages = this.state.messages.slice(-5);
    response.messagesHash = this.state.hash.messages;
  }

  res.write(JSON.stringify(response));
  res.end();
};

ReportServlet.prototype.sendReport = function (req, res) {
  const body = [];

  req.on('data', (data) => {
    body.push(data);
    // Too much POST data, kill the connection!
    if (body.length > 1000) req.connection.destroy();
  })
  .on('end', () => {
    const post = JSON.parse(body.join(''));

    if (this.DEBUG_MODE) {
      this.debug(chalkDebug('Got data in DEBUG mode.'));
      this.debug(util.inspect(post, {color: true, depth: 3}));
      return;
    }

    this.sendDataToDocs(post, (err, okRows) => {
      if (err) {
        this.saveMessage('Sending data to DOCS failed.');
        res.write(JSON.stringify({
          status: false,
        }));
        res.end();
        return;
      }
      this.saveMessage('Sending data to DOCS succeded.');

      this.fetchDataFromDocs();

      this.sendMail(Object.assign({}, post, {entries: okRows}), (success) => {
        this.saveMessage('Sending mails succeded.');
        res.write(JSON.stringify({
          status: success,
        }));
        res.end();
      });
    });
  });
};

ReportServlet.prototype.sendMail = function (data, done) {
  const config = this.config.report_config;
    // create reusable transport method (opens pool of SMTP connections)
  const smtpTransport = nodemailer.createTransport({
    service: config.service,
    auth: {
      user: config.auth.user,
      pass: config.auth.pass,
    },
  });

  const messages = data.entries.map((entry, idx) => {
    const subject = mu.render(config.templates.title, entry);
    const messagebody = mu.render(config.templates.body, entry);

    return {
      from: config.defaultFrom,
      to: (data.mailto || config.defaultTo),
      subject: subject,
      html: messagebody,
    };
  });

  let counter = 0;
  let success = true;
  const send = (messages, done) => {
    const messageIndex = counter++;
    const message = messages[messageIndex];

    smtpTransport.sendMail(message, (err, response) => {
      if (err) {
        success = false;
        this.saveMessage(`Error when sending message with title ${message.subject}`);
        this.debug(chalkError(err));
      } else {
        this.debug(chalkInfo(`Message sent: ${response.message}`));
      }

      if (messageIndex + 1 === messages.length) {
        done(success);
      } else {
        send(messages, done);
      }
    });
  };

  send(messages, () => {
    if (success) {
      this.saveMessage(`${counter} message successfully sent.`);
      this.debug(chalkOk('All messages sent.'));
    } else {
      this.saveMessage(`${counter} message sent, but some with error.`);
      this.debug(chalkError('All messages sent, but with error.'));
    }

    smtpTransport.close();
    if (done) done(success);
  });
};

ReportServlet.prototype.fetchDataFromDocs = function (done) {
  const config = this.config.report_config;
  // create reusable transport method (opens pool of SMTP connections)
  Spreadsheet.load({
    debug: true,

    spreadsheetId: config.spreadsheetId,
    worksheetId: config.worksheetId,
    // worksheetName: config.worksheetName,
    oauth: {
      email: config.oauth.email,
      keyFile: `${__dirname}${config.oauth.keyFile}`,
    },
  }, (err, spreadsheet) => {
    if (err) {
      this.saveMessage('Spreadsheet load failed.');
      throw err;
    }

    spreadsheet.receive((err, rows, info) => {
      if (err) {
        this.saveMessage('Spreadsheet receive failed.');
        throw err;
      }

      this.saveMessage('Spreadsheet fetched.');

      const processRows = Object.keys(rows)
        .map((key) => Object.assign({key: key}, rows[key]))
        .filter((row) => typeof row[3] === 'number');

      this.state.history = {
        rows: processRows,
        info: info,
      };

      this.state.settings.lastDate = processRows[processRows.length - 1][1];

      // Update hash.
      this.state.hash.history = `${Date.now()}`;
      this.state.hash.settings = `${Date.now()}`;

      if (done) {
        done();
      }
    });
  });
};

ReportServlet.prototype.sendDataToDocs = function (data, done) {
  const config = this.config.report_config;

  // create reusable transport method (opens pool of SMTP connections)
  Spreadsheet.load({
    debug: true,
    spreadsheetId: config.spreadsheetId,
    worksheetId: config.worksheetId,
    worksheetName: config.worksheetName,
    oauth: {
      email: config.oauth.email,
      keyFile: `${__dirname}${config.oauth.keyFile}`,
    },

  }, (err, spreadsheet) => {
    if (err) {
      throw err;
    }

    const errorRows = [];
    const updateRows = [];
    const newRows = [];
    const sendData = {};

    // Group entries by error, update or new.
    data.entries
      .forEach((entry) => {
        const oldRow = this.state.history.rows
          .find((row) => new Date(row[1]).getTime() === new Date(entry.date).getTime());

        if (oldRow) { // Entry with the same date exist, it should update it.
          if (oldRow[3] !== entry.hour) { // If hours are different, then send a notification.
            errorRows.push(entry);
            this.debug(chalkError(`For ${entry.date} the old and the new hour is different.`), oldRow[3], '->', entry.hour);
            this.saveMessage(`For ${entry.date} hours are different. ${oldRow[3]} -> ${entry.hour}`);
          } else {
            updateRows.push(Object.assign({key: oldRow.key}, entry));
          }
        } else {      // New row is defined
          newRows.push(entry);
        }
      });

    this.debug(chalkInfo(`Error ${errorRows.length}; Update ${updateRows.length}; New ${newRows.length}`));

    updateRows.forEach(({hour, date, task, key}) => {
      sendData[key] = {
        3: hour,
        2: task.join(';'),
      };
    });

    newRows.forEach(({hour, date, task}, idx) => {
      sendData[this.state.history.info.nextRow + idx] = [[
        date,
        task.join(';'),
        hour,
      ]];
    });

    spreadsheet.add(sendData);

    this.debug(chalkOk('Send data:'));
    this.debug(util.inspect(sendData, {color: true}));

    spreadsheet.send((err) => {
      if (err) {
        done(err);
      }

      this.debug(chalkOk('Updated Success!'));
      done(null, [].concat(updateRows, newRows));
    });
  });
};

module.exports = ReportServlet;
