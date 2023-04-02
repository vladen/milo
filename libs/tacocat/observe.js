import Control from './control.js';
import Cycle from './cycle.js';
import Engine from './engine.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isFunction, isNil } from './util.js';

const childListMutation = 'childList';
const observableMutations = ['attributes', 'attributeFilter', 'characterData', childListMutation];

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
  /** @type {Set<HTMLElement>} */
  const removed = new Set();
  /** @type {Map<HTMLElement, Event?>} */
  const updated = new Map();
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
      removed.forEach(unmount);

      updated.forEach((event, element) => {
        mount(element, (nextEvent) => {
          // eslint-disable-next-line no-debugger
          debugger;
          updated.set(element, nextEvent);
          schedule();
        });
        const detail = { element };
        if (!isNil(event)) detail.event = event;
        setTimeout(() => {
          log.debug('Observed:', detail);
          cycle.observe(element, undefined, event);
        }, 1);
      });
    }

    timer = setTimeout(dispatch, 0);
  }

  /**
   * Adds element to the remove queue and schedules async handling.
   * @param {HTMLElement} element
   */
  function remove(element) {
    if (element) {
      removed.add(element);
      updated.delete(element);
    }
    schedule();
  }

  /**
   * Adds element to the update queue and schedules async handling.
   * @param {HTMLElement} element
   */
  function update(element) {
    if (element) {
      removed.delete(element);
      updated.set(element, undefined);
    }
    schedule();
  }

  // Activate subscribers
  subscribers.forEach((subscriber) => {
    subscriber(control, cycle);
  });

  // Scan current DOM tree for matching elements
  cycle.select().forEach(update);

  let observing = false;
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
    observing = true;
  }

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { observing, reactions, scope, selector });
  return Engine(cycle);
}

export default Observe;
