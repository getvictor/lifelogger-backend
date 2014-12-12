var express = require('express');
var bodyParser = require('body-parser');
var Dropbox = require('./dropbox-datastores-1.2-latest.js');
var util = require('util');

var app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Allow CORS
app.use(function(req, res, next) {
  var oneof = false;
  if (req.headers.origin) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    oneof = true;
  }
  if (req.headers['access-control-request-method']) {
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    oneof = true;
  }
  if (req.headers['access-control-request-headers']) {
    res.header('Access-Control-Allow-Headers', 'accept, content-type, x-apigee-client-device-id, ' +
               'x-apigee-client-org-name, x-apigee-client-session-id, x-apigee-client-app-name, ' +
               'x-apigee-client-request-id');
    oneof = true;
  }
  if (oneof) {
    res.header('Access-Control-Max-Age', 60 * 60 * 24 * 365);
  }

  // intercept OPTIONS method
  if (oneof && req.method == 'OPTIONS') {
    res.send(200);
  } else {
    next();
  }
});

var client = new Dropbox.Client({
  key: 'maqecjch0jcdmev',
  secret: '3rpydumdtz4nxm3',
  token: 'E5k8eGItbv4AAAAAAAACEli8pO41LWT0W5M44azEhsJuMagnRdw5zBJEbsP5pWR_',
  uid: '15167810'
});
var openDatastores = {};

app.get('/alive', function(req, res) {
  res.send('yes');
});

// TODO: Dropbox Datastores are limited to 100,000 records or 10MB.

app.post('/test', function(req, res) {
  var datastoreId = 'bozo';
  var openOrCreateDatastore = function(datastoreId, successCallback) {
    if (openDatastores[datastoreId]) {
      successCallback(openDatastores[datastoreId]);
    } else {
      var manager = client.getDatastoreManager();
      util.log('Opening datastore.');
      manager.openOrCreateDatastore(datastoreId, function(error, datastore) {
        if (error) {
          res.status(400);
          res.send({
            message: 'Could not open trackers datastore.',
            error: error
          });
        } else {
          // openDatastores[datastoreId] = datastore;
          // successCallback(openDatastores[datastoreId]);
          successCallback(datastore);
        }
      });
    }
  };
  var writeRecord = function(datastore) {
    try {
      util.log('Getting table.');
      var table = datastore.getTable('trackers');
      util.log('Inserting into table.');
      table.insert({
        name: req.body.name,
        valid: true
      });
      // util.log('Closing datastore.');
      // datastore.close();
      util.log('Sending response.');
      res.status(201);
      res.send();
    } catch (err) {
      util.error(err);
      res.status(400);
      res.send({
        message: 'Could not save tracker ' + req.body.name,
        error: err + ''
      });
    }
  };
  openOrCreateDatastore(datastoreId, writeRecord);
});

app.listen(3000);
util.log('env:' + app.get('env'));
