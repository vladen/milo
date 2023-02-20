import { getContextKey, hasContext } from './context.js';
import Event from './event.js';
import Log from './log.js';
import { safeAsync } from './safe.js';
import { isError, isNil, isPromise } from './utilities.js';

/**
 * @typedef {Map<string, {
 *    context: Tacocat.Internal.Contextful;
 *    events: Tacocat.Internal.ContextfulEvent[];
 * }>} Pending
 */

/**
 * @param {Tacocat.Internal.Provider} provider
 * @returns {Tacocat.Internal.Subscriber}
 */
const Provide = (provider) => (control, element, storage) => {
  const log = Log.common.module('provide');
  log.debug('Activating:', { provider, element });

  /** @type {Map<string, { context: object, events: Tacocat.Internal.ContextfulEvent[]}>} */
  const waiting = new Map();
  let timer;

  control.dispose(() => clearTimeout(timer), element);

  /**
     * @param {Pending} pending
     * @param {Error} error
     */
  function reject(pending, error) {
    if (hasContext(error)) {
      const { context } = error;
      const key = getContextKey(context);
      if (pending.has(key)) {
        storage.setState(element, error);
        log.debug('Rejected:', error);
        pending.get(key).events.forEach((event) => {
          Event.reject.dispatch(element, error, event);
        });
        pending.delete(key);
      }
    } else {
      log.error('Contextless error:', error);
    }
  }

  /**
     * @param {Pending} pending
     * @param {Tacocat.Internal.Contextful} object
     */
  function resolve(pending, object) {
    const key = getContextKey(object.context);
    if (key && pending.has(key)) {
      storage.setState(element, object);
      log.debug('Resolved:', object);
      pending.get(key).events.forEach((event) => Event.resolve.dispatch(
        element,
        object,
        event,
      ));
      pending.delete(key);
    } else {
      log.warn('Unexpected product, ignored:', object);
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

      if (isError(result)) {
        reject(pending, result);
      } else {
        resolve(pending, result);
      }
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

    pending.forEach(({ context }) => {
      const error = new Error('Not provided');
      // @ts-ignore
      error.context = context;
      reject(pending, error);
    });
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

  control.dispose(() => log.debug('Disposed'));
  log.debug('Activated');
};

export default Provide;
