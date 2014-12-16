var express = require('express');
var router = express.Router();
var request = require('request');
var config = require('./config.json');
var Dropbox = require('./dropbox-datastores-1.2-latest.js');
var Q = require('q');
var util = require('util');

/* GET home page. */
router.get('/test', function(req, res) {
  res.send('yes');
});

// Open or create datastore promise.
var openOrCreateDatastore = function(client, datastoreId) {
  var deferred = Q.defer();
  var manager = client.getDatastoreManager();
  manager.openOrCreateDatastore(datastoreId, function(error, datastore) {
    if (error) {
      deferred.reject(error);
    } else {
      deferred.resolve(datastore);
    }
  });
  return deferred.promise;
};

router.post('/getToken', function(req, res) {
  var authorizationCode = req.body.code;
  var redirectUri = req.body.redirectUri;

  request.post('https://api.moves-app.com/oauth/v1/access_token?grant_type=authorization_code&code=' +
      authorizationCode + '&client_id=' + config.moves.clientId + '&client_secret=' + config.moves.clientSecret +
      '&redirect_uri=' + redirectUri).pipe(res);
});

router.post('/getAll', function(req, res) {
  var movesToken = req.body.movesToken;
  var dropboxToken = req.body.dropboxToken;
  var dropboxUid = req.body.dropboxUid;

  // Retrieve Moves data and open datastore in parallel.
  var client = new Dropbox.Client({
    key: config.dropbox.key,
    secret: config.dropbox.secret,
    token: dropboxToken,
    uid: dropboxUid
  });

  var datastorePromise = openOrCreateDatastore(client, 'moves_data').catch(function(error) {
    res.status(400);
    res.send({
      message: 'Could not open Dropbox datastore.',
      error: error
    });
  });

  var movesPromise = function() {
    var deferred = Q.defer();
    request.get({
      url: config.moves.API_URL + '/user/profile',
      headers: {
        Authorization: 'Bearer ' + movesToken
      }
    }, function(error, response, body) {
      if (error) {
        res.status(400);
        res.send({
          message: 'Could not get Moves user profile.',
          error: error
        });
        deferred.reject(error);
      } else {
        body = JSON.parse(body);
        // Fetch all of users data until yesterday.
        // TODO: Fetch all data, not just last 31 days.
        var firstDate = body.profile.firstDate;
        request.get({
          url: config.moves.API_URL + '/user/storyline/daily?pastDays=31',
          headers: {
            Authorization: 'Bearer ' + movesToken
          }
        }, function(error, response, body) {
          if (error) {
            res.status(400);
            res.send({
              message: 'Could not get Moves storyline.',
              error: error
            });
            deferred.reject(error);
          } else {
            body = JSON.parse(body);
            deferred.resolve(body);
          }
        });
      }
    });
    return deferred.promise;
  }();

  Q.all([datastorePromise, movesPromise]).spread(function(datastore, data) {
    util.debug(req.originalUrl + ': Got datastore and data.');
    try {
      var table = datastore.getTable('moves_data');
      for (var i = 0; i < data.length; i++) {
        var record = table.getOrInsert(data[i].date);
        record.set('data', JSON.stringify(data[i]));
      }
      res.send({
        days: data.length
      });
    } catch (error) {
      util.error(error);
      res.status(400);
      res.send({
        message: 'Could not save Moves storylines.',
        error: error + ''
      });
    }
  });

});

module.exports = router;
