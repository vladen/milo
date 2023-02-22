import { isObject, isUndefined } from './utilities.js';

const contextKeys = new WeakMap();

/**
 * @template T, U
 * @param {T} result
 * @param {U} context
 * @returns {T & Tacocat.Contextful<U>}
 */
// @ts-ignore
const assignContext = (result, context) => Object.defineProperty(
  isObject(result) ? result : {},
  'context',
  {
    enumerable: true,
    value: context,
  },
);

/**
 * @param {object} context
 * @returns {string}
 */
function getContextKey(context) {
  if (!isObject(context)) return '';
  let key = contextKeys.get(context);
  if (isUndefined(key)) {
    key = JSON.stringify(context);
    contextKeys.set(context, key);
  }
  return key;
}

/** @type {Tacocat.hasContext}} */
const hasContext = (object) => isObject(object)
  // @ts-ignore
  && getContextKey(object.context) !== '';

export { assignContext, getContextKey, hasContext };
