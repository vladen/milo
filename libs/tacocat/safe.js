import { isLog, Log } from './log';

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
    const result = callback();
    // @ts-ignore
    return result instanceof Promise
      ? result.catch(report)
      : result;
  } catch (error) {
    report();
  }
}
