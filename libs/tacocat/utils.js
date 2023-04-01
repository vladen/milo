/** @type {Tacocat.isNil} */
export const isNil = (value) => value == null;

/** @type {Tacocat.isBoolean} */
export const isBoolean = (value) => typeof value === 'boolean';
/** @type {Tacocat.isHTMLElement} */
export const isHTMLElement = (value) => !isNil(value) && value instanceof HTMLElement;
/** @type {Tacocat.isError} */
export const isError = (value) => !isNil(value) && value instanceof Error;
/** @type {Tacocat.isFunction} */
export const isFunction = (value) => typeof value === 'function';
/** @type {Tacocat.isMap} */
export const isMap = (value) => !isNil(value) && value instanceof Map;
/** @type {Tacocat.isObject} */
export const isObject = (value) => !isNil(value) && typeof value === 'object';
/** @type {Tacocat.isPromise} */
export const isPromise = (value) => !isNil(value) && value instanceof Promise;
/** @type {Tacocat.isString} */
export const isString = (value) => typeof value === 'string';
/** @type {Tacocat.isWeakMap} */
export const isWeakMap = (value) => !isNil(value) && value instanceof WeakMap;

/**
 * @template T
 * @param {T | T[]} value
 * @returns {T[]}
 */
export const toArray = (value) => (Array.isArray(value) ? value : [value]);

/**
 * @param {any} value
 * @returns {boolean}
 */
export const toBoolean = (value) => (isBoolean(value) ? value : ['1', 'true'].includes(String(value)));

/**
 * @template T, U
 * @param {T} result
 * @param {U} context
 * @returns {T & Tacocat.Contextful<U>}
 */
// @ts-ignore
export const setContext = (result, context) => Object.defineProperty(
  isObject(result) ? result : {},
  'context',
  {
    enumerable: true,
    value: context,
  },
);

/** @type {Tacocat.hasContext}} */
export const hasContext = (object) => isObject(object)
  // @ts-ignore
  && isString(object.context.id) && object.context.id.length;

/**
 * @param {boolean?} existing
 * @param {boolean?} overriding
 * @returns {boolean}
 */
const combineFlags = (existing, overriding) => (existing ?? false) || (overriding ?? false);

/**
 * @param {number} timeout
 * @param {AbortSignal} signal
 * @returns {Promise<Error?>}
 */
export const delay = (timeout, signal = null) => new Promise((resolve) => {
  let timer;
  if (timeout > 0 && timeout < Infinity) {
    timer = setTimeout(resolve, timeout);
    signal?.addEventListener('abort', () => clearTimeout(timer), { once: true });
  }
});

export const hasOwnProperty = (object, property) => !isNil(object)
  && Object.prototype.hasOwnProperty.call(object, property);

/**
 * @param {string[]} strings
 * @param {string} separator
 */
export const joinUnique = (strings, separator = ',') => [...new Set(strings)].join(separator);

/**
 *
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @returns {Tacocat.Internal.Reactions}
 */
export const mergeReactions = (...reactions) => ({
  events: [...new Set(
    reactions
      .flatMap(({ events } = {}) => events)
      .filter((event) => event),
  )],
  mutations: reactions
    .map(({ mutations } = {}) => mutations)
    .filter((mutations) => isObject(mutations))
    .reduce(
      (merged, {
        attributeFilter,
        attributes,
        characterData,
        childList,
        subtree,
      } = {}) => {
        if (attributeFilter) {
          merged.attributeFilter = (merged.attributeFilter ?? []).concat(attributeFilter);
        }
        merged.attributes = combineFlags(merged.attributes, attributes);
        merged.characterData = combineFlags(merged.characterData, characterData);
        merged.childList = combineFlags(merged.childList, childList);
        merged.subtree = combineFlags(merged.subtree, subtree);
        return merged;
      },
      {},
    ),
  triggers: reactions
    .map(({ trigger } = {}) => trigger)
    .filter(isFunction),
});

export default {
  hasContext,
  isBoolean,
  isHTMLElement,
  isError,
  isFunction,
  isNil,
  isObject,
  isPromise,
  isString,
  joinUnique,
  setContext,
  toArray,
  toBoolean,
};
