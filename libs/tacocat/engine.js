import { WeakCache } from './cache.js';
import { Event, Stage } from './constant.js';

/**
 * @param {Tacocat.Internal.Cycle} cycle
 * @param {Tacocat.Internal.Placeholder} placeholder
 * @returns {Tacocat.Engine.SomePlaceholder}
 */
const Placeholder = (cycle, placeholder) => ({
  get context() {
    return placeholder.context;
  },
  get element() {
    return placeholder.element;
  },
  get event() {
    return placeholder.event;
  },
  get result() {
    return placeholder.result;
  },
  get stage() {
    return placeholder.stage;
  },
  get promise() {
    return new Promise((resolve, reject) => {
      switch (placeholder.stage) {
        case Stage.resolved:
          resolve(placeholder.result);
          break;
        case Stage.rejected:
          reject(placeholder.result);
          break;
        default:
          cycle.listen(
            placeholder.element,
            [Event.rejected, Event.resolved],
            () => {
              (placeholder.stage === Stage.resolved ? resolve : reject)(
                placeholder.result,
              );
            },
            { once: true },
          );
          break;
      }
    });
  },
  update(context) {
    cycle.observe(placeholder.element, context);
  },
});

/**
 * @param {Tacocat.Internal.Cycle} cycle
 * @returns {Tacocat.Internal.Engine}
 */
function Engine(cycle) {
  const cache = WeakCache();
  return {
    get placeholders() {
      return cycle.placeholders.map(
        (placeholder) => cache.getOrSet(
          placeholder,
          () => Placeholder(cycle, placeholder),
        ),
      );
    },
  };
}

export default Engine;
