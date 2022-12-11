import Log, { isLog } from './log.js';
import { isFunction, isPromise } from './utilities.js';

/**
 * @template T
 * @type {Tacocat.Safe<T>}
 * @returns {T}
 */
export default function safe(message, callback, log) {
  const report = (error) => {
    (isLog(log) ? log : Log.common ?? console).error(message, error);
  };
  try {
    const result = isFunction(callback) ? callback() : callback;
    // @ts-ignore
    return isPromise(result) ? result.catch(report) : result;
  } catch (error) {
    report(error);
    return undefined;
  }
}
