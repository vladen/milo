import { Event, Stage, qualifyDatasetName } from './constant.js';
import Log from './log.js';
import { isHTMLElement, isError, toArray, isNil, isNumber } from './util.js';

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
  const log = Log.common.module('cycle');

  let increment = 0;
  function getId() {
    increment += 1;
    return `${increment}-${Date.now()}`;
  }

  const marker = Symbol(getId());
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
   * @param {{
   *  context?: Tacocat.SomeContext;
   *  element: HTMLElement;
   * }} placeholder
   */
  function dispose({ context, element }) {
    // eslint-disable-next-line no-param-reassign
    if (isNil(context)) context = placeholders.get(element)?.context ?? {};
    if (isNil(context)) {
      log.warn('Unexpected dispose:', element);
    } else {
      log.info('Disposed:', { context, element });
      placeholders.delete(context.id);
      placeholders.delete(element);
    }
  }

  control.dispose(() => {
    [...placeholders.values()].forEach(dispose);
  });

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
      dispose({ element });
      control.release(element);
    },

    exists(element) {
      return placeholders.has(element);
    },

    extract(context) {
      const placeholder = placeholders.get(context.id);
      if (placeholder) {
        placeholder.context = context;
        placeholder.stage = Stage.pending;
        dispatch(true, Event.pending, placeholder);
        dispatch(false, Event.extracted, placeholder);
      } else {
        // eslint-disable-next-line no-debugger
        debugger;
        log.warn('Extracted context is unexpected:', { context });
      }
    },

    listen(target, types, listener, options = {}) {
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
      // eslint-disable-next-line no-param-reassign
      if (isNil(context)) context = {};
      else if (isNumber(context.id)) {
        placeholders.delete(context.id);
      }
      increment += 1;
      context.id = `${increment}-${Date.now()}`;
      if (placeholder) {
        placeholder.context = context;
        placeholder.stage = Stage.stale;
      } else {
        placeholder = {
          context,
          element,
          event,
          result: null,
          stage: Stage.stale,
        };
        placeholders.set(element, placeholder);
      }
      placeholders.set(context.id, placeholder);
      dispatch(true, Event.stale, placeholder);
      dispatch(false, Event.observed, placeholder);
    },

    present(context, element) {
      const placeholder = placeholders.get(context.id);
      if (placeholder) {
        placeholders.delete(placeholder.element);
        placeholder.element = element;
        placeholders.set(element, placeholder);
        dispatch(false, Event.presented, placeholder);
      } else {
        // eslint-disable-next-line no-debugger
        debugger;
        log.warn('Presented placeholder was not found, ignoring:', { context, element });
      }
    },

    provide(result) {
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
        // eslint-disable-next-line no-debugger
        debugger;
        log.warn('Provided result is unexpected, ignoring:', result);
      }
    },

    select() {
      return [...scope.querySelectorAll(selector)].filter(filter);
    },
  };
}

export default Cycle;
