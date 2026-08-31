const bodyParser = require('body-parser');
const path = require('path');
const express = require('express');
const app = express();
const cons = require('consolidate')
const cors = require('cors');
// Must run before any config file is required - they read process.env.
require('dotenv').config();
const http = require("http");
const admin = express();
const api = express();
const schedule = require('node-schedule');

global.GLOBAL_PATH = path.resolve(__dirname);
// Resolved from APP_ENV. See app/config/index.js — it refuses to boot rather than
// guess, because the environments differ in database, payment key and whether real
// guests get emailed.
global.CONFIG = require('./app/config');
global.MODELS = require(GLOBAL_PATH + '/app/models');
global.OUTPUT = require('./app/helper/output');
global.LIBRARY = require('./app/helper/library');
global.CRON = require('./app/helper/cron');
// global.QUERY_HELPER = require('./app/helper/queryHelper');

const port = CONFIG.port;

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.engine('html', cons.swig);
app.set('view engine', 'html');

app.use('/admin', admin);
app.use('/api', api);

require('./app/routes/admin')(admin);
require('./app/routes/api')(api);

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  next();
});

if (!process.env.INSTANCE_ID || process.env.INSTANCE_ID === '0') {
  // untuk testing di local
  schedule.scheduleJob(' 0 0 2 * * *', CRON.cronCustCheckin);
  schedule.scheduleJob(' 0 0 17 * * *', CRON.cronCheckCurrency);
} else if (process.env.INSTANCE_ID || process.env.INSTANCE_ID !== '0') {
  schedule.scheduleJob(' 0 0 2 * * *', CRON.cronCustCheckin);
  schedule.scheduleJob(' 0 0 17 * * *', CRON.cronCheckCurrency);
}

http.createServer(app).listen(port, function() {
  console.log(`App is listening to port: ${port}, Instance ID: ${process.env.INSTANCE_ID}`,)
});
