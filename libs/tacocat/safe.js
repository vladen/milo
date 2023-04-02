import Log from './log.js';

const getLog = (log) => (Log.isLog(log) ? log : Log.common ?? console);

/**
 * @template T
 * @param {Tacocat.Log.Instance} log
 * @param {string} message
 * @param {() => Promise<T>} operation
 * @returns {Promise<T | undefined>}
 */
function safeAsync(log, message, operation) {
  const reportError = (error) => {
    getLog(log).error(message, error);
    return Promise.resolve(undefined);
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
 * @param {(item: T, index: number) => Promise<boolean>} operation
 * @returns {Promise<boolean>}
 */
function safeAsyncEvery(log, message, array, operation) {
  const safeAsyncStep = (index, result) => {
    if (!result || index >= array.length) {
      return Promise.resolve(!!result);
    }
    return safeAsync(log, message, () => operation(array[index], index)).then(
      (nextResult) => safeAsyncStep(index + 1, nextResult),
      () => Promise.resolve(false),
    );
  };

  return safeAsyncStep(0, true);
}

/**
 * @template T
 * @param {Tacocat.Log.Instance} log
 * @param {string} message
 * @param {() => T} operation
 * @returns {T | undefined}
 */
function safeSync(log, message, operation) {
  try {
    return operation();
  } catch (error) {
    getLog(log).error(message, error);
    return undefined;
  }
}

export { safeAsync, safeAsyncEvery, safeSync };
