// redis-eval/index.js
// Evaluate custom lua scripts

// builtin
var fs = require('fs'),
  path = require('path'),
  crypto = require('crypto');

// vendor
var async = require('async'),
  _ = require('underscore');

// Once scripts are loaded into redis, we only refer to them as their sha-1 hash.
var shas = {};

// -- Export --
module.exports = evaluateScript;

// -- Main Eval Function --
function evaluateScript(redis, script_name, keys, args, callback) {
  callback = onerror(callback)
  var sha = shas[script_name];
  if (sha) {
    // Script is loaded
    return evalSha(redis, sha, keys, args, callback);
  }

  readScript(script_name, function (err, script) {
    if (err) return err;

    var sha = shaify(script);
    checkLoaded(redis, script_name, sha, function (err, exists) {
      if (err) {
        return callback(err)
      }
      if (exists) {
        return evalSha(redis, sha, keys, args, callback);
      }
      // Load and then execute
      async.waterfall([
        _.bind(loadScript, null, redis, script_name, script),
        function (sha, cb) {
          evalSha(redis, sha, keys, args, cb);
        }
      ], callback);
    });
  });
}

// If an error occurs, we must be prudent and assume data was lost. We clean the shas cache.
function onerror(cb) {
  return function (err) {
    if (err) {
      shas = {}
      arguments[0] = err instanceof Error ? err : new Error(err.toString())
    }
    cb.apply(null, arguments)
  }
}

// -- Helper functions --

function shaify(script) {
  return crypto.createHash('sha1').update(script).digest('hex');
}

function readScript(script_name, callback) {
  fs.readFile(script_name, 'utf-8', callback);
}

function checkLoaded(redis, script_name, sha, callback) {
  redis.multi()
    .script('exists', sha)
    .exec(function (err, exists) {
      if (!err && exists) {
        shas[script_name] = sha;
      }
      exists = _.flatten(exists);
      callback(err, exists && exists.length > 0 && exists[0]);
    });
}

// Evaluate a script that is already loaded
function evalSha(redis, sha, keys, args, callback) {
  if (sha) {
    return redis.evalsha.apply(redis, _.flatten([sha, keys.length, keys, args, callback]));
  }
  return callback(new Error('evalsha called for not loaded script'));
}

// Load a script into the script cache
function loadScript(redis, script_name, script, callback) {
  redis.multi()
    .script('load', script)
    .exec(function (err, sha1) {
      if (err) {
        return callback(err);
      }
      shas[script_name] = sha1 && sha1.length && sha1[0];
      callback(null, sha1);
    });
}