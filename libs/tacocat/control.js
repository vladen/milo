import Log from './log.js';
import { safeSync } from './safe.js';
import { isNil } from './util.js';

/**
 * @param {string} alias
 * @param {AbortSignal?} signal
 * @returns {Tacocat.Engine.Control}
 */
function Control(alias, signal) {
  const log = Log.common.module('control', alias);

  /**
   * @param {Tacocat.Engine.Disposer[]} disposers
   */
  function dispose(disposers) {
    disposers?.forEach((disposer) => safeSync(log, 'Disposer callback error:', disposer));
  }

  /** @type {Map<any, Tacocat.Engine.Disposer[]>} */
  const disposers = new Map();

  signal?.addEventListener?.(
    'abort',
    () => {
      log.debug('Aborted:', signal.reason?.message ?? signal.reason);
      dispose([...disposers.values()].flat());
    },
    { once: true },
  );

  log.debug('Activated:', { signal });

  return {
    get alias() {
      return alias;
    },
    dispose(disposer, key = null) {
      /** @type {Tacocat.Engine.Disposer[]} */
      const newDisposers = Array.isArray(disposer) ? disposer.flat(3) : [disposer];
      if (signal?.aborted) {
        dispose(newDisposers);
        return true;
      }
      if (!disposers.has(key)) disposers.set(key, []);
      disposers.set(key, [...newDisposers, ...disposers.get(key)]);
      return false;
    },

    release(key) {
      if (!isNil(key)) dispose(disposers.get(key));
    },

    signal,
  };
}

export default Control;
