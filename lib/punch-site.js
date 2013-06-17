/*jslint node: true, white: true */
// Generates the punch site once a notification is received.
'use strict';

var punch = require('punch');
var q = require('q');
var path = require('path');
var errors = require('./errors');

var PunchSite = function (folder, outputPath, generator) {
  var self = this;
  self.folder = folder;
  self.outputPath = outputPath;
  self.generator = generator;
};

PunchSite.prototype.generate = function () {
  var self = this,
      defer = q.defer();

  self.generator.generate(function () {
    console.log('Site generated!');
    defer.resolve(self.outputPath);
  });
    
  return defer.promise;
};

var getPunchSite = function (folder) {
  var defer = q.defer(),
      outputPath = null;
  try {
    process.chdir(folder);
    punch.ConfigHandler.getConfig(false, function (config) {
      outputPath = path.join(folder, config.output_dir);
      config.generator.blank = true;
      punch.SiteGenerator.setup(config);
      defer.resolve(new PunchSite(folder, outputPath, punch.SiteGenerator));
    });
  } catch (err) {
    defer.reject(new errors.FailedUpdateError('Could not change cwd to: ' + folder + ', no site generated: ' + err));
  }
  return defer.promise;
};

module.exports = getPunchSite;