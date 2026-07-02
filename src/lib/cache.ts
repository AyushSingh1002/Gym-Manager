const store = new Map<string, { data: unknown; expiry: number }>()

export function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 30_000
): Promise<T> {
  const cached = store.get(key)
  if (cached && cached.expiry > Date.now()) {
    return Promise.resolve(cached.data as T)
  }
  return fetcher().then((data) => {
    store.set(key, { data, expiry: Date.now() + ttl })
    return data
  })
}

export function invalidateCache(keyPrefix?: string) {
  if (!keyPrefix) {
    store.clear()
    return
  }
  for (const key of store.keys()) {
    if (key.startsWith(keyPrefix)) {
      store.delete(key)
    }
  }
}
