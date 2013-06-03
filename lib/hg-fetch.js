var hg = require('hg');
var fs = require('fs');
var path = require('path');
var q = require('q');

var Repo = function (repoLocation, dest) {
	this.location = repoLocation;
	this.dest = dest;
};

Repo.prototype.refresh = function () {
	var self = this,
		hgPath,
		defer = q.defer();
	if (!this.location) {
		defer.reject(new Error('No repo configured... not refreshing'));
		return defer.promise;
	}
	if (!fs.existsSync(this.dest)) {
		console.log('Destination ' + self.dest + ' does not exist. Clone.');
		clone.apply(self, [defer]);
	} else {
		console.log('Destination ' + self.dest + ' does exist, checking if clone.')
		hgPath = addRepoFolder(self.dest);
		if (fs.existsSync(hgPath)) {
			console.log('We have a repo already... only need to update.');
			pullUpdate.apply(self, [defer]);
		} else {
			console.log('Not a repo, clone away.');
			clone.apply(self, [defer]);
		}
	}
	return defer.promise;
};

var addRepoFolder = function (dest) {
	return path.join(dest, '.hg');
};

var clone = function (defer) {
	console.log('Cloning ' + this.location + ' into ' + this.dest);
	hg.clone(this.location, this.dest, function (err, output) {
		if (err) {
			defer.reject(err);
		}
		console.log('Clone succeeded.');
		defer.resolve()
	});
};

var pullUpdate = function (defer) {
	console.log('Pulling and updating ' + this.location + ' into ' + this.dest);
	var repo = new hg.HGRepo(this.dest);
	repo.pull(this.location, {'-u': ''}, function (err, output) {
		if (err) {
			defer.reject(err);
			return;
		}
		console.log('Pulled and hopefully updated');
		defer.resolve();
	});
};

var newRepo = function (repoLocation, dest) {
	return new Repo(repoLocation, dest);
};

module.exports = newRepo;

