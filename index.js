/*jslint node: true, white: true, nomen: true */
'use strict';

var connect = require('connect');
var connectRoute = require('connect-route');
var hg = require('./lib/hg-fetch');
var utils = require('./lib/utils');
var punch = require('./lib/punch-site');
var errors = require('./lib/errors');
var path = require('path');

// Load the config
var defaults = {
  port: 8080,
  host: '0.0.0.0',
  remoteSiteCache: 'data',
  repo: ''
};

var config = utils.getConfig(__dirname, defaults),
    remoteSite = path.join(__dirname, config.remoteSiteCache),
    runPort = process.env.PORT || config.port,
    runHost = process.env.IP || config.host,
    remoteSiteOutput,
    punchInstance,

    // Check the remote repo for updates
    repo = hg(config.repo, remoteSite);


// Start the connect server
var setupWebServer = function (opts) {
  var server = connect(),
      handler = function (req, res) {
        repo.refresh().then(function () {
          opts.site.generate();
        }).then(function () {
          res.end('OK');
        }, function (err) {
          res.end('Fail: ' + err);
        });
      };
  if (opts.autoUpdate) {
    server.use(connectRoute(function (app) {
      app.get('/_update', handler);
      app.post('/_update', handler);
    }));
  }
  server.use(connect['static'](opts.outputPath));
  server.listen(opts.port, opts.host);
  console.log('process ' + process.pid + ' running at ' + opts.host + ':' + opts.port + ' serving ' + opts.outputPath);
};

repo.refresh().then(function () {
  return punch(remoteSite);
}).then(function (site) {
  punchInstance = site;
  return site.generate();
}).fail(function (err) {
  if (err instanceof errors.NoContentError) {
    throw err;
  }
  return punchInstance.outputPath;
}).then(function (outputDir) {
  var options = {
    autoUpdate: !!punchInstance,
    outputPath: outputDir,
    host: runHost,
    port: runPort,
    site: punchInstance
  };
  setupWebServer(options);
}).fail(function (err) {
  console.log(err.toString());
});


