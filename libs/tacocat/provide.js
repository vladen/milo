import Channel from './channel.js';
import { Stage } from './constants.js';
import { getContextKey, hasContext } from './context.js';
import { NotProvidedError } from './errors.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isError, isNil, isPromise } from './utilities.js';

/**
 * @param {Tacocat.Internal.Provider} provider
 * @returns {Tacocat.Internal.Subscriber}
 */
function Provide(provider) {
  /** @type {Map<string, { context: object; events: Event[]; }>} */
  const waiting = new Map();
  let timer;

  return (control, element, storage) => {
    const log = Log.common.module('provide');
    log.debug('Activating:', { element, provider });

    /**
     * @param {Map<string, { context: Tacocat.SomeContext; events: Event[]; }>} pending
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
          const { events } = pending.get(key);
          pending.delete(key);
          storage.setState(element, result);
          let stage;
          if (isError(result)) {
            log.debug('Rejected:', result);
            stage = Stage.rejected;
          } else {
            log.debug('Resolved:', result);
            stage = Stage.resolved;
          }
          events.forEach((event) => {
            Channel.provide.dispatch(element, result, stage, event);
            (
              stage === Stage.resolved ? Channel.resolved : Channel.rejected
            ).dispatch(element, result, stage);
          });
        } else {
          log.warn('Contextless result, ignored:', result);
        }
      }
    }

    async function provide() {
      if (control.signal?.aborted) return;
      timer = 0;

      /** @type {Map<string, { context: Tacocat.Internal.Contextful; events: Event[]; }>} */
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

      traverse(pending, [], [...pending.values()].map(
        ({ context }) => NotProvidedError(context),
      ));
    }

    control.dispose(
      Channel.extract.listen(element, (state, stage, event) => {
        const { context } = state ?? {};
        const key = getContextKey(context);
        if (key) {
          if (waiting.has(key)) {
            waiting.get(key).events.push(event);
          } else {
            waiting.set(key, { context: { ...context }, events: [event] });
            Channel.pending.dispatch(element, context, Stage.pending);
          }
          if (!timer) timer = setTimeout(provide, 1);
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
