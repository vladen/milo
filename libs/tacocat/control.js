import Log from './log.js';
import { safeSync } from './safe.js';
import { delay, isFunction, isNil } from './utilities.js';

const defaults = { signal: undefined, timeout: 30000 };

/**
 * @param {Tacocat.Engine.Control} control
 * @returns {Tacocat.Internal.Control}
 */
function Control({
  signal,
  timeout = defaults.timeout,
} = defaults) {
  const log = Log.common.module('control');

  function dispose(disposer) {
    safeSync(log, 'Disposer callback error:', disposer);
  }

  /** @type {Map<any, (() => void)[]>} */
  const disposers = new Map();

  const onAbort = (listener) => signal?.addEventListener(
    'abort',
    listener,
    { once: true },
  );

  onAbort(() => {
    log.debug('Aborted:', signal.reason?.message ?? signal.reason);
    [...disposers.values()].flat().forEach(dispose);
  });

  log.debug('Created:', { signal, timeout });

  return {
    dispose(disposer, key = null) {
      if (signal?.aborted) {
        dispose(disposer);
        return true;
      }
      if (!disposers.has(key)) disposers.set(key, []);
      disposers.get(key).unshift(disposer);
      return false;
    },

    async expire(fallback) {
      await Promise.race([
        new Promise(onAbort),
        delay(timeout, signal).then(() => {
          log.debug('Expired:', timeout);
        }),
      ]);

      return isFunction(fallback)
        // @ts-ignore
        ? safeSync(log, 'Fallback error:', fallback)
        : fallback;
    },

    release(key) {
      if (!isNil(key)) disposers.get(key)?.forEach(dispose);
    },

    signal,
    timeout,
  };
}

export default Control;
