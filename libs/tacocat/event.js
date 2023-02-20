import { namespace } from './constants.js';

const Type = {
  mount: `${namespace}:mount`,
  observe: `${namespace}:observe`,
  refresh: `${namespace}:refresh`,
  extract: `${namespace}:extract`,
  reject: `${namespace}:reject`,
  resolve: `${namespace}:resolve`,
  present: `${namespace}:present`,
  unmount: `${namespace}:unmount`,
};

/**
 * @template T
 * @param {string} type
 * @returns {Tacocat.Engine.Channel<T>}
 */
const Event = (type) => ({
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
  type,
});

export default {
  /**
   * @type {Tacocat.Engine.Channel<Tacocat.Contextful<{ [key: string]: any }>>}
   */
  extract: Event(Type.extract),

  /**
   * @type {Tacocat.Engine.Channel<void>}
   */
  mount: Event(Type.mount),

  /** @type {Tacocat.Engine.Channel<void>} */
  refresh: Event(Type.refresh),

  /** @type {Tacocat.Engine.Channel<void>} */
  observe: Event(Type.observe),

  /** @type {Tacocat.Engine.Channel<Tacocat.Contextful<{ [key: string]: any }>>} */
  reject: Event(Type.reject),

  /** @type {Tacocat.Engine.Channel<Tacocat.Contextful<{ [key: string]: any }>>} */
  present: Event(Type.present),

  /** @type {Tacocat.Engine.Channel<Tacocat.Contextful<{ [key: string]: any }>>} */
  resolve: Event(Type.resolve),

  /** @type {Tacocat.Engine.Channel<void>} */
  unmount: Event(Type.unmount),

  Type,
};
