import NodeCache from "node-cache";

class Cache {
  private cache: NodeCache = new NodeCache();
  private static instance: Cache;
  private constructor() {}

  public static getInstance(): Cache {
    if (!Cache.instance) Cache.instance = new Cache();
    return Cache.instance;
  }

  get = this.cache.get;
  set = this.cache.set;
  del = this.cache.del;
  flushAll = this.cache.flushAll;
}

const RequestCache = Cache.getInstance();
export default RequestCache;
