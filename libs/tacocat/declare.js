import { projectObject } from './context.js';
import Log from './log.js';
import { safeAsyncEvery } from './safe.js';
import { isFunction, isNil, isObject } from './utilities.js';

/**
 * @param {({} | Tacocat.Internal.Declarer)[]} declarers
 * @returns {Tacocat.Internal.SafeDeclarer}
 */
function Declare(declarers) {
  const log = Log.common.module('declare');
  log.debug('Created:', { declarers });

  return async (control, context) => {
    if (control.signal?.aborted || !isObject(context)) return false;

    const success = await safeAsyncEvery(
      log,
      'Declarer callback error:',
      declarers,
      async (declarer, index) => {
        if (control.signal?.aborted) return false;

        if (isFunction(declarer)) {
          const newContext = await declarer(context, control.signal);
          if (isObject(newContext)) {
            if (newContext !== context) Object.assign(context, newContext);
            return true;
          }
          if (!isNil(newContext)) {
            log.warn('Unexpected declaration:', { context, newContext, declarer });
          }
          return false;
        }

        if (isObject(declarer)) {
          if (index === 0) projectObject(context, declarer);
          else Object.assign(context, declarer);
          return true;
        }

        return false;
      },
    );

    if (!success) return false;
    log.debug('Declared:', { context });
    return true;
  };
}

export default Declare;
