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
 * @param {number} timeout
 * @param {AbortSignal} signal
 * @returns {Promise<boolean>}
 */
export const delay = (timeout, signal = null) => new Promise((resolve) => {
  let timer;
  const aborted = () => {
    clearTimeout(timer);
    signal?.removeEventListener('abort', aborted);
    resolve(signal?.aborted ?? false);
  };
  signal?.addEventListener('abort', aborted);
  if (timeout > 0 && timeout < Infinity) {
    timer = setTimeout(aborted, timeout);
  }
});

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
 * @param {MutationObserverInit[]} mutations
 */
export const mergeMutations = (mutations) => mutations
  .reduce(
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
      if (attributes) options.attributes &&= attributes;
      if (characterData) options.characterData &&= characterData;
      if (childList) options.childList &&= childList;
      if (subtree) options.subtree &&= subtree;
      return options;
    },
    {},
  );

/**
 * @param {number} timeout
 * @returns {Promise<never>}
 */
export const rejectAfter = (timeout = 0) => new Promise((_, reject) => {
  setTimeout(() => reject, timeout);
});
