/**
 * Handles static content.
 */
'use strict';
const util = require('util');
const debug = util.debuglog('report-servlet');
const chalk = require('chalk');

const nodemailer = require('nodemailer');
const url = require('url');
const fs = require('fs');
const file = `${__dirname}/config.json`;
const mu = require('mustache');

let config;

const chalkInfo = chalk.white;
const chalkOk = chalk.green;
const chalkError = chalk.red;
const chalkDebug = chalk.black.bgYellow;

// If DEBUG is 'on', then don't send any data to spreadsheet and don't send mails.
const DEBUG = process.env.DEBUG === 'on';

if (DEBUG) {
  debug(chalkDebug('DEBUG mode ON.'));
}

var Spreadsheet = require('edit-google-spreadsheet');

function ReportServlet() {
  var _this = this;

  this.handlers = [{
    regexp: /app\/report/i,
    handler: this.sendReport,
  }, {
    regexp: /app\/status/i,
    handler: this.sendStatus,
  }, {
    regexp: /app\/init/i,
    handler: this.sendInit,
  }];

  this.docsData = {
    info: null,
    rows: null,
    stale: true,
  };

  fs.readFile(file, 'utf8', function (err, data) {
    if (err) {
      debug(chalkError(`Error: ${err}`));
      debug(chalkInfo('Create symlink in ./app_back to ./config_back/<custom_config>.json'));
      process.exit(1);
      return;
    }

    config = JSON.parse(data);

    _this.fetchDataFromDocs();
  });
}

ReportServlet.prototype.handleRequest = function (req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'origin, content-type, accept');
  res.setHeader('Access-Control-Allow-Methods', 'POST');

  var path = ('./' + req.url.pathname).replace('//', '/').replace(/%(..)/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)));

  for (var i = 0; i < this.handlers.length; i++) {
    if (this.handlers[i].regexp.test(path)) {
      debug(chalkInfo(`Matched ${this.handlers[i].regexp.toString()}`));
      this.handlers[i].handler.call(this, req, res);
      return;
    }
  }

  res.end();
};

ReportServlet.prototype.sendStatus = function (req, res) {
  var urlParts = url.parse(req.url, true);
  var query = urlParts.query;

  var response = {
    status: true,
  };

  if (!this.docsData.stale || query.force === 'yes') {
    response.rows = [];
    for (var i = this.docsData.info.lastRow; i > 0 && i > this.docsData.info.lastRow - 10; i--) {
      response.rows.push({
        date: this.docsData.rows[i][1],
        hour: this.docsData.rows[i][3],
        task: this.docsData.rows[i][2],
      });
    }
    this.docsData.stale = true;
  }

  res.write(JSON.stringify(response));
  res.end();
};

ReportServlet.prototype.sendReport = function (req, res) {
  if (!config) {
    res.end();
  }

  var that = this,
    body = [];

  req.on('data', function (data) {
    body.push(data);

          // Too much POST data, kill the connection!
    if (body.length > 1000) req.connection.destroy();
  })
  .on('end', function () {
    var post = JSON.parse(body.join(''));

    if (DEBUG) {
      debug(chalkDebug('Got data in DEBUG mode.'));
      debug(util.inspect(post, {color: true, depth: 3}));
      return;
    }

    that.sendDataToDocs(post, function (err) {
      if (err) {
        res.write(JSON.stringify({
          status: false,
        }));
        res.end();
        return;
      }

      that.sendMail(post, function (success) {
        res.write(JSON.stringify({
          status: success,
        }));
        res.end();
        that.fetchDataFromDocs();
      });
    });
  });
};

ReportServlet.prototype.sendInit = function (req, res) {
  var response = {
    defaultMailto: config.defaultTo,
  };

  response.lastDate = this.docsData.rows[this.docsData.info.lastRow][1];
  response.documentUrl = 'https://docs.google.com/a/alasdoo.com/spreadsheet/ccc?key=0AqXPiPwnV1Y2dFp3RmM1bTdLZTVlcVdvb3pZVEY5cFE&usp=sharing#gid=0';

  res.write(JSON.stringify(response));
  res.end();
};

ReportServlet.prototype.sendMail = function (data, done) {
    // create reusable transport method (opens pool of SMTP connections)
  var smtpTransport = nodemailer.createTransport({
      service: config.service,
      auth: {
        user: config.auth.user,
        pass: config.auth.pass,
      },
    }),
    // send mail with defined transport object
    message,
    counter = 0,
    subject,
    messagebody,
    success = true;

  for (var i = 0; i < data.entries.length; i++) {
    subject = mu.render(config.templates.title, data.entries[i]);
    messagebody = mu.render(config.templates.body, data.entries[i]);

    message = {
      from: config.defaultFrom,
      to: (data.mailto || config.defaultTo),
      subject: subject,
      html: messagebody,
    };

    smtpTransport.sendMail(message, function (error, response) {
      counter += 1;

      if (error) {
        success = false;
        debug(chalkError(error));
      } else {
        debug(chalkInfo(`Message sent: ${response.message}`));
      }

      if (counter === data.entries.length) {
        smtpTransport.close(); // shut down the connection pool, no more messages
        if (success) {
          debug(chalkOk('All messages sent.'));
        } else {
          debug(chalkError('All messages sent, but with error.'));
        }
        if (done) {
          done(success);
        }
      }
    });
  }
};

ReportServlet.prototype.fetchDataFromDocs = function (done) {
  var _this = this;
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
  }, function sheetReady(err, spreadsheet) {
    if (err) {
      throw err;
    }

    spreadsheet.receive((err, rows, info) => {
      if (err) {
        throw err;
      }

      _this.docsData.rows = rows;
      _this.docsData.info = info;
      _this.docsData.stale = false;

      if (done) {
        done();
      }
    });
  });
};

ReportServlet.prototype.sendDataToDocs = function (data, done) {
  var _this = this;

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

  }, function sheetReady(err, spreadsheet) {
    if (err) {
      throw err;
    }

    var sendData = {},
      entry,
      nextRow = _this.docsData.info.nextRow,
      processed,
      // dateTokens,
      formatedDate;

    for (var i = 0; i < data.entries.length; i++) {
      entry = data.entries[i];
      processed = false;

      // dateTokens = entry.date.split('/');
      // formatedDate = [dateTokens[0], dateTokens[1], dateTokens[2]].join('/');
      formatedDate = entry.date;

      for (var j = _this.docsData.info.lastRow; j > Math.max(0, _this.docsData.info.lastRow - 31); j--) {
        if (typeof _this.docsData.rows[j] === 'undefined') {
          continue;
        }

        if (new Date(_this.docsData.rows[j]['1']).getTime() === new Date(formatedDate).getTime()) {
          sendData[j] = {
            2: entry.task.join(';'),
          };

          if (!_this.docsData.rows[j]['3']) {
            sendData[j]['3'] = entry.hour;
          } else if (_this.docsData.rows[j]['3'] !== entry.hour) {
            debug(chalkError(`For ${formatedDate} the old and the new hour is different.`), _this.docsData.rows[j][3], '->', entry.hour);
          }

          processed = true;
          break;
        }
      }

      if (!processed) {
        sendData[nextRow++] = [[formatedDate, entry.task.join(';'), entry.hour]];
      }
    }

    spreadsheet.add(sendData);

    debug(chalkOk('Send data:'));
    debug(util.inspect(sendData, {color: true}));

    spreadsheet.send((err) => {
      if (err) throw err;
      debug(chalkOk('Updated Success!'));

      if (done) {
        done();
      }
    });
  });
};

module.exports = ReportServlet;
