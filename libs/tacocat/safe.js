import Log, { isLog } from './log.js';

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

export { safeAsync, safeSync };
