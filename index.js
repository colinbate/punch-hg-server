/*jslint node: true , white: true, nomen: true */
'use strict';

var connect = require('connect');
var connectRoute = require('connect-route');
var hg = require('./lib/hg-fetch');
var utils = require('./lib/utils');
var punch = require('punch');
var q = require('q');
var path = require('path');

// Load the config
var defaults = {
  port: 8080,
  host: '0.0.0.0',
  remoteSiteCache: 'data',
  repo: ''
};

var opts = require('./config.json'),
    config = utils.extend({}, defaults, opts),
    remoteSite = path.join(__dirname, config.remoteSiteCache),
    remoteSiteOutput,

    // Check the remote repo for updates
    repo = hg(config.repo, remoteSite),
    repoOk = repo.refresh();

// Run punch.generate()
var runGenerator = function (input) {
  var defer = q.defer();
  console.log('Changing working dir to: ' + input);
  try {

    process.chdir(input);
    punch.ConfigHandler.getConfig(false, function (config) {
      remoteSiteOutput = path.join(remoteSite, config.output_dir);
      //console.log(require('util').inspect(config));
      config.generator.blank = true;
      punch.SiteGenerator.setup(config);
      punch.SiteGenerator.generate(function () {
        console.log('Site generated!');
        defer.resolve();
      });
    });
    
  } catch (err) {
    console.log('Could not change to ' + input + ', no site generated: ' + err);
    defer.reject(err);
  }
  return defer.promise;
};

// Start the connect server
var setupWebServer = function () {
  var runPort = process.env.PORT || config.port || 8080,
      runHost = process.env.IP || config.host || '0.0.0.0';
  connect().use(
    // API for notifying of pushes
    connectRoute(function (app) {
      app.post('/_update', function (req, res) {
        repo.refresh().then(function () {
          runGenerator(remoteSite);
        }).then(function () {
          res.end('OK');
        }, function (err) {
          res.end('Fail: ' + err);
        });
      });
    }))
    .use(connect['static'](remoteSiteOutput))
  .listen(runPort, runHost);
  console.log('process ' + process.pid + ' running at ' + runHost + ':' + runPort + ' serving ' + remoteSiteOutput);
};

repoOk.then(function () {
  return runGenerator(remoteSite);
}).fail(function (err) {
  var defer = q.defer();
  console.log(err);
  remoteSiteOutput = path.join(__dirname, 'norepo');
  defer.resolve();
  return defer.promise;
}).then(setupWebServer);


