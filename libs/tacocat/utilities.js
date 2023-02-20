/** @type {Tacocat.isNil} */
export const isNil = (value) => value == null;

/** @type {Tacocat.isError} */
export const isError = (value) => !isNil(value) && value instanceof Error;
/** @type {Tacocat.isFunction} */
export const isFunction = (value) => typeof value === 'function';
/** @type {Tacocat.isObject} */
export const isObject = (value) => !isNil(value) && typeof value === 'object';
/** @type {Tacocat.isPromise} */
export const isPromise = (value) => !isNil(value) && value instanceof Promise;
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

export const hasOwnProperty = (object, property) => !isNil(object)
  && Object.prototype.hasOwnProperty.call(object, property);

/**
 *
 * @param {Tacocat.Internal.Reactions[]} reactions
 * @returns
 */
export const mergeReactions = (reactions) => ({
  events: [...new Set(
    reactions
      .flatMap(({ events }) => events)
      .filter((event) => event),
  )],
  mutations: reactions
    .map(({ mutations }) => mutations)
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
    .map(({ trigger }) => trigger)
    .filter((trigger) => isFunction(trigger)),
});
