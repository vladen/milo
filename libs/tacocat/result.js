import { getContextKey } from './context.js';
import { isError, isObject, isUndefined } from './utilities.js';

/** @type {Tacocat.hasContext}} */
const hasContext = (result) => isObject(result)
  // @ts-ignore
  && getContextKey(result.context) !== '';

/** @type {Tacocat.isFailure}} */
const isFailure = (result) => hasContext(result) && isError(
  // @ts-ignore
  result.error,
);

/** @type {Tacocat.isProduct}} */
const isProduct = (result) => hasContext(result) && !isUndefined(
  // @ts-ignore
  result.value,
);

/** @type {Tacocat.isResult}} */
const isResult = (result) => hasContext(result) && (
  isError(
    // @ts-ignore
    result.error,
  ) || !isUndefined(
    // @ts-ignore
    result.value,
  )
);

function getStage(result) {
  if (hasContext(result)) {
    if (isError(
      // @ts-ignore
      result.error,
    )) return 'rejected';
    if (!isUndefined(
      // @ts-ignore
      result.value,
    )) return 'resolved';
    return 'pending';
  }
  return undefined;
}

const Context = (context) => ({ context });

/**
 * @template T
 * @param {T} context
 * @param {(Error | object)?} error
 * @returns {Tacocat.Failure<T>}
 */
const Failure = (context, error = {}) => ({ error, context });

/**
 * @template T, U
 * @param {T} context
 * @param {U} value
 * @returns {Tacocat.Product<T, U>}
 */
const Product = (context, value) => ({ context, value });

export {
  Context, Failure, Product, hasContext, getStage, isFailure, isProduct, isResult,
};
