import Control from './control.js';
import Cycle from './cycle.js';
import Engine from './engine.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isFunction, isNil } from './util.js';

const childListMutation = 'childList';
const observableMutations = ['attributes', 'characterData', childListMutation];

/**
 * @param {{
 *  reactions: Tacocat.Internal.Reactions;
 *  subscribers: Tacocat.Internal.Subscriber[];
 *  scope: HTMLElement;
 *  signal: AbortSignal;
 *  selector: string;
 *  filter: Tacocat.Engine.Filter;
 * }} detail
 * @returns {Tacocat.Internal.Engine}
 */
function Observe({
  filter, reactions, scope, selector, signal, subscribers,
}) {
  const control = Control(signal);
  const log = Log.common.module('observe');

  if (control.signal?.aborted) {
    return {
      get placeholders() {
        return [];
      },
    };
  }

  const cycle = Cycle(control, scope, selector, filter);
  /** @type {Set<{ element: HTMLElement }>} */
  const removed = new Set();
  /** @type {Set<{ element: HTMLElement, event?: Event }>} */
  const updated = new Set();
  let timer;

  /**
   * Mounts new element to the observation session
   * by subscribing defined event listeners and calling triggers.
   * @param {HTMLElement} element
   * @param {(event: Event) => void} listener
   */
  function mount(element, listener) {
    if (cycle.exists(element)) return;
    log.debug('Mounting:', { element });

    reactions.events.forEach((type) => {
      element.addEventListener(type, listener, { signal: control.signal });
    });

    reactions.triggers.forEach((trigger) => {
      // eslint-disable-next-line no-debugger
      debugger;
      const result = safeSync(
        log,
        'Trigger function error:',
        () => trigger(element, listener, control),
      );
      if (isFunction(result)) {
        control.dispose(result, element);
      } else if (!isNil(result)) {
        log.warn('Trigger must return a function:', { result, trigger });
      }
    });
  }

  /**
   * Unmounts element by calling its disposers
   * and removing it from the observation session.
   * @param {HTMLElement} element
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
          // eslint-disable-next-line no-debugger
          debugger;
          updated.add({ element, event: nextEvent });
          schedule();
        });
        const detail = { element };
        if (!isNil(event)) detail.event = event;
        log.debug('Observed:', detail);
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

  // Activate subscribers
  subscribers.forEach((subscriber) => {
    subscriber(control, cycle);
  });

  // Scan current DOM tree for matching elements
  cycle.select().forEach(update);

  // Setup mutation observer
  if (observableMutations.some((mutation) => reactions.mutations[mutation])) {
    const observer = new MutationObserver((records) => records.forEach((record) => {
      // eslint-disable-next-line no-debugger
      debugger;
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
