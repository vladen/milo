import Log from './log.js';
import { safeSync } from './safe.js';
import { delay } from './utilities.js';

export function dispose(disposer) {
  safeSync(Log.common, 'Disposer callback error:', disposer);
}

/**
 * @param {Tacocat.Engine.Control} control
 * @returns {Tacocat.Internal.Control}
 */
function Control({ signal, timeout = 30000 }) {
  const disposers = new Set();
  signal.addEventListener('abort', () => {
    disposers.forEach(dispose);
  });

  return {
    dispose(disposer) {
      if (signal.aborted) {
        dispose(disposer);
      } else {
        disposers.add(disposer);
      }
    },
    get promise() {
      return delay(timeout, signal);
    },
    signal,
    timeout,
  };
}

export default Control;
