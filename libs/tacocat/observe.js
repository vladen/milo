import Depot from './depot.js';
import Event from './event.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import Subtree from './subtree.js';
import { isFunction, mergeReactions } from './utilities.js';

const childListMutation = 'childList';
const observableMutations = ['attributes', 'characterData', childListMutation];

/**
 * @param {WeakMap<Element, Tacocat.Internal.Depot>} mounted
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns {Tacocat.Engine.Placeholder[]}
 */
function exploreScope(mounted, { matcher, scope }) {
  const elements = [scope, ...scope.children];
  const results = [];
  elements.forEach((element) => {
    if (matcher(element)) {
      const depot = mounted.get(element);
      if (depot) results.push({ element, state: depot.state });
    }
    elements.push(...element.children);
  });
  return results;
}

/**
 * @param {WeakMap<Element, Tacocat.Internal.Depot>} mounted
 * @returns {Tacocat.Internal.Engine}
 */
const Engine = (mounted) => ({
  explore(scope, selector) {
    return exploreScope(mounted, Subtree(scope, selector));
  },
  refresh(scope, selector) {
    exploreScope(mounted, Subtree(scope, selector));
  },
  resolve(context) {
    return resolveContext(context);
  },
});

/**
 * @param {object} context
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @param {Tacocat.Internal.Subscriber[]} subscribers
 * @returns {Tacocat.Internal.SafeObserver}
 */
function Observe(context, reactions, subscribers) {
  const { events, mutations, triggers } = mergeReactions(reactions);
  const log = Log.common.module('observer');
  log.debug('Created:', { events, mutations, triggers });

  return (control, subtree) => {
    /** @type {WeakMap<Element, Tacocat.Internal.Depot>} */
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
    function match(node) {
      const element = node instanceof Element
        ? node
        : node.parentElement;
      if (element) {
        if (subtree.matcher(element)) return element;
        if (mutations.subtree) {
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
      if (mounted.has(element)) return mounted.get(element);

      if (events.length || triggers.length) {
        events.forEach((type) => {
          element.addEventListener(type, listener, { signal: control.signal });
        });

        triggers.forEach((trigger) => {
          const disposer = safeSync(log, 'Trigger callback error:', () => trigger(element, listener, control.signal));
          if (isFunction(disposer)) {
            control.dispose(disposer, element);
          } else if (disposer != null) {
            log.warn('Trigger callback must return a function:', { trigger });
          }
        });
      }

      const depot = Depot(log.instance, element);
      depot.state = { context: { ...context } };
      mounted.set(element, depot);
      subscribers.forEach((subscriber) => {
        subscriber(control, depot, element);
      });
      log.debug('Mounted:', { element, events, triggers });
      Event.mount.dispatch(element);
      return depot;
    }

    /**
     * @param {Element} element
     */
    function unmount(element) {
      mounted.get(element)?.delete();
      mounted.delete(element);
      control.release(element);
      log.debug('Unmounted:', { element, events, triggers });
      Event.unmount.dispatch(element);
    }

    /**
     * Schedules async dispatch of observation results.
     */
    function schedule() {
      if (timer) return;
      function dispatch() {
        timer = 0;
        // Dispatch `unmount` events
        removed.forEach(({ element }) => {
          unmount(element);
        });
        // Dispatch `mount` and `observe` events
        updated.forEach(({ element, event }) => {
          const depot = mount(element, (nextEvent) => {
            updated.add({ element, event: nextEvent });
            schedule();
          });
          log.debug('Observed:', { context, element, event, subtree });
          Event.observe.dispatch(element, depot.state, event);
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
    const elements = [subtree.scope];
    let index = 0;
    while (index < elements.length) {
      const element = elements[index];
      if (mutations.childList) elements.push(...element.children);
      update(match(element));
      index += 1;
    }

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
      log.debug('Observing:', { context, reactions, subtree });
    }

    return Engine(mounted);
  };
}

export default Observe;
