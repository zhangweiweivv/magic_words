/**
 * Per-file write locking using Promise-based mutex.
 * Prevents race conditions on concurrent read-modify-write operations.
 */

const locks = new Map();

/**
 * Acquire a lock for the given file path, execute fn, then release.
 * If another call is already holding the lock for the same path,
 * this call will wait until it's released.
 *
 * @param {string} filePath - The file path to lock on
 * @param {Function} fn - Async function to execute while holding the lock
 * @returns {Promise<*>} - Result of fn
 */
async function withFileLock(filePath, fn) {
  if (!locks.has(filePath)) {
    locks.set(filePath, Promise.resolve());
  }

  let release;
  const acquirePromise = new Promise((resolve) => {
    release = resolve;
  });

  // Chain onto existing lock
  const previousLock = locks.get(filePath);
  locks.set(filePath, previousLock.then(() => acquirePromise));

  // Wait for previous lock to release
  await previousLock;

  try {
    return await fn();
  } finally {
    release();
  }
}

module.exports = { withFileLock };
