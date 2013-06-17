/*jslint node: true, white: true */
'use strict';

var hg = require('hg');
var fs = require('fs');
var path = require('path');
var q = require('q');
var errors = require('./errors');



var addRepoFolder = function (dest) {
	return path.join(dest, '.hg');
};

var clone = function (defer) {
	console.log('Cloning ' + this.location + ' into ' + this.dest);
	hg.clone(this.location, this.dest, function (err) {
		if (err) {
			defer.reject(new errors.NoContentError(err));
			return;
		}
		console.log('Clone succeeded.');
		defer.resolve();
	});
};

var pullUpdate = function (defer) {
	console.log('Pulling and updating ' + this.location + ' into ' + this.dest);
	var repo = new hg.HGRepo(this.dest);
	repo.pull(this.location, {'-u': ''}, function (err) {
		if (err) {
			defer.reject(new errors.FailedUpdateError(err));
			return;
		}
		defer.resolve();
	});
};

var Repo = function (repoLocation, dest) {
	this.location = repoLocation;
	this.dest = dest;
};

Repo.prototype.refresh = function () {
	var self = this,
		hgPath,
		defer = q.defer();
	if (!this.location) {
		defer.reject(new errors.NoContentError('No repository configured, check your config.json file.'));
		return defer.promise;
	}
	fs.exists(this.dest, function (exist) {
		if (!exist) {
			clone.apply(self, [defer]);
		} else {
			hgPath = addRepoFolder(self.dest);
			fs.exists(hgPath, function (hgExist) {
				if (hgExist) {
					pullUpdate.apply(self, [defer]);
				} else {
					clone.apply(self, [defer]);
				}
			});
		}
	});
	return defer.promise;
};

var newRepo = function (repoLocation, dest) {
	return new Repo(repoLocation, dest);
};

module.exports = newRepo;

