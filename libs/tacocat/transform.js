import Log from './log.js';
import { isFailure, isProduct } from './result.js';
import { safeAsyncEvery } from './safe.js';
import { isFunction, isNil } from './utilities.js';

/**
 * @param {({} | Tacocat.Internal.Transformer)[]} transformers
 * @returns {Tacocat.Internal.SafeTransformer}
 */
function Transform(transformers) {
  const log = Log.common.module('transform');
  log.debug('Created:', { transformers });

  return async (control, product) => {
    if (!isProduct(product)) return false;
    let result = product;

    const success = await safeAsyncEvery(
      log,
      'Transformer callback error:',
      transformers,
      async (transformer) => {
        if (control.signal?.aborted) return false;
        if (isFunction(transformer)) {
          result = await transformer(result);
          if (isProduct(result)) return true;
          if (isFailure(result)) return false;
          log.warn('Unexpected transformation:', { product, result, transformer });
        }
        return false;
      },
    );

    if (!success) return false;
    log.debug('Transformed:', product, result);
    Object.assign(product, result);
    return true;
  };
}

export default Transform;
