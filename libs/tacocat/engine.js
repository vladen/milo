import Channel from './channel.js';
import { Stage } from './constants.js';
import Subtree from './subtree.js';

/**
 * @param {WeakMap<Element, Tacocat.Internal.Storage>} mounted
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Engine.Placeholder[]}
 */
function exploreScope(mounted, { matcher, scope }) {
  const elements = [scope, ...scope.children];
  const placeholders = [];
  elements.forEach((element) => {
    if (matcher(element)) {
      const depot = mounted.get(element);
      if (depot) {
        /** @type {Tacocat.Internal.Placeholder} */
        const placeholder = {
          element,
          state: depot.getState(element),
          wait: (stage) => new Promise((resolve) => {
            Channel[stage]?.listen(element, () => resolve(placeholder), { once: true });
          }),
        };
        placeholders.push(placeholder);
      }
    }
    elements.push(...element.children);
  });
  return placeholders;
}

function refreshScope(mounted, subtree) {
  const placeholders = exploreScope(mounted, subtree);
  placeholders.forEach(({ element }) => {
    Channel.refresh.dispatch(element, Stage.pending);
  });
  return placeholders;
}

/**
 * @param {WeakMap<Element, Tacocat.Internal.Storage>} mounted
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Internal.Engine}
 */
const Engine = (mounted, subtree) => ({
  explore(scope, selector) {
    return exploreScope(mounted, Subtree(scope ?? subtree.scope, selector ?? subtree.selector));
  },
  refresh(scope, selector) {
    return refreshScope(mounted, Subtree(scope ?? subtree.scope, selector ?? subtree.selector));
  },
});

export default Engine;
