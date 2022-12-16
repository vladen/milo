import Log from './log.js';
import { safeSync } from './safe.js';
import { delay, isNil } from './utilities.js';

const defaults = { signal: undefined, timeout: 30000 };
const log = Log.common.module('control');

export function dispose(disposer) {
  safeSync(log, 'Disposer callback error:', disposer);
}

/**
 * @param {Tacocat.Engine.Control} control
 * @returns {Tacocat.Internal.Control}
 */
function Control({
  signal,
  timeout = defaults.timeout,
} = defaults) {
  /** @type {Map<any, (() => void)[]>} */
  const disposers = new Map();
  const aborted = new Promise((_, reject) => {
    signal?.addEventListener('abort', () => {
      const error = new Error('Aborted');
      log.info(error.message);
      [...disposers.values()].flat().forEach(dispose);
      reject(error);
    });
  });
  // prevents uncaught promise rejection
  aborted.catch(() => {});

  return {
    get promise() {
      const expired = delay(timeout, signal).then(() => {
        throw new Error('Expired');
      });
      expired.catch(() => {});
      return Promise.race([aborted, expired]);
    },
    dismiss(key) {
      if (!isNil(key)) disposers.get(key)?.forEach(dispose);
    },
    dispose(disposer, key = null) {
      if (signal?.aborted) {
        dispose(disposer);
      } else {
        if (!disposers.has(key)) disposers.set(key, []);
        disposers.get(key).push(disposer);
      }
    },
    signal,
    timeout,
  };
}

export default Control;
