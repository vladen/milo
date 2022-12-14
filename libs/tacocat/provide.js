import Log from './log.js';
import { isFailure, isProduct } from './product.js';
import { safeAsync } from './safe.js';
import { isFunction, isPromise } from './utilities.js';

const log = Log.common.module('provide');

/**
 * @template T
 * @param {Tacocat.Internal.Control} control
 * @param {{
 *  awaiting: number;
 *  consumer: Tacocat.Internal.Consumer;
 *  resolver: Tacocat.Internal.Resolver;
 *  results: Tacocat.Internal.Result[];
 *  transformers: Tacocat.Internal.Transformer[];
 * }} workflow
 * @param {number} index
 * @param {T} provided
 * @returns {T}
 */
function processProducts(
  control,
  workflow,
  index,
  provided,
) {
  if (control.signal?.aborted || provided == null) return;

  let promise;
  if (isProduct(provided)) {
    if (index < workflow.transformers.length) {
      promise = safeAsync(
        log,
        'Transformer callback error:',
        () => workflow.transformers[index](provided),
      ).then((result) => {
        processProducts(control, workflow, index + 1, result);
      });
    } else {
      log.debug('Provided:', provided);
      workflow.results.push(provided);
      workflow.consumer(provided);
    }
  } else if (isFailure(provided)) {
    workflow.results.push(provided);
    workflow.consumer(provided);
  } else if (Array.isArray(provided)) {
    provided.forEach((result) => {
      processProducts(control, workflow, index, result);
    });
  } else if (isFunction(provided)) {
    promise = safeAsync(
      log,
      'Provided function error:',
      // @ts-ignore
      provided,
    ).then((result) => {
      processProducts(control, workflow, index, result);
    });
  } else if (isPromise(provided)) {
    promise = provided.then((result) => {
      processProducts(control, workflow, index, result);
    });
  }

  function tryResolve() {
    if (!workflow.awaiting && !control.signal?.aborted) {
      const { results, resolver } = workflow;
      log.debug('Resolved:', results);
      resolver(results);
    }
  }

  if (isPromise(promise)) {
    workflow.awaiting += 1;
    promise.catch((error) => {
      if (!control.signal?.aborted) {
        workflow.results.push(error);
        workflow.consumer(error);
      }
    }).finally(() => {
      workflow.awaiting -= 1;
      tryResolve();
    });
  } else tryResolve();
}

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Transformer[]} transformers
 * @returns {Tacocat.Internal.SafeProvider}
 */
const Provide = (control, provider, transformers) => (contexts, consumer) => {
  log.debug('Providing:', { contexts });
  const provided = safeAsync(
    log,
    'Provider callback error:',
    () => provider(control, contexts),
  );
  return Promise.race([
    control.promise,
    new Promise((resolver) => {
      processProducts(control, {
        awaiting: 0,
        consumer,
        results: [],
        resolver,
        transformers,
      }, 0, provided);
    }),
  ]);
};

export default Provide;
