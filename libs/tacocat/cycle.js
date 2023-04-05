import { Event, Stage } from './constant.js';
import Log from './log.js';
import { isHTMLElement, isError, isNil, isObject } from './util.js';

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Engine.Filter} filter
 * @returns {Tacocat.Internal.Cycle}
 */
function Cycle(control, filter) {
  let increment = 0;
  const log = Log.common.module('cycle', control.alias);
  const { scope, selector } = control;

  /** @type {Tacocat.Internal.CycleEvent} */
  class TacocatCycleEvent extends CustomEvent {
    /**
     * @param {boolean} bubbles
     * @param {string} type
     * @param {Tacocat.Internal.Placeholder} placeholder
     */
    constructor(bubbles, type, placeholder) {
      super(type, {
        bubbles,
        detail: Object.freeze({ ...placeholder, control, scope, selector }),
      });
    }
  }

  function nextId() {
    increment += 1;
    return `${increment}-${Date.now()}`;
  }

  /**
   * @param {boolean} bubbles
   * @param {string} type
   * @param {Tacocat.Internal.Placeholder} placeholder
   */
  function dispatch(bubbles, type, placeholder) {
    control.dispatch(
      bubbles ? placeholder.element : scope,
      new TacocatCycleEvent(bubbles, type, placeholder),
    );
  }

  /** @type {Map<any, Tacocat.Internal.Placeholder>} */
  const placeholders = new Map();

  /**
   * @param {HTMLElement} element
   */
  function dispose(element) {
    // eslint-disable-next-line no-param-reassign
    const context = placeholders.get(element)?.context;
    if (!isNil(context)) {
      log.debug('Disposed:', { context, element, placeholders });
      placeholders.delete(context.id);
      placeholders.delete(element);
    }
  }

  /**
   * @param {Node} node
   * @returns {HTMLElement}
   */
  function match(node) {
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
  }

  return {
    control,
    get placeholders() {
      return [...placeholders.values()];
    },

    dispose(element) {
      control.release(element);
    },

    exists(element) {
      return placeholders.has(element);
    },

    extract(context) {
      if (control.signal?.aborted) return;

      const placeholder = placeholders.get(context.id);
      if (placeholder) {
        placeholder.context = context;
        placeholder.stage = Stage.pending;
        dispatch(true, Event.pending, placeholder);
        dispatch(false, Event.extracted, placeholder);
      } else {
        log.warn('Extracted context is unexpected:', { context });
      }
    },

    listen(target, type, listener, options) {
      control.listen(target, type, listener, options);
    },

    match(node) {
      return match(node);
    },

    observe(element, context, event) {
      if (control.signal?.aborted) return;

      if (!isObject(context)) {
        if (!isNil(context)) {
          log.warn('Placeholder context should be an object:', { context, element });
        }
        // eslint-disable-next-line no-param-reassign
        context = {};
      }

      let placeholder = placeholders.get(element);
      if (isNil(placeholder)) {
        context.id = nextId();
        placeholder = {
          context,
          element,
          event,
          result: null,
          stage: Stage.mounted,
        };
        placeholders.set(element, placeholder);
        placeholders.set(context.id, placeholder);
        control.capture(() => dispose(element), element);
        dispatch(true, Event.mounted, placeholder);
      } else if (isNil(placeholder.context)) {
        context.id = nextId();
        placeholder.context = context;
        placeholders.set(context.id, placeholder);
      } else {
        const { id } = placeholder.context;
        placeholder.context = Object.assign(placeholder.context, context, { id });
      }
      placeholder.event = event;
      dispatch(false, Event.observed, placeholder);
    },

    present(context, element) {
      if (control.signal?.aborted) return;

      const placeholder = placeholders.get(context.id);
      if (placeholder) {
        if (element !== placeholder.element) {
          if (!element.isConnected) placeholder.element.replaceWith(element);
          const detail = { context, new: element, old: placeholder.element };
          if (match(element)) {
            placeholders.delete(placeholder.element);
            placeholders.set(element, placeholder);
            placeholder.element = element;
            log.debug('Placeholder was updated by presenter:', detail);
          } else {
            log.debug('Placeholder was changed by presenter:', detail);
            control.release(placeholder.element);
          }
        }

        dispatch(false, Event.presented, placeholder);
      } else {
        log.warn('Presented placeholder was not found, ignoring:', { context, element });
      }
    },

    provide(result) {
      if (control.signal?.aborted) return;

      const placeholder = placeholders.get(result.context.id);
      if (placeholder) {
        placeholder.context = result.context;
        placeholder.result = result;
        placeholder.stage = isError(result) ? Stage.rejected : Stage.resolved;

        dispatch(
          true,
          placeholder.stage === Stage.rejected ? Event.rejected : Event.resolved,
          placeholder,
        );
        dispatch(false, Event.provided, placeholder);
      } else {
        log.debug('Provided result is unexpected, ignoring:', result);
      }
    },
  };
}

export default Cycle;
