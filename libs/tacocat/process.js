import { getContextKey } from './context.js';
import { hasContext, isProduct } from './product.js';
import safe from './safe.js';
import { isFunction, isPromise } from './utilities.js';

/**
 * @param {{
 *  pending: number,
 *  products: (Tacocat.Internal.Failure | Tacocat.Internal.Product)[]
 * }} context
 * @param {Tacocat.Log.Instance} log
 * @param {Tacocat.Internal.Resolver} resolver
 * @param {Tacocat.Internal.Results} results
 * @param {Tacocat.Internal.Transformer} transformer
 * @returns {Tacocat.Internal.Results}
 */
function awaitProducts(context, log, resolver, results, transformer) {
  let result;
  if (results != null) {
    if (Array.isArray(results)) {
      log.debug('array:', results);
      context.pending += results.length;
      result = results.flatMap(
        (products) => awaitProducts(context, log, resolver, products, transformer),
      );
      context.pending -= results.length;
    } else if (isProduct(results)) {
      log.debug('product:', results);
      /** @type {Tacocat.Internal.Product} */
      let product = results;
      product = transformer(product);
      if (isProduct(product)) {
        product.key = getContextKey(product.context);
        context.products.push(product);
        result = product;
      } else log.warn('Transformer must return product:', { product });
    } else if (isFunction(results)) {
      log.debug('function:', results);
      /** @type {Function} */
      const callback = results;
      const products = safe('Provided function error:', callback, log);
      context.pending += 1;
      result = awaitProducts(context, log, resolver, products, transformer);
      context.pending -= 1;
    } else if (isPromise(results)) {
      log.debug('promise');
      /** @type {Promise<any>} */
      const promise = results;
      context.pending += 1;
      result = safe('Provided promise error:', promise, log)
        .then(
          (products) => {
            log.debug('promise resolved:', products);
            return awaitProducts(context, log, resolver, products, transformer);
          },
          (error) => {
            log.debug('promise rejected:', error);
            const failure = { error: error.error ?? error };
            if (hasContext(error)) {
              failure.context = error.context;
              failure.key = getContextKey(error.context);
            }
            context.products.push(failure);
          },
        )
        .finally(() => {
          context.pending -= 1;
          if (context.pending === 0) resolver(context.products);
        });
    }
  }
  if (context.pending === 0) resolver(context.products);
  return result;
}

/**
 * @param {Tacocat.Log.Instance} log
 * @param {Tacocat.Internal.Resolver} resolver
 * @param {Tacocat.Internal.Results} results
 * @param {Tacocat.Internal.Transformer?} transformer
 * @returns {Tacocat.Internal.Results}
 */
const Process = (log, resolver, results, transformer = (product) => product) => awaitProducts(
  { pending: 0, products: [] },
  log,
  resolver,
  results,
  transformer,
);

export default Process;
