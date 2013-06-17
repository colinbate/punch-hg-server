var slice = Array.prototype.slice,
	path = require('path'),
	fs = require('fs'),
	breaker = {},
	nativeForEach = Array.prototype.forEach,
	each = function(obj, iterator, context) {
		if (obj == null) return;
		if (nativeForEach && obj.forEach === nativeForEach) {
			obj.forEach(iterator, context);
		} else if (obj.length === +obj.length) {
			for (var i = 0, l = obj.length; i < l; i++) {
				if (iterator.call(context, obj[i], i, obj) === breaker) return;
			}
		} else {
			for (var key in obj) {
				if (_.has(obj, key)) {
					if (iterator.call(context, obj[key], key, obj) === breaker) return;
				}
			}
		}
	},
	extend = function(obj) {
		each(slice.call(arguments, 1), function(source) {
			if (source) {
				for (var prop in source) {
					obj[prop] = source[prop];
				}
			}
		});
		return obj;
	},
	getConfig = function (dir, defaults) {
		var confFile = path.join(dir, 'config.json'),
			exists = fs.existsSync(confFile),
			opts;
		if (!exists) {
			return defaults;
		}
		opts = require(confFile);
		return extend({}, defaults, opts);
	};


module.exports = {
	each : each,
	extend : extend,
	getConfig : getConfig
};