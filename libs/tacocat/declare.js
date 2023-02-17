import { projectObject } from './context.js';
import Log from './log.js';
import { safeAsyncPipe } from './safe.js';
import { isFunction, isNil, isObject } from './utilities.js';

/**
 * @param {({} | Tacocat.Internal.Declarer)[]} declarers
 * @returns {Tacocat.Internal.SafeDeclarer}
 */
function Declare(declarers) {
  const log = Log.common.module('declare');
  log.debug('Created:', { declarers });

  return (control, context) => {
    if (isNil(context)) return Promise.resolve(false);
    return safeAsyncPipe(log, 'Declarer callback error:', declarers, (declarer, index) => {
      if (control.signal?.aborted) return false;
      let declaration;
      if (isFunction(declarer)) {
        declaration = declarer(context);
        if (isObject(declaration)) {
          Object.assign(context, declaration);
          return true;
        }
      } else if (isObject(declarer)) {
        declaration = declarer;
        if (index === 0) projectObject(context, declaration);
        else Object.assign(context, declaration);
      }

      if (!isNil(declaration)) {
        log.warn('Unexpected declaration:', { declaration, declarer });
      }
      return false;
    }).then((result) => {
      if (!result) return false;
      log.debug('Declared:', { context, declarers });
      return true;
    });
  };
}

export default Declare;
