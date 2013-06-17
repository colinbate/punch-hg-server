var NoContentError = function (message) {
  this.message = message || '';
  this.name = 'NoContentError';
};

NoContentError.prototype = new Error();
NoContentError.prototype.toString = function () {
  return 'Cannot run site, no content found: ' + this.message;
};

var FailedUpdateError = function (message) {
  this.message = message || '';
  this.name = 'FailedUpdateError';
}

FailedUpdateError.prototype = new Error();
FailedUpdateError.prototype.toString = function () {
  return 'Could not update site, serving existing site: ' + this.message;
};

module.exports = {
  NoContentError : NoContentError,
  FailedUpdateError : FailedUpdateError
};