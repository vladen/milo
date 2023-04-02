import { Event } from './constant.js';
import { NotProvidedError } from './errors.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { hasContext, isNil, isPromise } from './util.js';

/**
 * @param {Tacocat.Internal.Provider} provider
 * @returns {Tacocat.Internal.Subscriber}
 */
function Provide(provider) {
  /** @type {Map<string, Tacocat.SomeContext>} */
  const waiting = new Map();
  let timer;

  return (control, cycle) => {
    const log = Log.common.module('provide');

    /**
     * @param {Map<string, Tacocat.SomeContext>} pending
     * @param {Promise<any>[]} promises
     * @param {any} result
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
        if (pending.has(result.context.id)) {
          pending.delete(result.context.id);
          log.debug('Provided:', result);
          // @ts-ignore
          cycle.provide(result);
        } else {
          log.warn('Unexpected result, ignoring:', result);
        }
      }
    }

    async function provide() {
      if (control.signal?.aborted) return;
      timer = 0;

      /** @type {Map<string, Tacocat.SomeContext>} */
      const pending = new Map(waiting.entries());
      waiting.clear();

      const promises = [];
      safeSync(
        log,
        'Provider callback error:',
        () => traverse(pending, promises, provider([...pending.values()], control)),
      );

      let i = 0;
      while (i < promises.length) {
        // eslint-disable-next-line no-await-in-loop
        await promises[i].catch(() => {});
        i += 1;
      }

      traverse(pending, [], [...pending.values()].map(
        (context) => NotProvidedError(context),
      ));
    }

    cycle.listen(
      cycle.scope,
      Event.extracted,
      ({ detail: { context } }) => {
        waiting.set(context.id, context);
        if (!timer) timer = setTimeout(provide, 1);
      },
    );

    control.dispose(() => log.debug('Aborted'));
    log.debug('Activated:', { provider });
  };
}

export default Provide;
