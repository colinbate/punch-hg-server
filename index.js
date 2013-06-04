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
	var makeAbsolute = function (dir) {
		return path.join(input, dir);
	};
	var defer = q.defer();
	console.log('Generating site in ' + input + ' to ' + output);
	console.log('Changing working dir to: ' + input);
	try {
		var pwd = process.cwd();
		process.chdir(input);
		punch.ConfigHandler.getConfig(false, function (config) {
			config.generator.blank = true;
			//config.template_dir = makeAbsolute(config.template_dir);
			//config.content_dir = makeAbsolute(config.content_dir);
			//config.output_dir = makeAbsolute(config.output_dir);
			//config.shared_content = makeAbsolute(config.shared_content);

			//console.log(require('util').inspect(config));
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
	var runPort = process.env.PORT || config.port || 8080;
	var runHost = process.env.IP || config.host || '0.0.0.0';
	connect().use(
		// API for notifying of pushes
		connectRoute(function (app) {
			app.post('/_update', function (req, res, next) {
				repo.refresh().then(function () {
					runGenerator(remoteSite, remoteSiteOutput);
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
	return runGenerator(remoteSite, remoteSiteOutput);
}).fail(function (err) {
	console.log('Error: ' + err);
	var defer = q.defer();
	remoteSiteOutput = path.join(__dirname, 'norepo');
	defer.resolve();
	return defer.promise;
}).then(setupWebServer);


