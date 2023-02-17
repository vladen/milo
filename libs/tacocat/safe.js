import Log, { isLog } from './log.js';
import { isFunction } from './utilities.js';

const getLog = (log) => (isLog(log) ? log : Log.common ?? console);

/**
 * @template T
 * @param {Tacocat.Log.Instance} log
 * @param {string} message
 * @param {() => T | Promise<T>} operation
 * @returns {Promise<T>}
 */
function safeAsync(log, message, operation) {
  const reportError = (error) => {
    getLog(log).error(message, error);
    return Promise.reject(error);
  };
  try {
    return Promise.resolve(operation()).catch(reportError);
  } catch (error) {
    return reportError(error);
  }
}

/**
 * @template T
 * @param {Tacocat.Log.Instance} log
 * @param {string} message
 * @param {T[]} array
 * @param {(item: T, index: number) => boolean} operation
 * @returns {Promise<boolean>}
 */
function safeAsyncPipe(log, message, array, operation) {
  const safePipeStep = (index) => {
    if (index < array.length) {
      return safeAsync(log, message, () => operation(array[index], index)).then(
        () => safePipeStep(index + 1),
        () => Promise.resolve(false),
      );
    }
    return Promise.resolve(true);
  };

  return safePipeStep(0);
}

/**
 * @template T
 * @param {Tacocat.Log.Instance} log
 * @param {string} message
 * @param {() => T} operation
 * @returns {T}
 */
function safeSync(log, message, operation) {
  try {
    return operation();
  } catch (error) {
    getLog(log).error(message, error);
    return undefined;
  }
}

export { safeAsync, safeAsyncPipe, safeSync };
