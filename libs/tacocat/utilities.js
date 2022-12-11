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
 * @returns {(element: Element) => boolean}
 */
export const createSelectorMatcher = (selector) => (
  selector
    ? (element) => element?.matches(selector)
    : (element) => element && element instanceof Element
);

/**
 * @param {number} timeout
 * @returns {Promise<never>}
 */
export const rejectAfter = (timeout = 0) => new Promise((_, reject) => {
  setTimeout(() => reject, timeout);
});
