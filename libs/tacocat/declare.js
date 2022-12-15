import { projectObject } from './context.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isFunction, isNil, isObject } from './utilities.js';

const log = Log.common.module('declare');

/**
 * @param {({} | Tacocat.Internal.Declarer)[]} declarers
 * @returns {Tacocat.Internal.SafeDeclarer}
 */
const Declare = (declarers) => (context) => {
  if (!isNil(context) && declarers.every((declarer, index) => {
    let declared;
    if (isFunction(declarer)) {
      declared = safeSync(
        log,
        'Declarer callback error:',
        () => declarer(context),
      );
      if (isObject(declared)) {
        Object.assign(context, declared);
        return true;
      }
    }
    if (isObject(declarer)) {
      declared = declarer;
      if (index === 0) projectObject(context, declared);
      else Object.assign(context, declared);
      return true;
    }
    if (!isNil(declared)) {
      log.warn('Unexpected declared type:', { declared, declarer });
    }
    return false;
  })) {
    log.debug('Declared:', { context, declarers });
    return true;
  }
  return false;
};

export default Declare;
