import { Event, Stage } from './constants.js';
import Log from './log.js';
import { isElement, isError, isObject } from './utilities.js';

/** @type {Tacocat.CycleEvent} */
class TacocatCycleEvent extends CustomEvent {
  /**
   * @param {string} type
   * @param {Tacocat.Internal.Placeholder} detail
   */
  constructor(type, { context, element, result, stage }) {
    super(type, { bubbles: true, detail: { context, element, result, stage } });
  }
}

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Element} scope
 * @param {string} selector
 * @param {Tacocat.Engine.Filter} filter
 * @returns {Tacocat.Internal.Cycle}
 */
function Cycle(control, scope, selector, filter) {
  /** @type {WeakMap<Event, Event>} */
  const events = new WeakMap();
  const log = Log.common.module('cycle');
  let id = 0;
  /** @type {Map<any, Tacocat.Internal.Placeholder>} */
  const placeholders = new Map();

  /**
   * @param {string} type
   * @param {Tacocat.Internal.Placeholder} placeholder
   */
  function dispatch(type, placeholder) {
    const tacoEvent = new TacocatCycleEvent(type, placeholder);
    if (placeholder.event) events.set(tacoEvent, placeholder.event);
    placeholder.element.dispatchEvent(tacoEvent);
  }

  return {
    get placeholders() {
      return [...placeholders.values()];
    },
    get scope() {
      return scope;
    },
    get selector() {
      return selector;
    },

    dispose(element) {
      placeholders.delete(placeholders.get(element)?.context?.id);
      placeholders.delete(element);
      control.release(element);
    },

    exists(element) {
      return placeholders.has(element);
    },

    extract(context) {
      const placeholder = placeholders.get(context.id);
      if (placeholder) {
        placeholder.context = context;
        log.debug('Extracted:', placeholder);
        dispatch(Event.pending, placeholder);
        dispatch(Event.extracted, placeholder);
      } else {
        log.warn('Extracted context is unexpected:', { context });
      }
    },

    listen(types, listener, options = {}) {
      const tacocatListener = (event) => listener(event, events.get(event));
      (Array.isArray(types) ? types : [types]).forEach((type) => {
        scope.addEventListener(type, tacocatListener, options);
        control.dispose(() => scope.removeEventListener(type, tacocatListener));
      });
    },

    match(node) {
      const element = isElement(node)
        ? node
        : node.parentElement;
      if (element) {
        if (element.matches(selector) && filter(element)) return element;
        const closest = element.closest(selector);
        if (
          closest?.compareDocumentPosition(scope) === Node.DOCUMENT_POSITION_CONTAINS
          && filter(closest)
        ) return closest;
      }
      return undefined;
    },

    observe(element, context, event) {
      let placeholder = placeholders.get(element);
      if (placeholder) {
        placeholder.stage = Stage.pending;
      } else {
        placeholder = {
          context: null,
          element,
          event,
          result: null,
          stage: Stage.pending,
        };
        placeholders.set(context.id, placeholder);
        placeholders.set(element, placeholder);
      }
      placeholder.context = {
        ...(isObject(context) ? context : {}),
        // eslint-disable-next-line no-plusplus
        id: `${++id}-${Date.now()}`,
      };
      dispatch(Event.stale, placeholder);
      dispatch(Event.observed, placeholder);
    },

    present(context, element) {
      const placeholder = placeholders.get(context.id);
      if (placeholder) {
        placeholder.element = element;
        dispatch(Event.presented, placeholder);
      }
    },

    provide(result) {
      const placeholder = placeholders.get(result.context.id);
      if (placeholder) {
        placeholder.context = result.context;
        placeholder.result = result;
        placeholder.stage = isError(result) ? Stage.rejected : Stage.resolved;
        dispatch(
          placeholder.stage === Stage.rejected ? Event.rejected : Event.resolved,
          placeholder,
        );
        dispatch(Event.provided, placeholder);
      } else {
        log.warn('Provided result is unexpected, ignoring:', result);
      }
    },

    select() {
      return [...scope.querySelectorAll(selector)].filter(filter);
    },
  };
}

export default Cycle;
