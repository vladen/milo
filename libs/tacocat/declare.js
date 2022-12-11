import Log from "./log";
import safe from "./safe";
import { isFunction, isObject, isUndefined, projectObject } from "./utilities";

const log = Log.common.module('declare');

/**
 * @param {({} | Tacocat.Internal.Declarer)[]} declarers 
 * @returns {Tacocat.Internal.CombinedDeclarer}
 */
const Declare = (declarers) => () => {
  let context;
  for (const declarer of declarers) {
    if (isFunction(declarer)) {
      const result = safe('Declarer callback error:', () => declarer(context), log);
      if (!isObject(result)) return undefined;
      if (isUndefined(context)) context = result;
      else Object.assign(context, result);
    } else if (isObject(declarer)) {
      if (isUndefined(context)) context = projectObject(declarer);
      else Object.assign(context, declarer);
    }
  }
  log.debug('Declared:', { context, declarers });
  return context;
};

export default Declare;
