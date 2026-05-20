import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });

export function cacheGet(key) {
  return cache.get(key);
}

export function cacheSet(key, value, ttl) {
  cache.set(key, value, ttl ?? 60);
}

export function cacheDel(key) {
  cache.del(key);
}

export function cacheDelByPrefix(prefix) {
  const keys = cache.keys().filter((k) => k.startsWith(prefix));
  if (keys.length) cache.del(keys);
}
