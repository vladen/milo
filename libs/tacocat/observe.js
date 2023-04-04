import Cycle from './cycle.js';
import Engine from './engine.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isNil, toArray } from './util.js';

const childListMutation = 'childList';
const observableMutations = ['attributes', 'attributeFilter', 'characterData', childListMutation];

/**
 * @param {{
 *  control: Tacocat.Internal.Control;
 *  reactions: Tacocat.Internal.Reactions;
 *  subscribers: Tacocat.Internal.Subscriber[];
 *  scope: HTMLElement;
 *  selector: string;
 *  filter: Tacocat.Engine.Filter;
 * }} detail
 * @returns {Tacocat.Internal.Engine}
 */
function Observe({ control, filter, reactions, subscribers }) {
  const { scope, selector } = control;
  const fact = { reactions, scope, selector };
  const log = Log.common.module('observe', control.alias);

  if (control.signal?.aborted) {
    return {
      get placeholders() {
        return [];
      },
    };
  }

  const cycle = Cycle(control, filter);
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
    toArray(reactions.trigger).flat().forEach((trigger) => {
      safeSync(
        log,
        'Trigger callback error:',
        () => trigger(element, listener, control),
      );
      log.debug('Installed trigger:', { element, trigger });
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
          updated.set(element, nextEvent);
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
    control.capture(() => observer.disconnect());
    fact.observing = true;
  }

  control.capture(() => log.debug('Aborted'));
  log.debug('Activated:', fact);
  return Engine(cycle);
}

export default Observe;
