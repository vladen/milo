import { isObject, isUndefined } from './utilities.js';

const contextKeys = new WeakMap();

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

const compareContexts = (one, two) => getContextKey(one) === getContextKey(two);

/** @type {Tacocat.hasContext}} */
const hasContext = (object) => isObject(object)
  // @ts-ignore
  && getContextKey(object.context) !== '';

export { compareContexts, getContextKey, hasContext };
