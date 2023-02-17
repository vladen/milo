import Log from './log.js';
import { getStage } from './product.js';

const { namespace } = Log.common;

const Type = {
  mount: `${namespace}:mount`,
  observe: `${namespace}:observe`,
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
  dispatch(target, product, event) {
    const detail = product ? { ...product, stage: getStage(product) } : null;
    // @ts-ignore
    if (event) event.detail = detail;
    target.dispatchEvent(event ?? new CustomEvent(type, { bubbles: true, detail }));
  },
  listen(target, listener, options = {}) {
    target.addEventListener(type, listener, options);
    return () => target.removeEventListener(type, listener);
  },
  type,
});

export default {
  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Contextful<{}>>} */
  extract: Event(Type.extract),
  /** @type {Tacocat.Internal.EventDispatcher<void>} */
  mount: Event(Type.mount),
  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Contextful<{}>>} */
  observe: Event(Type.observe),
  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Failure<any>>} */
  reject: Event(Type.reject),
  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Product<{}, any>>} */
  present: Event(Type.present),
  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Product<{}, any>>} */
  resolve: Event(Type.resolve),
  /** @type {Tacocat.Internal.EventDispatcher<void>} */
  unmount: Event(Type.unmount),
};
