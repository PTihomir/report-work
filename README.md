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
openssl pkcs12 -in downloaded-key-file.p12 -out your-key-file.pem -nodes

Share the spreadsheet, add generated email

Install node package edit-google-spreadsheet
npm i edit-google-spreadsheet --save

Run
============

Run with next command:

./scripts/run-server.sh


TODO
replace console.log with debug
use ES6 stuff in server
