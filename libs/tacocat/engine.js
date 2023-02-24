import Channel from './channel.js';
import { Stage } from './constants.js';
import Subtree from './subtree.js';

/**
 * @param {WeakMap<Element, Tacocat.Internal.Storage>} mounted
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Engine.Placeholder[]}
 */
function exploreScope(mounted, { scope, selector }) {
  const placeholders = [];
  scope.querySelectorAll(selector).forEach((element) => {
    const depot = mounted.get(element);
    if (depot) {
      /** @type {Tacocat.Internal.Placeholder} */
      const placeholder = {
        element,
        state: depot.getState(element),
        expect(stage) {
          return new Promise((resolve) => {
            Channel[stage]?.listen(element, () => resolve(placeholder), { once: true });
          });
        },
        update(context) {
          Channel.update.dispatch(element, { context }, Stage.pending);
          return placeholder;
        },
      };
      placeholders.push(placeholder);
    }
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
});

export default Engine;
