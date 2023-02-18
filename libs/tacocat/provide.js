import { getContextKey } from './context.js';
import Event from './event.js';
import Log from './log.js';
import { hasContext, isFailure, isProduct } from './result.js';
import { safeAsync } from './safe.js';
import { isNil, isPromise } from './utilities.js';

/**
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.SafeTransformer} transformer
 * @returns {Tacocat.Internal.SafeProvider}
 */
function Provide(provider, transformer) {
  const log = Log.common.module('provide');
  log.debug('Created:', { provider, transformer });

  return (control, element) => {
    /** @type {Map<string, Tacocat.Internal.ContextEvent[]>} */
    const pending = new Map();
    /** @type {Map<string, { context: object, events: Tacocat.Internal.ContextEvent[]}>} */
    const waiting = new Map();
    let timer;

    control.dispose(() => clearTimeout(timer), element);

    async function traverse(result) {
      if (isNil(result)) return;
      if (Array.isArray(result)) result.forEach(traverse);
      else if (isPromise(result)) traverse(await result);
      else if (hasContext(result)) {
        if (isProduct(result)) await transformer(control, result);

        let events = [];
        if (hasContext(result)) {
          const key = getContextKey(context);
          if (key && pending.has(key)) {
            events = pending.get(key);
            pending.delete(key);
          } else {
            log.warn('Unexpected providing, ignored:', result);
          }
        }

        if (isProduct(result)) {
          log.debug('Resolved:', result);
          events.forEach((event) => Event.resolve.dispatch(event.target, result));
        } else if (isFailure(result)) {
          log.debug('Rejected:', result);
          events.forEach((event) => Event.reject.dispatch(event.target, result));
        } else {
          log.error('Unexpected type of result:', result);
        }
      }
    }

    async function provide() {
      if (control.signal?.aborted) return;
      timer = 0;

      const contexts = [];
      waiting.forEach(({ context, events }, key) => {
        if (pending.has(key)) {
          contexts.push(context);
          pending.set(key, events);
        } else pending.get(key).push(...events);
      });
      waiting.clear();

      traverse(await safeAsync(
        log,
        'Provider callback error:',
        () => provider(contexts, control.signal),
      ));
    }

    control.dispose(Event.extract.listen(element, (event) => {
      const { context } = event?.detail ?? {};
      const key = getContextKey(context);
      if (key) {
        if (waiting.has(key)) {
          waiting.set(key, { context: { ...context }, events: [event] });
        } else waiting.get(key).events.push(event);
        if (!timer) timer = setTimeout(provide, 0);
      } else {
        log.warn('Event context is missing, ignored:', event);
      }
    }));
  };
}

export default Provide;
