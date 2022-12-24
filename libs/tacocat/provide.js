import Log from './log.js';
import { Failure, isFailure, isProduct } from './product.js';
import { safeAsync } from './safe.js';
import { isFunction, isPromise } from './utilities.js';

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Transformer[]} transformers
 * @returns {Tacocat.Internal.SafeProvider}
 */
function Provide(control, provider, transformers) {
  const log = Log.common.module('provide');
  log.debug('Created:', { control, provider, transformers });

  return (contexts, consumer) => {
    if (control.dispose(() => log.debug('Disposed'))) {
      return Promise.reject(contexts.map((context) => Failure(context, new Error('Disposed'))));
    }

    let pending = 0;
    const results = [];
    log.debug('Providing:', { contexts });

    /**
     * @param {number} index
     * @param {(results: any[]) => void} resolve
     * @param {any} value
     */
    function processProducts(index, resolve, value) {
      if (control.signal?.aborted || value == null) return;

      let promise;
      if (isProduct(value)) {
        if (index < transformers.length) {
          promise = safeAsync(
            log,
            'Transformer callback error:',
            () => transformers[index](value),
          ).then((result) => {
            processProducts(index + 1, resolve, result);
          });
        } else {
          log.debug('Provided:', value);
          results.push(value);
          consumer(value);
        }
      } else if (isFailure(value)) {
        results.push(value);
        consumer(value);
      } else if (Array.isArray(value)) {
        value.forEach((result) => {
          processProducts(index, resolve, result);
        });
      } else if (isFunction(value)) {
        promise = safeAsync(
          log,
          'Provided function error:',
          // @ts-ignore
          value,
        ).then((result) => {
          processProducts(index, resolve, result);
        });
      } else if (isPromise(value)) {
        promise = value.then((result) => {
          processProducts(index, resolve, result);
        });
      }

      function tryResolve() {
        if (!pending && !control.signal?.aborted) {
          log.debug('Resolved:', results);
          resolve(results);
        }
      }

      if (isPromise(promise)) {
        pending += 1;
        promise.catch((error) => {
          if (!control.signal?.aborted) {
            results.push(error);
            consumer(error);
          }
        }).finally(() => {
          pending -= 1;
          tryResolve();
        });
      } else tryResolve();
    }

    return Promise.race([
      control.expire([]),
      new Promise((resolve) => {
        processProducts(0, resolve, safeAsync(
          log,
          'Provider callback error:',
          () => provider(control, contexts),
        ));
      }),
    ]);
  };
}

export default Provide;
