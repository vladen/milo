/** @type {Tacocat.isNil} */
export const isNil = (value) => value == null;

/** @type {Tacocat.isBoolean} */
export const isBoolean = (value) => typeof value === 'boolean';
/** @type {Tacocat.isElement} */
export const isElement = (value) => !isNil(value) && value instanceof Element;
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

/** @type {Tacocat.toBoolean} */
export const toBoolean = (value) => (isBoolean(value) ? value : ['1', 'true'].includes(String(value)));

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
 *
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @returns {Tacocat.Internal.Reactions}
 */
export const mergeReactions = (reactions) => ({
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
  selectors: reactions
    .map(({ selector } = {}) => selector)
    .filter((selector) => selector),
  triggers: reactions
    .map(({ trigger } = {}) => trigger)
    .filter((trigger) => isFunction(trigger)),
});
