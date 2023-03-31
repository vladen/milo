import { isObject, isString } from './utilities.js';

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

/** @type {Tacocat.hasContext}} */
const hasContext = (object) => isObject(object)
  // @ts-ignore
  && isString(object.context.id) && object.context.id.length;

export { assignContext, hasContext };
