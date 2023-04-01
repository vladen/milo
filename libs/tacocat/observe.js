import Cycle from './cycle.js';
import Engine from './engine.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isFunction, isNil } from './utilities.js';

const childListMutation = 'childList';
const observableMutations = ['attributes', 'characterData', childListMutation];

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Reactions} reactions
 * @param {Tacocat.Internal.Subscriber[]} subscribers
 * @param {Element} scope
 * @param {string} selector
 * @param {Tacocat.Engine.Filter} filter
 * @returns {Tacocat.Internal.Engine}
 */
function Observe(control, reactions, subscribers, scope, selector, filter) {
  const log = Log.common.module('observe');

  if (control.signal?.aborted) {
    return {
      get placeholders() {
        return [];
      },
    };
  }

  const cycle = Cycle(control, scope, selector, filter);
  /** @type {Set<{ element: Element }>} */
  const removed = new Set();
  /** @type {Set<{ element: Element, event?: Event }>} */
  const updated = new Set();
  let timer;

  /**
     * Mounts new element to the observation session
     * by subscribing event listeners and initialising triggers.
     * @param {Element} element
     * @param {(event: Event) => void} listener
     */
  function mount(element, listener) {
    if (cycle.exists(element)) return;
    log.debug('Mounting:', { element });

    reactions.events.forEach((type) => {
      element.addEventListener(type, listener, { signal: control.signal });
    });

    reactions.triggers.forEach((trigger) => {
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
  }

  /**
     * @param {Element} element
     */
  function unmount(element) {
    cycle.dispose(element);
    log.debug('Unmounted:', { element });
  }

  /**
     * Schedules async dispatch of observation results.
     */
  function schedule() {
    if (timer) return;

    function dispatch() {
      if (control.signal?.aborted) return;
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
        cycle.observe(element, undefined, event);
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

  subscribers.forEach((subscriber) => {
    subscriber(control, cycle);
  });

  // Scan current DOM tree for matching elements
  cycle.select().forEach(update);

  // Setup mutation observer
  if (observableMutations.some((mutation) => reactions.mutations[mutation])) {
    const observer = new MutationObserver((records) => records.forEach((record) => {
      if (record.type === childListMutation) {
        const { addedNodes, removedNodes } = record;
        removedNodes.forEach((node) => remove(cycle.match(node)));
        addedNodes.forEach((node) => update(cycle.match(node)));
      } else {
        update(cycle.match(record.target));
      }
    }));

    observer.observe(scope, reactions.mutations);
    control.dispose(() => observer.disconnect());
    log.debug('Observing:', { scope, selector });
  }

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { reactions, scope, selector });
  return Engine(cycle);
}

export default Observe;
