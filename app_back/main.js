const util = require('util');
const debug = util.debuglog('main');
const fs = require('fs');

const config = {
  env: process.env.NODE_ENV || 'development',
  server_port: Number(process.env.PORT) || 3111,
  default_page: 'app_back/index.html',
  debug: {
    debug_name: 'web-server',
  },
  cors_headers: [
    { header: 'Access-Control-Allow-Origin', value: '*' },
    { header: 'Access-Control-Allow-Headers', value: 'origin, content-type, accept' },
    { header: 'Access-Control-Allow-Methods', value: 'POST' },
  ],
  config_path: process.env.CONFIG_PATH,
  report_config: {
    debug: {
      debug_name: 'report-servlet',
    },
  },
};

if (!config.config_path) {
  debug('CONFIG_PATH not set.');
  process.exit(9);
  return;
}

const file = `${__dirname}/${config.config_path}`;

debug(`Read config file: ${file}`);

fs.readFile(file, 'utf8', function (err, data) {
  if (err) {
    debug(`Error: ${err}`);
    debug('Create symlink in ./app_back to ./config_back/<custom_config>.json');
    process.exit(1);
    return;
  }

  const configData = JSON.parse(data);

  config.report_config = Object.assign({}, config.report_config, configData);

  // Start server.
  debug('Starting web-server.');
  require('./web-server').startServer(config);
});

