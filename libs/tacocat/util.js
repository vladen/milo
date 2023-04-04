import namespace from './namespace.js';

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
/** @type {Tacocat.isNumber} */
export const isNumber = (value) => typeof value === 'number';
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
 * @param {any} value
 * @param {number} defaultValue
 * @returns {number}
 */
export function toInteger(value, defaultValue) {
  const integer = parseInt(value, 10);
  return Number.isNaN(integer) ? defaultValue : integer;
}

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
  && isObject(object.context) && isString(object.context.id) && !!object.context.id;

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

/**
 * @param {string[]} names
 */
export const qualifyCssName = (...names) => (
  (names[0]?.startsWith(`${namespace}-`) ? names : [namespace, ...names])
    .filter((name) => name)
    .map((name) => name.replace(
      /\p{Ll}(\p{Lu}|\p{N})/g,
      (_, prev, next) => `${prev}-${next[0].toLowerCase()}`,
    ))
    .join('-'));

export const qualifyDataAttribute = (...names) => `data-${qualifyCssName(...names)}`;

export const qualifyJsName = (...names) => qualifyCssName(...names).replace(
  /(\w)-(\w)/g,
  (_, prev, next) => `${prev}${next.toUpperCase()}`,
);

/**
 * @param {HTMLElement} element
 * @param {string} selector
 * @returns {HTMLElement?}
 */
export const querySelectorUp = (element, selector) => (
  isNil(element?.parentElement)
    ? null
    : element.parentElement.querySelector(selector)
    ?? querySelectorUp(element.parentElement, selector)
);

/**
 * @param {boolean?} existing
 * @param {boolean?} overriding
 * @returns {boolean}
 */
const combineFlags = (existing, overriding) => (existing ?? false) || (overriding ?? false);

/**
 *
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @returns {Tacocat.Internal.Reactions}
 */
export const mergeReactions = (...reactions) => ({
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
  trigger: reactions
    .flatMap(({ trigger } = {}) => (isNil(trigger) ? [] : toArray(trigger))),
});

export default {
  delay,
  querySelectorUp,
  hasContext,
  isBoolean,
  isHTMLElement,
  isError,
  isFunction,
  isNil,
  isObject,
  isPromise,
  isString,
  qualifyCssName,
  qualifyDataAttribute,
  qualifyJsName,
  setContext,
  toArray,
  toBoolean,
};
