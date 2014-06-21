/**
 * Handles static content.
 */
'use strict';
var nodemailer = require('nodemailer'),
    fs = require('fs'),
    file = __dirname + '/config.json',
    mu = require('mustache'),
    config;

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

        that.sendMail(post);

        res.end();
    });
};

ReportServlet.prototype.sendMail = function (data) {

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
        messagebody;

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
                console.log(error);
            }else{
                console.log('Message sent: ' + response.message);
            }

            // if you don't want to use this transport object anymore, uncomment following line
            if (counter === data.entries.length){
                smtpTransport.close(); // shut down the connection pool, no more messages
                console.log('All messages sent.');
            }
        });
    }

};


module.exports = ReportServlet;
