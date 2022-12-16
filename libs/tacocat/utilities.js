/** @type {Tacocat.isFunction} */
export const isFunction = (value) => typeof value === 'function';
/** @type {Tacocat.isNil} */
export const isNil = (value) => value == null;
/** @type {Tacocat.isObject} */
export const isObject = (value) => value != null && typeof value === 'object';
/** @type {Tacocat.isPromise} */
export const isPromise = (value) => value != null && value instanceof Promise;
/** @type {Tacocat.isUndefined} */
export const isUndefined = (value) => value === undefined;

/**
 * @param {boolean?} existing
 * @param {boolean?} overriding
 * @returns {boolean}
 */
const combineFlags = (existing, overriding) => (existing ?? false) || (overriding ?? false);

/**
 * @param {string} selector
 * @returns {Tacocat.Internal.SelectorMatcher}
 */
export const createSelectorMatcher = (selector) => (
  selector
    ? (element) => element?.matches(selector)
    : (element) => element && element instanceof Element
);

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
 * @param {MutationObserverInit[]} mutations
 */
export const mergeMutations = (mutations) => mutations.reduce(
  (options, {
    attributeFilter,
    attributes,
    characterData,
    childList,
    subtree,
  } = {}) => {
    if (attributeFilter) {
      options.attributeFilter = (options.attributeFilter ?? []).concat(attributeFilter);
    }
    options.attributes = combineFlags(options.attributes, attributes);
    options.characterData = combineFlags(options.characterData, characterData);
    options.childList = combineFlags(options.childList, childList);
    options.subtree = combineFlags(options.subtree, subtree);
    return options;
  },
  {},
);
