import { namespace, Stage } from './constants.js';
import { isError, isNil } from './utilities.js';

const getEventType = (channel) => `${namespace}:${channel}`;

/**
 * @template T
 * @param {string} type
 * @returns {Tacocat.Engine.Channel<T>}
 */
const Channel = (type) => ({
  dispatch(target, detail, event) {
    if (event) {
      // @ts-ignore
      event.detail = detail;
    }
    target.dispatchEvent(event ?? new CustomEvent(type, { bubbles: true, detail }));
  },
  listen(target, listener, options = {}) {
    target.addEventListener(type, listener, options);
    return () => target.removeEventListener(type, listener);
  },
  promise(target) {
    return new Promise((resolve, reject) => {
      target.addEventListener(type, (event) => {
        // @ts-ignore
        const { detail } = event;
        ((isNil(detail) || isError(detail)) ? reject : resolve)(detail);
      }, { once: true });
    });
  },
});

export default {
  /**
   * @type {Tacocat.Engine.Channel<Tacocat.SomeContext>}
   */
  extract: Channel(getEventType('extract')),

  /**
   * @type {Tacocat.Engine.Channel<void>}
   */
  mount: Channel(getEventType('mount')),

  /** @type {Tacocat.Engine.Channel<void>} */
  observe: Channel(getEventType('observe')),

  /**
   * @type {Tacocat.Engine.Channel<Tacocat.SomeContext>}
   */
  pending: Channel(getEventType(Stage.pending)),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeRejection | Tacocat.SomeResolution>} */
  provide: Channel(getEventType('provide')),

  /** @type {Tacocat.Engine.Channel<void>} */
  refresh: Channel(getEventType('refresh')),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeRejection>} */
  rejected: Channel(getEventType(Stage.rejected)),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeContext>} */
  present: Channel(getEventType('present')),

  /** @type {Tacocat.Engine.Channel<Tacocat.SomeResolution>} */
  resolved: Channel(getEventType(Stage.resolved)),

  /** @type {Tacocat.Engine.Channel<void>} */
  unmount: Channel(getEventType('unmount')),
};
