/**
 * Handles static content.
 */
'use strict';
var nodemailer = require('nodemailer'),
    url = require('url'),
    fs = require('fs'),
    file = __dirname + '/config.json',
    mu = require('mustache'),
    config;

    require("colors");

var Spreadsheet = require('edit-google-spreadsheet');

function ReportServlet() {

    var _this = this;

    this.handlers = [{
        regexp: /app\/report/i,
        handler: this.sendReport
    }, {
        regexp: /app\/status/i,
        handler: this.sendStatus
    }, {
        regexp: /app\/init/i,
        handler: this.sendInit
    }];

    this.docsData = {
        info: null,
        rows: null,
        stale: true
    };

    fs.readFile(file, 'utf8', function (err, data) {
      if (err) {
        console.log('Error: ' + err);
        console.info('Create symlink in ./bin to ./config/<custom_config>.json');
        process.exit(1);
        return;
      }

      config = JSON.parse(data);

      _this.fetchDataFromDocs();
    });


}

ReportServlet.prototype.handleRequest = function(req, res) {

    var path = ('./' + req.url.pathname).replace('//','/').replace(/%(..)/g, function(match, hex){
       return String.fromCharCode(parseInt(hex, 16));
    });

    for (var i = 0; i < this.handlers.length; i++) {
        if (this.handlers[i].regexp.test(path)) {
            console.log('Matched', this.handlers[i].regexp.toString());
            this.handlers[i].handler.call(this, req, res);
            return;
        }
    }

    res.end();
};

ReportServlet.prototype.sendStatus = function(req, res) {

    var url_parts = url.parse(req.url, true);
    var query = url_parts.query;

    var response = {
        status: true
    };

    if (!this.docsData.stale || query.force === 'yes') {

        response.rows = [];
        for( var i = this.docsData.info.lastRow; i > 0 && i > this.docsData.info.lastRow - 10; i--) {
            response.rows.push({
                date: this.docsData.rows[i][1],
                hour: this.docsData.rows[i][3],
                task: this.docsData.rows[i][2]
            });
        }
        this.docsData.stale = true;
    }

    res.write(JSON.stringify(response));
    res.end();
};


ReportServlet.prototype.sendReport = function(req, res) {

    if (!config) {
       res.end();
    }

    var that = this,
        body = [];

    req.on('data', function (data) {
        body.push(data);

        // Too much POST data, kill the connection!
        if (body.length > 1000)
            req.connection.destroy();
    })
    .on('end', function () {
        var post = JSON.parse(body.join(''));

        that.sendDataToDocs(post, function (err) {
            if (err) {
                res.write(JSON.stringify({
                    status: false
                }));
                res.end();
                return;
            }

            that.sendMail(post, function (success) {
                res.write(JSON.stringify({
                    status: success
                }));
                res.end();
                that.fetchDataFromDocs();
            });
        });


    });
};

ReportServlet.prototype.sendInit = function(req, res) {

    var response = {
        defaultMailto: config.defaultTo
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
                pass: config.auth.pass
            }
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
            html: messagebody
        };

        smtpTransport.sendMail(message, function(error, response){

            counter += 1;
            if(error){
                success = false;
                console.log(error);
            }else{
                console.log('Message sent: ' + response.message);
            }

            if (counter === data.entries.length){
                smtpTransport.close(); // shut down the connection pool, no more messages
                if (success) {
                    console.log('All messages sent.'.green);
                } else {
                    console.log('All messages sent, but with error.'.yellow);
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
        oauth : {
            email: config.oauth.email,
            keyFile: __dirname + config.oauth.keyFile
        }

    }, function sheetReady(err, spreadsheet) {

        if (err) {
            throw err;
        }

        spreadsheet.receive(function(err, rows, info) {
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
        oauth : {
            email: config.oauth.email,
            keyFile: __dirname + config.oauth.keyFile
        }

    }, function sheetReady(err, spreadsheet) {

        if (err) {
            throw err;
        }

        var sendData = {},
            entry,
            nextRow = _this.docsData.info.nextRow,
            processed,
            dateTokens,
            formatedDate;

        for (var i = 0; i < data.entries.length; i++) {
            entry = data.entries[i];
            processed = false;

            dateTokens = entry.date.split('/');
            formatedDate = [dateTokens[1], dateTokens[0], dateTokens[2]].join('/');

            for (var j = _this.docsData.info.lastRow; j > Math.max(0, _this.docsData.info.lastRow - 31); j--) {
                if (typeof _this.docsData.rows[j] === 'undefined') {
                    continue;
                }

                if (new Date(_this.docsData.rows[j]['1']).getTime() === new Date(formatedDate).getTime()) {

                    sendData[j] = {
                        '2': entry.task.join(';')
                    };

                    if (!_this.docsData.rows[j]['3']) {
                        sendData[j]['3'] = entry.hour;
                    } else if (_this.docsData.rows[j]['3'] != entry.hour) {
                        console.warn(('For ' + formatedDate + ' the old and the new hour is different.').red, _this.docsData.rows[j][3], '->', entry.hour);
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

        console.log('Send data:'.green);
        console.log(sendData);

        spreadsheet.send(function(err) {
            if(err) throw err;
            console.log('Updated Success!'.blue);

            if (done) {
                done();
            }
        });

    });

};


module.exports = ReportServlet;
