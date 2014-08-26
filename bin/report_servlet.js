/**
 * Handles static content.
 */
'use strict';
var nodemailer = require('nodemailer'),
    fs = require('fs'),
    file = __dirname + '/config.json',
    mu = require('mustache'),
    config;

var Spreadsheet = require('edit-google-spreadsheet');

fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    console.log('Error: ' + err);
    console.info('Create symlink in ./bin to ./config/<custom_config>.json');
    process.exit(1);
    return;
  }

  config = JSON.parse(data);

});

function ReportServlet() {

    this.handlers = [{
        regexp: /app\/report/i,
        handler: this.sendReport
    }, {
        regexp: /app\/status/i,
        handler: this.sendStatus
    }];

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

    res.write(JSON.stringify({
        status: true
    }));
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
            });
        });


    });
};

ReportServlet.prototype.sendMail = function (data, done) {

    // create reusable transport method (opens pool of SMTP connections)
    var smtpTransport = nodemailer.createTransport('SMTP',{
        service: config.service,
        auth: {
            user: config.auth.user,
            pass: config.auth.pass
        }
    });

    // send mail with defined transport object
    var message,
        counter = 0,
        subject,
        messagebody,
        success = true;

    for (var i = 0; i < data.entries.length; i++) {


        subject = mu.render(config.templates.title, data.entries[i]);
        messagebody = mu.render(config.templates.body, data.entries[i]);

        message = {
            from: config.from,
            to: data.mailto || config.defaultTo,
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

            // if you don't want to use this transport object anymore, uncomment following line
            if (counter === data.entries.length){
                smtpTransport.close(); // shut down the connection pool, no more messages
                console.log('All messages sent.');
                if (done) {
                    done(success);
                }
            }
        });
    }

};

ReportServlet.prototype.sendDataToDocs = function (data, done) {

    // create reusable transport method (opens pool of SMTP connections)
    //https://docs.google.com/a/alasdoo.com/spreadsheet/ccc?key=0AqXPiPwnV1Y2dFp3RmM1bTdLZTVlcVdvb3pZVEY5cFE&usp=sharing
    // https://docs.google.com/a/alasdoo.com/spreadsheets/d/151fjUIesb3gPBtHvOnxjI8dK5rgxaf45ySVi__z6yZI/edit?usp=sharing
    Spreadsheet.load({
        debug: true,
        spreadsheetId: '0AqXPiPwnV1Y2dFp3RmM1bTdLZTVlcVdvb3pZVEY5cFE',
        worksheetName: 'WorkingHours',
        oauth : {
            email: '886016146227-7fh037377hjj90e2ki5dokt19099ajs4@developer.gserviceaccount.com',
            keyFile: __dirname + '/alasdoo-key-final.pem'
        }

    }, function sheetReady(err, spreadsheet) {

        if (err) {
            throw err;
        }

        spreadsheet.receive(function(err, rows, info) {
            if (err) {
                throw err;
            }

            // console.log('Rows', rows);
            // console.log('Info', info);

            var sendData = {},
                entry,
                nextRow = info.nextRow,
                processed,
                dateTokens,
                formatedDate;

            for (var i = 0; i < data.entries.length; i++) {
                entry = data.entries[i];
                processed = false;

                dateTokens = entry.date.split('/');
                formatedDate = [dateTokens[1], dateTokens[0], dateTokens[2]].join('/');

                for (var j = info.lastRow; j > Math.max(0, info.lastRow - 31); j--) {
                    if (typeof rows[j] === 'undefined') {
                        continue;
                    }

                    if (new Date(rows[j]['1']).getTime() === new Date(formatedDate).getTime()) {

                        sendData[j] = {
                            '2': entry.task.join(';')
                        };

                        if (!rows[j]['3']) {
                            sendData[j]['3'] = entry.hour;
                        } else if (rows[j]['3'] != entry.hour) {
                            console.warn(('For ' + formatedDate + ' the old and the new hour is different.').red, rows[j][3], '->', entry.hour);
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
                console.log("Updated Success!".blue);

                if (done) {
                    done();
                }
            });

        });

    });

};


module.exports = ReportServlet;
