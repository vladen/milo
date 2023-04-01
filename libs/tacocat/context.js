import { isObject, isString } from './utilities.js';

/**
 * @template T, U
 * @type {Tacocat.setContext<T, U>}
 */
// @ts-ignore
const setContext = (result, context) => Object.defineProperty(
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

export { hasContext, setContext };
