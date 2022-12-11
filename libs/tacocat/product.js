import { isObject, isUndefined } from './utilities.js';

/** @type {Tacocat.hasContext}} */
const hasContext = (result) => isObject(result) && isObject(result.context);

/** @type {Tacocat.isFailure}} */
const isFailure = (result) => hasContext(result) && !isUndefined(result.error);

/** @type {Tacocat.isProduct}} */
const isProduct = (result) => hasContext(result) && !isUndefined(result.value);

export { hasContext, isFailure, isProduct };
