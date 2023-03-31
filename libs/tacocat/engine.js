import { StageName } from './constants.js';

/** @type {WeakMap<Tacocat.Internal.Placeholder, Tacocat.Engine.SomePlaceholder>} */
const placeholders = new WeakMap();

/**
 * @param {Tacocat.Internal.Cycle} cycle
 * @param {Tacocat.Internal.Placeholder} placeholder
 * @returns {Tacocat.Engine.SomePlaceholder}
 */
function Placeholder(cycle, placeholder) {
  if (!placeholders.has(placeholder)) {
    placeholders.set(placeholder, {
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
            case StageName.resolved:
              resolve(placeholder.result);
              break;
            case StageName.rejected:
              reject(placeholder.result);
              break;
            default:

              break;
          }
        });
      },
      update(context = {}) {
        cycle.observe(placeholder.element, context);
      },
    });
  }
  return placeholders.get(placeholder);
}

/**
 * @param {Tacocat.Internal.Cycle} cycle
 * @returns {Tacocat.Internal.Engine}
 */
const Engine = (cycle) => ({
  get placeholders() {
    return cycle.placeholders.map((placeholder) => Placeholder(cycle, placeholder));
  },
});

export default Engine;
