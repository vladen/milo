import Log from './log.js';
import { getStage } from './product.js';

const { namespace } = Log.common;

const Type = {
  extract: `${namespace}:extract`,
  mount: `${namespace}:mount`,
  observe: `${namespace}:observe`,
  reject: `${namespace}:reject`,
  resolve: `${namespace}:resolve`,
  render: `${namespace}:render`,
  unmount: `${namespace}:unmount`,
};

/**
 * @param {EventTarget} target
 * @param {string} type
 * @param {EventListenerOrEventListenerObject} listener
 * @param {AddEventListenerOptions} options
 * @returns {Tacocat.Disposer}
 */
export const addEventListener = (target, type, listener, options) => {
  target.addEventListener(type, listener, options);
  return () => target.removeEventListener(type, listener);
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
    return addEventListener(target, type, listener, { ...options, capture: true });
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
  render: Event(Type.render),
  /** @type {Tacocat.Internal.EventDispatcher<Tacocat.Product<{}, any>>} */
  resolve: Event(Type.resolve),
  /** @type {Tacocat.Internal.EventDispatcher<void>} */
  unmount: Event(Type.unmount),
};
