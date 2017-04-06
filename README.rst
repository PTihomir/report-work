==============
report.alasdoo
==============

My javascript/nodejs web application project for generating and sending reports of my work.

==================
Available commands
==================

To start the backend, use commands:

.. sourcecode:: shell

  yarn run server:production
  yarn run server:dev


To start the frontend, use commands:

.. sourcecode:: shell

  yarn run start
  yarn run dev


Configuration
=============

Make a copy of ./config/userconfig_example.json file. Modify the settings and create a symlink to that file in ./app_back folder. Name the symlink config.json.

.. sourcecode:: shell

  ln -sf ./config/<modified config> ./app_back/_production.json

You can also give different name to the symlink, but in that case run server with next command

.. sourcecode:: shell

  CONFIG_PATH='./<other name>.json' yarn run server


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

.. sourcecode:: shell

    yarn add edit-google-spreadsheet

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

.. sourcecode:: shell

  yarn run server:production
  yarn run server:dev
  CONFIG_PATH='./<config>.json' yarn run server


Frontend
========

React application, used by webpack. No redux and similar stuff. For design I used
react-material-ui.

====
TODO
====

* make it show something sensible when server is down
* send ok messages from server to frontend
* use websockets for communication
* deploy to raspi
* remove or mark already sent items
* check how it works when backend is always on. Probably we need to redesign backend, so it starts google fetch when requested.
