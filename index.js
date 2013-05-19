'use strict';

var connect = require('connect');
var connectRoute = require('connect-route');
var hg = require('./lib/hg-fetch');
var punch = require('punch');

var path = require('path');
//var fs = require('fs');

// 1. Load the config
var defaults = {
	port: 8080,
	host: '0.0.0.0',
	remoteSiteCache: 'data',
	remoteSitePublic: 'public',
	repo: ''
};

var config = defaults;
var remoteSite = path.join(__dirname, config.remoteSiteCache);
var remoteSiteOutput = path.join(__dirname, config.remoteSiteCache, config.remoteSitePublic);
console.log('Remote site: ' + remoteSite);
console.log('Output dir:  ' + remoteSiteOutput);

// 2. Check the remote repo for updates
var repo = hg(config.repo, remoteSite);
var repoOk = repo.refresh();

// 3. Run punch.generate()
//punch.SiteGenerator
var runGenerator = function (input, output) {
	console.log('Generating site in ' + input + ' to ' + output);
};

if (repoOk) {
	runGenerator(remoteSite, remoteSiteOutput);
} else {
	remoteSiteOutput = path.join(__dirname, 'norepo');
}

// 5. Start the connect server
var runPort = process.env.PORT || config.port || 8080;
var runHost = process.env.IP || config.host || '0.0.0.0';
connect().use(
	// API for notifying of pushes
	connectRoute(function (app) {
		app.post('/_update', function (req, res, next) {
			if (repo.refresh()) {
				runGenerator();
			}
		});
	}))
	.use(connect['static'](remoteSiteOutput))
.listen(runPort, runHost);
console.log('process ' + process.pid + ' running at ' + runHost + ':' + runPort + ' serving ' + remoteSiteOutput);