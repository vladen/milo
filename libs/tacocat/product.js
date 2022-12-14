import { getContextKey } from './context.js';
import { isObject, isUndefined } from './utilities.js';

/** @type {Tacocat.hasContext}} */
const hasContext = (result, key = '') => isObject(result)
  // @ts-ignore
  && isObject(result.context)
  // @ts-ignore
  && (!key || key === getContextKey(result.context));

/** @type {Tacocat.isFailure}} */
const isFailure = (result, key = '') => hasContext(result, key)
  // @ts-ignore
  && !isUndefined(result.error);

/** @type {Tacocat.isProduct}} */
const isProduct = (result, key = '') => hasContext(result, key)
  // @ts-ignore
  && !isUndefined(result.value);

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

export { Failure, hasContext, isFailure, isProduct, Product };
