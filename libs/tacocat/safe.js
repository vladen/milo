import { Log } from './log';
import { isFunction, isPromise } from './utilities';

/**
 * @template T
 * @type {Tacocat.Safe<T>}
 * @returns {T}
 */
export default function safe(message, callback, log) {
  const report = (error) => {
    (log ?? Log.common ?? console).error(message, error);
  };
  try {
    let result = isFunction(callback) ? callback() : callback;
    // @ts-ignore
    return isPromise(result) ? result.catch(report) : result;
  } catch (error) {
    report(error);
  }
}
