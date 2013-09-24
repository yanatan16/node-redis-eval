node-redis-eval  [![Build Status][1]][2]
===============

A small package to help calling lua scripts in Redis. It manages caching the script in the redis instance and caches the sha1 hash locally; also, it checks to see if the redis has already cached this script before sending it.


## Usage

Install:

```
npm install redis-eval --save
```

In Code:

```javascript

var redis = require('redis')
  client = redis.createClient(),
  reval = require('redis-eval'),
  script = __dirname + '/myluascript.lua';

reval(client, script, ['key1', 'key2'], ['arg1', 'arg2'], callback);
```

## License

See [LICENSE](https://github.com/yanatan16/node-redis-eval)



[1]: https://travis-ci.org/yanatan16/node-redis-eval.png?branch=master
[2]: http://travis-ci.org/yanatan16/node-redis-eval