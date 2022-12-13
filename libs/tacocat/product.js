import { isObject, isUndefined } from './utilities.js';

/** @type {Tacocat.hasContext}} */
const hasContext = (result) => isObject(result)
  // @ts-ignore
  && isObject(result.context);

/** @type {Tacocat.isFailure}} */
const isFailure = (result) => hasContext(result)
  // @ts-ignore
  && !isUndefined(result.error);

/** @type {Tacocat.isProduct}} */
const isProduct = (result) => hasContext(result)
  // @ts-ignore
  && !isUndefined(result.value);

export { hasContext, isFailure, isProduct };
