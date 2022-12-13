/** @type {Tacocat.isFunction} */
export const isFunction = (value) => typeof value === 'function';
/** @type {Tacocat.isObject} */
export const isObject = (value) => value != null && typeof value === 'object';
/** @type {Tacocat.isPromise} */
export const isPromise = (value) => value != null && value instanceof Promise;
/** @type {Tacocat.isUndefined} */
export const isUndefined = (value) => value === undefined;

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
 * @param {Node} node
 * @param {(element: Element) => boolean} matcher
 * @returns {Element | undefined}
 */
export function getMatchingSelfOrParent(node, matcher) {
  const element = (node instanceof Element ? node : node.parentElement);
  return element && matcher(element) ? element : undefined;
}

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
