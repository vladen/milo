import { createSelectorMatcher } from './utilities.js';

/**
 * @param {Element} scope
 * @param {string?} selector
 * @returns {Tacocat.Internal.Subtree}
 */
const Subtree = (scope, selector) => ({
  matcher: createSelectorMatcher(selector),
  scope,
  selector,
});

export default Subtree;
