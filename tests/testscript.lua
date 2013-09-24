local tmp = redis.call("hget", KEYS[1], ARGV[1])
return {"abc", "def", tmp}