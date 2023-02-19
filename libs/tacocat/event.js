import constants from './constants.js';

const { namespace } = constants;

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
 * @returns {Tacocat.Internal.EventDispatcher<T>}
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
  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Internal.Context>} */
  extract: Event(Type.extract),

  /** @type {Tacocat.Internal.EventDispatcher<undefined>} */
  mount: Event(Type.mount),

  /** @type {Tacocat.Internal.EventDispatcher<undefined>} */
  refresh: Event(Type.refresh),

  /** @type {Tacocat.Internal.EventDispatcher<undefined>} */
  observe: Event(Type.observe),

  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Internal.Failure>} */
  reject: Event(Type.reject),

  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Internal.Result>} */
  present: Event(Type.present),

  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Internal.Product>} */
  resolve: Event(Type.resolve),

  /** @type {Tacocat.Internal.EventDispatcher<void>} */
  unmount: Event(Type.unmount),
};
