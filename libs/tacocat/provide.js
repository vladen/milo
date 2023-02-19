import { getContextKey } from './context.js';
import Event from './event.js';
import Log from './log.js';
import { hasContext, isFailure, isProduct } from './result.js';
import { safeAsync } from './safe.js';
import { isNil, isPromise } from './utilities.js';

/**
 * @typedef {Map<string, {
 *    context: Tacocat.Internal.Context;
 *    events: Tacocat.Internal.ContextEvent[];
 * }>} Pending
 */

/**
 * @param {Tacocat.Internal.Provider} provider
 * @returns {Tacocat.Internal.Subscriber}
 */
function Provide(provider) {
  const log = Log.common.module('provide');
  log.debug('Created:', { provider });

  return (control, depot, element) => {
    /** @type {Map<string, { context: object, events: Tacocat.Internal.ContextEvent[]}>} */
    const waiting = new Map();
    let timer;

    control.dispose(() => clearTimeout(timer), element);

    /**
     * @param {Pending} pending
     */
    function reject(pending, result) {
      if (hasContext(result)) {
        const { context } = result;
        const key = getContextKey(context);
        if (pending.has(key)) {
          const failure = isFailure(result) ? result : {
            ...result,
            context,
            error: new Error('Unexpected result'),
          };
          log.debug('Rejected:', failure);
          pending.get(key).events.forEach((event) => {
            depot.setState(failure);
            Event.reject.dispatch(element, failure, event);
          });
          pending.delete(key);
        }
      } else {
        log.error('Contextless rejection, ignored:', result);
      }
    }

    /**
     * @param {Pending} pending
     * @param {Tacocat.Internal.Product} product
     */
    function resolve(pending, product) {
      const key = getContextKey(product.context);
      if (key && pending.has(key)) {
        log.debug('Resolved:', product);
        pending.get(key).events.forEach((event) => Event.resolve.dispatch(
          event.target,
          product,
        ));
        pending.delete(key);
      } else {
        log.warn('Unexpected product, ignored:', product);
      }
    }

    /**
     * @param {Pending} pending
     * @param {Promise<any>[]} promises
     */
    function traverse(pending, promises, result) {
      if (!isNil(result)) {
        if (Array.isArray(result)) {
          result.forEach((item) => traverse(pending, promises, item));
          return;
        }

        if (isPromise(result)) {
          promises.push(result.then(
            (product) => traverse(pending, promises, product),
            (failure) => traverse(pending, promises, failure),
          ));
          return;
        }

        if (isProduct(result)) {
          resolve(pending, result);
          return;
        }

        reject(pending, result);
      }
    }

    async function provide() {
      if (control.signal?.aborted) return;
      timer = 0;

      /** @type {Pending} */
      const pending = new Map();
      waiting.forEach(({ context, events }, key) => {
        if (pending.has(key)) pending.get(key).events.push(...events);
        else pending.set(key, { context, events });
      });
      waiting.clear();

      const promise = safeAsync(
        log,
        'Provider callback error:',
        () => provider(
          [...pending.values()].map(({ context }) => context),
          control.signal,
        ),
      );
      const promises = [promise];
      traverse(pending, promises, promise);

      const i = 0;
      while (i < promises.length) {
        // eslint-disable-next-line no-await-in-loop
        await promises[i].catch(() => {});
      }

      pending.forEach(({ context }) => reject(pending, {
        context,
        error: new Error('Not provided'),
      }));
    }

    control.dispose(
      Event.extract.listen(element, (event) => {
        const { context } = event?.detail ?? {};
        const key = getContextKey(context);
        if (key) {
          if (waiting.has(key)) {
            waiting.get(key).events.push(event);
          } else {
            waiting.set(key, {
              context: { ...context },
              events: [event],
            });
          }
          if (!timer) timer = setTimeout(provide, 0);
        } else {
          log.warn('Context is missing, ignored:', event);
        }
      }),
    );
  };
}

export default Provide;
