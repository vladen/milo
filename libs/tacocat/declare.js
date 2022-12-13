import { projectObject } from './context.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isFunction, isObject, isUndefined } from './utilities.js';

const log = Log.common.module('declare');

/**
 * @param {({} | Tacocat.Internal.Declarer)[]} declarers
 * @returns {Tacocat.Internal.SafeDeclarer}
 */
const Declare = (declarers) => () => {
  let context;

  declarers.forEach((declarer) => {
    if (isFunction(declarer)) {
      const result = safeSync(
        log,
        'Declarer callback error:',
        () => declarer(context),
      );
      if (isObject(result)) {
        if (isUndefined(context)) context = { ...result };
        else Object.assign(context, result);
      } else {
        log.warn('Unexpected type:', { declarer, result });
      }
    } else if (isObject(declarer)) {
      if (isUndefined(context)) context = projectObject(declarer);
      else Object.assign(context, declarer);
    } else {
      log.warn('Unexpected type:', { declarer });
    }
  });

  log.debug('Declared:', { context, declarers });
  return context;
};

export default Declare;
