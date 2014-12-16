var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('../config.json');
var Dropbox = require('../dropbox-datastores-1.2-latest.js');

/* GET home page. */
router.get('/test', function(req, res) {
  res.send('yes');
});

var client = new Dropbox.Client({
  key: config.dropbox.key,
  secret: config.dropbox.secret,
  token: 'E5k8eGItbv4AAAAAAAACEli8pO41LWT0W5M44azEhsJuMagnRdw5zBJEbsP5pWR_',
  uid: '15167810'
});
var openDatastores = {};

// TODO: Dropbox Datastores are limited to 100,000 records or 10MB.

router.post('/getToken', function(req, res) {
  var authorizationCode = req.body.code;
  var redirectUri = req.body.redirectUri;

  request.post('https://api.moves-app.com/oauth/v1/access_token?grant_type=authorization_code&code=' +
      authorizationCode + '&client_id=' + config.moves.clientId + '&client_secret=' + config.moves.clientSecret +
      '&redirect_uri=' + redirectUri).pipe(res);

/*
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
  */
});

module.exports = router;
