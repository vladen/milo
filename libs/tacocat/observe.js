import Channel from './channel.js';
import { Stage } from './constants.js';
import Engine from './engine.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import Storage from './storage.js';
import { isFunction, isNil, mergeReactions } from './utilities.js';

const childListMutation = 'childList';
const observableMutations = ['attributes', 'characterData', childListMutation];

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Reactions[]} reactions
 * @param {Tacocat.Internal.Subscriber[]} subscribers
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Internal.Engine}
 */
function Observe(control, reactions, subscribers, subtree) {
  const log = Log.common.module('observer');

  if (control.signal?.aborted) {
    return {
      explore: () => [],
      refresh: () => [],
    };
  }

  const { events, mutations, triggers } = mergeReactions(reactions);
  log.debug('Activating:', { events, mutations, triggers, subscribers, subtree });

  /** @type {WeakMap<Element, Tacocat.Internal.Storage>} */
  const mounted = new WeakMap();
  /** @type {Set<{ element: Element }>} */
  const removed = new Set();
  /** @type {Set<{ element: Element, event?: Event }>} */
  const updated = new Set();
  let timer;

  /**
     * Returns given element if it matches obsdervation conditions.
     * @param {Node} node
     * @returns {Element | undefined}
     */
  function match(node, ancestors = false) {
    const element = node instanceof Element
      ? node
      : node.parentElement;
    if (element) {
      if (subtree.matcher(element)) return element;
      if (ancestors) {
        const closest = element.closest(subtree.selector);
        if (closest?.compareDocumentPosition(subtree.scope) === Node.DOCUMENT_POSITION_CONTAINS) {
          return closest;
        }
      }
    }
    return undefined;
  }

  /**
     * Mounts new element to the observation session
     * by subscribing event listeners and initialising triggers.
     * @param {Element} element
     * @param {(event: Event) => void} listener
     */
  function mount(element, listener) {
    if (mounted.has(element)) return;
    log.debug('Mounting:', { element });

    events.forEach((type) => {
      element.addEventListener(type, listener, { signal: control.signal });
    });

    triggers.forEach((trigger) => {
      const result = safeSync(
        log,
        'Trigger callback error:',
        () => trigger(element, listener, control.signal),
      );
      if (isFunction(result)) {
        control.dispose(result, element);
      } else if (!isNil(result)) {
        log.warn('Trigger callback must return a function:', { result, trigger });
      }
    });

    const storage = Storage(log.id);
    mounted.set(element, storage);
    subscribers.forEach((subscriber) => {
      subscriber(control, element, storage);
    });
    Channel.mount.dispatch(element);
  }

  /**
     * @param {Element} element
     */
  function unmount(element) {
    mounted.get(element)?.deleteState(element);
    mounted.delete(element);
    control.release(element);
    log.debug('Unmounted:', { element });
    Channel.unmount.dispatch(element);
  }

  /**
     * Schedules async dispatch of observation results.
     */
  function schedule() {
    if (timer) return;

    function dispatch() {
      timer = 0;
      removed.forEach(({ element }) => {
        unmount(element);
      });

      updated.forEach(({ element, event }) => {
        mount(element, (nextEvent) => {
          updated.add({ element, event: nextEvent });
          schedule();
        });
        log.debug('Observed:', { element, event });
        Channel.observe.dispatch(element, undefined, Stage.pending, event);
      });
    }

    timer = setTimeout(dispatch, 0);
  }

  function remove(element) {
    if (element) {
      removed.add({ element });
      updated.delete(element);
    }
    schedule();
  }

  function update(element) {
    if (element) {
      removed.delete(element);
      updated.add({ element });
    }
    schedule();
  }

  // Scan current DOM tree for matching elements
  subtree.scope.querySelectorAll(subtree.selector).forEach((element) => {
    update(match(element));
  });

  // Setup mutation observer
  if (observableMutations.some((mutation) => mutations[mutation])) {
    const observer = new MutationObserver((records) => records.forEach((record) => {
      if (record.type === childListMutation) {
        const { addedNodes, removedNodes } = record;
        removedNodes.forEach((node) => remove(match(node)));
        addedNodes.forEach((node) => update(match(node)));
      } else {
        update(match(record.target));
      }
    }));

    observer.observe(subtree.scope, mutations);
    control.dispose(() => observer.disconnect());
    log.debug('Observing:', { subtree });
  }

  log.debug('Activated');
  control.dispose(() => log.debug('Disposed'));
  return Engine(mounted, subtree);
}

export default Observe;
