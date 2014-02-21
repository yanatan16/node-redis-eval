// evaltest.js
// Test redis-eval

process.on('uncaughtException', function (err) {
  console.error(err.stack);
});

var redis = require('redis').createClient(),
  _ = require('underscore'),
  async = require('async'),
  Moniker = require('moniker');

var reval = require('..');

var tests = module.exports = {};

tests.calltwice = function calltwice(test) {
  var key = 'evaltest:' + Moniker.choose(),
    field = 'afield',
    file = __dirname + '/testscript.lua';

  async.series([
    _.bind(redis.hset, redis, key, field, "ghi"),
    _.bind(reval, null, redis, file, [key], [field]),
    _.bind(reval, null, redis, file, [key], [field]),
  ], function (err, results) {
    test.ifError(err);
    test.deepEqual(results[1], ["abc", "def", "ghi"]);
    test.deepEqual(results[2], ["abc", "def", "ghi"]);
    test.done();
  });
};

tests.cleanUp = function (test) {
  redis.end();
  test.done();
};