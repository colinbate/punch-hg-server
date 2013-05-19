var hg = require('hg');

var Repo = function (repoLocation, dest) {
	this.location = repoLocation;
	this.dest = dest;
};

Repo.prototype.refresh = function () {
	console.log('Refreshing ' + this.location + ' into ' + this.dest);
	return false;
}

var newRepo = function (repoLocation, dest) {
	return new Repo(repoLocation, dest);
}

module.exports = newRepo;

