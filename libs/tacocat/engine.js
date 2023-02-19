import Event from './event.js';
import Subtree from './subtree.js';

/**
 * @param {WeakMap<Element, Tacocat.Internal.Depot>} mounted
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Engine.Placeholder[]}
 */
function exploreScope(mounted, { matcher, scope }) {
  const elements = [scope, ...scope.children];
  const placeholders = [];
  elements.forEach((element) => {
    if (matcher(element)) {
      const depot = mounted.get(element);
      if (depot) placeholders.push({ element, state: depot.state });
    }
    elements.push(...element.children);
  });
  return placeholders;
}

function refreshScope(mounted, subtree) {
  const placeholders = exploreScope(mounted, subtree);
  placeholders.forEach(({ element }) => {
    Event.refresh.dispatch(element);
  });
  return placeholders;
}

/**
 * @param {WeakMap<Element, Tacocat.Internal.Depot>} mounted
 * @returns {Tacocat.Internal.Engine}
 */
const Engine = (mounted) => ({
  explore(scope, selector) {
    return exploreScope(mounted, Subtree(scope, selector));
  },
  refresh(scope, selector) {
    return refreshScope(mounted, Subtree(scope, selector));
  },
});

export default Engine;
