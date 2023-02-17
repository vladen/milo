import Event from './event.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isFunction, mergeObserveOptions } from './utilities.js';

const childListMutation = 'childList';
const observableMutations = ['attributes', 'characterData', childListMutation];

/**
 * @param {Tacocat.Engine.ObserveOptions[]} options
 * @returns {Tacocat.Internal.SafeObserver}
 */
function Observe(options) {
  const { events, mutations, triggers } = mergeObserveOptions(options);
  const log = Log.common.module('observer');
  log.debug('Created:', { events, mutations, triggers });

  return (control, { matcher, scope, selector }) => (subscribe) => {
    if (control.dispose(() => log.debug('Disposed'))) return;

    /** @type {Set<Element>} */
    const mounted = new Set();
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
        if (matcher(element)) return element;
        if (mutations.subtree) {
          const closest = element.closest(selector);
          if (closest?.compareDocumentPosition(scope) === Node.DOCUMENT_POSITION_CONTAINS) {
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
      if (mounted.has(element)) return false;
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

        log.debug('Mounted:', { element, events, triggers });
        mounted.add(element);
      }
      return true;
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
          control.release(element);
          log.debug('Unmounted:', { element, events, triggers });
          Event.unmount.dispatch(element);
        });
        // Dispatch `mount` and `observe` events
        updated.forEach(({ element, event }) => {
          if (mount(element, (nextEvent) => {
            updated.add({ element, event: nextEvent });
            schedule();
          })) {
            log.debug('Mounted:', { element });
            control.dispose(subscribe(control, element), element);
            Event.mount.dispatch(element);
          } else {
            log.debug('Observed:', { element, event });
          }
          Event.observe.dispatch(element, { context: {} }, event);
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
    const elements = [scope];
    let index = 0;
    while (index < elements.length) {
      const element = elements[index];
      if (mutations.childList) elements.push(...element.children);
      update(match(element));
      index += 1;
    }

    // Setup mutation observer
    if (observableMutations.some((key) => mutations[key])) {
      const observer = new MutationObserver((records) => records.forEach((record) => {
        if (record.type === childListMutation) {
          const { addedNodes, removedNodes } = record;
          removedNodes.forEach((node) => remove(match(node)));
          addedNodes.forEach((node) => update(match(node)));
        } else {
          update(match(record.target));
        }
      }));

      observer.observe(scope, mutations);
      control.dispose(() => observer.disconnect());
      log.debug('Observing:', { options, scope, selector });
    }
  };
}

export default Observe;
