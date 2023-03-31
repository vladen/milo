import { EventType, StageName } from './constants.js';
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
 * @returns {Tacocat.Internal.Cycle}
 */
function Cycle(control, scope, selector) {
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
        dispatch(EventType.pending, placeholder);
        dispatch(EventType.extracted, placeholder);
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
        if (element.matches(selector)) return element;
        const closest = element.closest(selector);
        if (closest?.compareDocumentPosition(scope) === Node.DOCUMENT_POSITION_CONTAINS) {
          return closest;
        }
      }
      return undefined;
    },

    observe(element, context, event) {
      let placeholder = placeholders.get(element);
      if (placeholder) {
        placeholder.stage = StageName.pending;
      } else {
        placeholder = {
          context: null,
          element,
          event,
          result: null,
          stage: StageName.pending,
        };
        placeholders.set(context.id, placeholder);
        placeholders.set(element, placeholder);
      }
      placeholder.context = {
        ...(isObject(context) ? context : {}),
        // eslint-disable-next-line no-plusplus
        id: `${++id}-${Date.now()}`,
      };
      dispatch(EventType.stale, placeholder);
      dispatch(EventType.observed, placeholder);
    },

    present(context, element) {
      const placeholder = placeholders.get(context.id);
      if (placeholder) {
        placeholder.element = element;
        dispatch(EventType.presented, placeholder);
      }
    },

    provide(result) {
      const placeholder = placeholders.get(result.context.id);
      if (placeholder) {
        placeholder.context = result.context;
        placeholder.result = result;
        placeholder.stage = isError(result) ? StageName.rejected : StageName.resolved;
        dispatch(
          placeholder.stage === StageName.rejected ? EventType.rejected : EventType.resolved,
          placeholder,
        );
        dispatch(EventType.provided, placeholder);
      } else {
        log.warn('Provided result is unexpected, ignoring:', result);
      }
    },
  };
}

export default Cycle;
