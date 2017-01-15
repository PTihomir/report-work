report.alasdoo
============

My javascript/nodejs web application project for generating and sending reports of my work.


Setup for email
============

Make a copy of ./config/userconfig_example.json file. Modify the settings and create a symlink to that file in ./bin folder. Name the symlink config.json.

./bin/config.json should point to ./config/userconfig.json

Setup Google docs
============

Follow the instructions: http://www.nczonline.net/blog/2014/03/04/accessing-google-spreadsheets-from-node-js/

Go to console.developers.google.com

Create new Project
Enable in 'APIa & auth'/'APIs' Drive API

Create Service account in Credentials section

Create New Client ID

Generate a Key

Convert key file downloaded in previous step to PEM file
`openssl pkcs12 -in downloaded-key-file.p12 -out your-key-file.pem -nodes`

Share the spreadsheet, add generated email

Install node package edit-google-spreadsheet
npm i edit-google-spreadsheet --save

Run
===

Run with next command:

./scripts/run-server.sh

=================
Project structure
=================

Backend
=======

Backend is a simple node.js server. It doesn't depend on any other library, just
native node.js. **web-server.js** contains the basic document handling, the GET
requests. **report_servlet.js** contains the advanced handling. It resolves POST
requests.

How to use it
-------------

Some env variables:

* PORT=3111 - which port to listen
* NODE_DEBUG=report-servlet - set this to `report-servlet` to display debug info

Npm run commands:

* **npm run server** - run server


Frontend
========

React application, used by webpack. No redux and similar stuff. For design I used
react-material-ui.

====
TODO
====

* use ES6 stuff in server
* send ok messages from server to frontend
* use websockets for communication
* send mails with delay, so they appear in order in sent mailg
* use better-npm-script
* deploy to raspi
