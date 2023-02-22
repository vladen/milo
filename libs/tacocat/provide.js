import Channel from './channel.js';
import { ErrorMessage, Stage } from './constants.js';
import { assignContext, getContextKey, hasContext } from './context.js';
import Log from './log.js';
import { safeSync } from './safe.js';
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
function Provide(provider) {
  /** @type {Map<string, { context: object, events: Tacocat.Internal.ContextfulEvent[]}>} */
  const waiting = new Map();
  let timer;

  const log = Log.common.module('provide');
  log.debug('Created:', { provider });

  return (control, element, storage) => {
    log.debug('Activating:', { element });

    /**
     * @param {Pending} pending
     * @param {Promise<any>[]} promises
     */
    function traverse(pending, promises, result) {
      if (isNil(result)) return;
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

      if (hasContext(result)) {
        const key = getContextKey(result?.context);
        if (pending.has(key)) {
          const stage = isError(result)
            ? Stage.Rejected
            : Stage.resolved;
          storage.setState(element, result);
          log.debug(stage === Stage.rejected ? 'Rejected:' : 'Resolved:', result);
          const { events } = pending.get(key);
          pending.delete(key);
          events.forEach((event) => {
            event.detail.stage = Stage.resolved;
            Channel.provide.dispatch(element, result, event);
            Channel.resolved.dispatch(element, result);
          });
        } else {
          log.warn('Contextless result, ignored:', result);
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

      const promises = [];
      safeSync(
        log,
        'Provider callback error:',
        () => traverse(pending, promises, provider(
          [...pending.values()].map(({ context }) => context),
          control.signal,
        )),
      );

      const i = 0;
      while (i < promises.length) {
      // eslint-disable-next-line no-await-in-loop
        await promises[i].catch(() => {});
      }

      traverse(pending, [], [...pending.values()].map(({ context }) => assignContext(
        new Error(ErrorMessage.notProvided),
        context,
      )));
    }

    control.dispose(
      Channel.extract.listen(element, (event) => {
        const { context } = event?.detail ?? {};
        const key = getContextKey(context);
        if (key) {
          event.detail.stage = Stage.pending;
          if (waiting.has(key)) {
            waiting.get(key).events.push(event);
          } else {
            waiting.set(key, {
              context: { ...context },
              events: [event],
            });
            Channel.pending.dispatch(element, context);
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
}

export default Provide;
