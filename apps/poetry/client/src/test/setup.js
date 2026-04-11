// Global test setup for vitest + jsdom

// localStorage polyfill (in case jsdom env is missing it)
if (!globalThis.localStorage || typeof globalThis.localStorage.getItem !== 'function') {
  const store = new Map()
  globalThis.localStorage = {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
    clear: () => store.clear()
  }
}

// matchMedia polyfill
if (!window.matchMedia) {
  window.matchMedia = (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false
  })
}

// requestAnimationFrame polyfill (tests should not rely on animation timing)
if (!window.requestAnimationFrame) {
  window.requestAnimationFrame = (cb) => setTimeout(() => cb(Date.now()), 16)
}
if (!window.cancelAnimationFrame) {
  window.cancelAnimationFrame = (id) => clearTimeout(id)
}
