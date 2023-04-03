import { Event, Stage, qualifyDatasetName } from './constant.js';
import Log from './log.js';
import { isHTMLElement, isError, toArray, isNil, isObject } from './util.js';

const marker$ = Symbol(qualifyDatasetName('marker'));

/** @type {Tacocat.CycleEvent} */
class TacocatCycleEvent extends CustomEvent {
  /**
   * @param {boolean} bubbles
   * @param {Symbol} marker
   * @param {string} type
   * @param {Tacocat.Internal.Placeholder} detail
   */
  constructor(bubbles, marker, type, { context, element, result, stage }) {
    super(type, { bubbles, detail: { context, element, result, stage } });
    Object.defineProperty(this, marker$, { value: marker });
  }
}

/**
 * @param {Tacocat.Engine.Control} control
 * @param {HTMLElement} scope
 * @param {string} selector
 * @param {Tacocat.Engine.Filter} filter
 * @returns {Tacocat.Internal.Cycle}
 */
function Cycle(control, scope, selector, filter) {
  /** @type {WeakMap<Event, Event>} */
  const events = new WeakMap();
  const log = Log.common.module('cycle', control.alias);

  let increment = 0;
  function nextId() {
    increment += 1;
    return `${increment}-${Date.now()}`;
  }

  const marker = Symbol(nextId());
  /**
   * @param {boolean} bubbles
   * @param {string} type
   * @param {Tacocat.Internal.Placeholder} placeholder
   */
  function dispatch(bubbles, type, placeholder) {
    const tacoEvent = new TacocatCycleEvent(bubbles, marker, type, placeholder);
    if (placeholder.event) events.set(tacoEvent, placeholder.event);
    (bubbles ? placeholder.element : scope).dispatchEvent(tacoEvent);
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
      log.debug('Disposed:', { context, element });
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

    listen(target, types, listener, options = {}) {
      if (control.signal?.aborted) return;

      const disposers = [];
      const tacocatListener = (event) => {
        if (event[marker$] === marker) {
          if (options.once) {
            disposers.forEach((disposer) => disposer());
          }
          listener(event, events.get(event));
        }
      };
      toArray(types).forEach((type) => {
        target.addEventListener(type, tacocatListener, options);
        disposers.push(() => target.removeEventListener(type, tacocatListener));
      });
      control.dispose(disposers);
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
        control.dispose(() => dispose(element), element);
        dispatch(true, Event.mounted, placeholder);
      } else if (isNil(placeholder.context)) {
        context.id = nextId();
        placeholder.context = context;
        placeholders.set(context.id, placeholder);
      } else {
        const { id } = placeholder.context;
        placeholder.context = Object.assign(placeholder.context, context, { id });
      }
      dispatch(false, Event.observed, placeholder);
    },

    present(context, element) {
      if (control.signal?.aborted) return;

      const placeholder = placeholders.get(context.id);
      let release = false;
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
            release = true;
          }
        }

        dispatch(false, Event.presented, placeholder);
        if (release) control.release(placeholder.element);
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
        log.warn('Provided result is unexpected, ignoring:', result);
      }
    },

    select() {
      return [...scope.querySelectorAll(selector)].filter(filter);
    },
  };
}

export default Cycle;
