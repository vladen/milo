import { getContextKey } from './context.js';
import { isObject, isUndefined } from './utilities.js';

/** @type {Tacocat.hasContext}} */
const hasContext = (result) => isObject(result)
  // @ts-ignore
  && getContextKey(result.context) !== '';

/** @type {Tacocat.isFailure}} */
const isFailure = (result) => hasContext(result)
  // @ts-ignore
  && result instanceof Error;

/** @type {Tacocat.isProduct}} */
const isProduct = (result) => hasContext(result)
  // @ts-ignore
  && !isUndefined(result.value);

function getStage(result) {
  if (hasContext(result)) {
    if (result instanceof Error) return 'rejected';
    if (!isUndefined(result.value)) return 'resolved';
    return 'pending';
  }
  return undefined;
}

/**
 * @template T
 * @param {T} context
 * @param {(Error | object)?} error
 * @returns {Tacocat.Failure<T>}
 */
const Failure = (context, error = {}) => Object.assign(error, { context });

/**
 * @template T, U
 * @param {T} context
 * @param {U} value
 * @returns {Tacocat.Product<T, U>}
 */
const Product = (context, value) => ({ context, value });

export {
  Failure, hasContext, getStage, isFailure, isProduct, Product,
};
