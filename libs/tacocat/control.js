import { Event } from './constant.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isBoolean, isNil, toArray } from './util.js';

const pipelineEvents = Object.values(Event);

/**
 * @param {string} alias
 * @param {AbortSignal?} signal
 * @param {HTMLElement} scope
 * @param {string} selector
 * @returns {Tacocat.Internal.Control}
 */
function Control(alias, scope, selector, signal) {
  /** @type {Map<any, Tacocat.Engine.Disposer[]>} */
  const captured = new Map();
  /** @type {WeakSet<Event>} */
  const dispatched = new WeakSet();
  const log = Log.common.module('control', alias);

  /**
   * @param {EventTarget} target
   * @param {Event} event
   */
  function dispatch(target, event) {
    if (pipelineEvents.includes(event.type)) dispatched.add(event);
    target.dispatchEvent(event);
  }

  /**
   * @param {Tacocat.Engine.Disposer[]} disposers
   */
  function dispose(disposers) {
    disposers?.forEach((disposer) => safeSync(log, 'Disposer callback error:', disposer));
  }

  /**
   * @param {Tacocat.Engine.Disposer | Tacocat.Engine.Disposer[]} disposer
   */
  function capture(disposer, key = null) {
    /** @type {Tacocat.Engine.Disposer[]} */
    const disposers = toArray(disposer);
    if (signal?.aborted) {
      dispose(disposers);
      return false;
    }
    if (!captured.has(key)) captured.set(key, []);
    captured.set(key, [...disposers, ...captured.get(key)]);
    return true;
  }

  /**
   * @param {EventTarget} target
   * @param {string|string[]} type
   * @param {EventListener} listener
   * @param {boolean | AddEventListenerOptions} [options]
   */
  function listen(target, type, listener, options) {
    if (signal?.aborted || isNil(target)) return false;

    const disposers = [];
    const types = toArray(type);
    if (!types.length) return false;

    const hasOptions = !isBoolean(options);
    const isOnce = hasOptions && !!options?.once;
    const withSignal = hasOptions && signal ? { ...options, signal } : options;

    function forwarder(event) {
      if (!pipelineEvents.includes(event.type) || dispatched.has(event)) {
        if (isOnce) dispose(disposers);
        listener(event);
      }
    }

    types.forEach((event) => {
      target.addEventListener(event, forwarder, withSignal);
      disposers.push(() => target.removeEventListener(event, forwarder));
    });

    capture(() => dispose(disposers), target);
    return true;
  }

  function release(key) {
    if (!isNil(key)) dispose(captured.get(key));
  }

  signal?.addEventListener?.(
    'abort',
    () => {
      log.debug('Aborted:', signal.reason?.message ?? signal.reason);
      dispose([...captured.values()].flat());
    },
    { once: true },
  );

  log.debug('Activated:', { signal });
  return Object.freeze({
    alias, capture, dispatch, listen, release, scope, selector, signal,
  });
}

export default Control;
