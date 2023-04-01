import { Event, Stage } from './constants.js';
import Log from './log.js';
import { isHTMLElement, isError, isObject, toArray } from './utils.js';

/** @type {Tacocat.CycleEvent} */
class TacocatCycleEvent extends CustomEvent {
  /**
   * @param {boolean} bubbles
   * @param {string} type
   * @param {Tacocat.Internal.Placeholder} detail
   */
  constructor(bubbles, type, { context, element, result, stage }) {
    super(type, { bubbles, detail: { context, element, result, stage } });
  }
}

/**
 * @param {Tacocat.Internal.Control} control
 * @param {HTMLElement} scope
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
   * @param {boolean} bubbles
   * @param {string} type
   * @param {Tacocat.Internal.Placeholder} placeholder
   */
  function dispatch(bubbles, type, placeholder) {
    const tacoEvent = new TacocatCycleEvent(bubbles, type, placeholder);
    if (placeholder.event) events.set(tacoEvent, placeholder.event);
    (bubbles ? placeholder.element : scope).dispatchEvent(tacoEvent);
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
        dispatch(true, Event.pending, placeholder);
        dispatch(false, Event.extracted, placeholder);
      } else {
        log.warn('Extracted context is unexpected:', { context });
      }
    },

    listen(types, listener, options = {}) {
      const tacocatListener = (event) => listener(event, events.get(event));
      toArray(types).forEach((type) => {
        scope.addEventListener(type, tacocatListener, options);
        control.dispose(() => scope.removeEventListener(type, tacocatListener));
      });
    },

    match(node) {
      const element = isHTMLElement(node)
        ? node
        : node.parentElement;
      if (element) {
        if (element.matches(selector) && filter(element)) return element;
        const closest = element.closest(selector);
        if (
          isHTMLElement(closest)
          && closest?.compareDocumentPosition(scope) === Node.DOCUMENT_POSITION_CONTAINS
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
      dispatch(true, Event.stale, placeholder);
      dispatch(false, Event.observed, placeholder);
    },

    present(context, element) {
      const placeholder = placeholders.get(context.id);
      if (placeholder) {
        placeholder.element = element;
        dispatch(
          true,
          placeholder.stage === Stage.rejected ? Event.rejected : Event.resolved,
          placeholder,
        );
      }
    },

    provide(result) {
      const placeholder = placeholders.get(result.context.id);
      if (placeholder) {
        placeholder.context = result.context;
        placeholder.result = result;
        placeholder.stage = isError(result) ? Stage.rejected : Stage.resolved;
        dispatch(false, Event.provided, placeholder);
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
