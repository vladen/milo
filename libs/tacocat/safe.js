import Log from './log.js';
import { isFunction } from './util.js';

/**
 * @param {Tacocat.Log.Instance} log
 * @param {string} message
 * @param {Error} error
 */
const logError = (log, message, error) => (log ?? Log.common ?? console).error(message, error);

/**
 * @template T
 * @param {Tacocat.Log.Instance} log
 * @param {string} message
 * @param {() => Promise<T>} operation
 * @param {Promise<T> | ((error: Error) => T)} [fallback]
 * @returns {Promise<T | undefined>}
 */
function safeAsync(log, message, operation, fallback) {
  const reportError = (error) => {
    logError(log, message, error);
    return Promise.resolve(
      isFunction(fallback) ? fallback(error) : fallback,
    );
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
 * @param {() => T} operation
 * @param {T | ((error: Error) => T)} [fallback]
 * @returns {T | undefined}
 */
function safeSync(log, message, operation, fallback) {
  try {
    return operation();
  } catch (error) {
    logError(log, message, error);
    return isFunction(fallback) ? fallback(error) : fallback;
  }
}

export { safeAsync, safeSync };
