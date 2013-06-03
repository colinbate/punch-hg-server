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
	remoteSitePublic: 'public',
	repo: ''
};

var opts = require('./config.json');
var config = utils.extend({}, defaults, opts);
var remoteSite = path.join(__dirname, config.remoteSiteCache);
var remoteSiteOutput = path.join(__dirname, config.remoteSitePublic);
console.log('Remote site: ' + remoteSite);
console.log('Output dir:  ' + remoteSiteOutput);

// Check the remote repo for updates
var repo = hg(config.repo, remoteSite);
var repoOk = repo.refresh();

// Run punch.generate()
var runGenerator = function (input, output) {
	var defer = q.defer();
	console.log('Generating site in ' + input + ' to ' + output);
	console.log('Changing working dir to: ' + input);
	try {
		var pwd = process.cwd();
		process.chdir(input);
		punch.SiteGenerator.setup({generator : {blank: true}});
		punch.SiteGenerator.generate(function () {
			console.log('Site generated!');
			process.chdir(pwd);
			defer.resolve();
		});
	} catch (err) {
		console.log('Could not change to ' + input + ', no site generated: ' + err);
		defer.reject(err);
	}
	return defer.promise;
};

repoOk.then(function () {
	return runGenerator(remoteSite, remoteSiteOutput);
}, function (err) {
	console.log('Error: ' + err);
	var defer = q.defer();
	remoteSiteOutput = path.join(__dirname, 'norepo');
	defer.resolve();
	return defer.promise;
}).then(setupWebServer);

// Start the connect server
var setupWebServer = function () {
	var runPort = process.env.PORT || config.port || 8080;
	var runHost = process.env.IP || config.host || '0.0.0.0';
	connect().use(
		// API for notifying of pushes
		connectRoute(function (app) {
			app.get('/_update', function (req, res, next) {
				if (repo.refresh()) {
					runGenerator();
				}
				res.end('OK');
			});
		}))
		.use(connect['static'](remoteSiteOutput))
	.listen(runPort, runHost);
	console.log('process ' + process.pid + ' running at ' + runHost + ':' + runPort + ' serving ' + remoteSiteOutput);
}