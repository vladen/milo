import { getContextKey } from './context.js';
import { hasContext, isProduct } from './product.js';
import { safeAsync } from './safe.js';
import { isFunction, isPromise } from './utilities.js';

/**
 * @template T
 * @param {Tacocat.Log.Instance} log
 * @param {Tacocat.Internal.Processing} processing
 * @param {{
 *  pending: number,
 *  products: (Tacocat.Internal.Failure | Tacocat.Internal.Product)[]
 * }} context
 * @param {T} input
 * @returns {T}
 */
function awaitProducts(log, processing, context, input) {
  let result;
  if (input != null) {
    if (Array.isArray(input)) {
      log.debug('array:', input);
      context.pending += input.length;
      result = input.map(
        (item) => awaitProducts(log, processing, context, item),
      );
      context.pending -= input.length;
    } else if (isProduct(input)) {
      log.debug('product:', input);
      /** @type {Tacocat.Internal.Product} */
      let product = input;
      product = processing.transformer(product);
      if (isProduct(product)) {
        product.key = getContextKey(product.context);
        context.products.push(product);
        result = product;
      } else log.warn('Transformer must return product:', { product });
    } else if (isFunction(input)) {
      log.debug('function:', input);
      // @ts-ignore
      const products = safeAsync(log, 'Provided function error:', input);
      context.pending += 1;
      result = awaitProducts(log, processing, context, products);
      context.pending -= 1;
    } else if (isPromise(input)) {
      log.debug('promise');
      /** @type {Promise<any>} */
      const promise = input;
      context.pending += 1;
      result = safeAsync(log, 'Provided promise error:', () => promise)
        .then(
          (products) => {
            log.debug('promise resolved:', products);
            return awaitProducts(log, processing, context, products);
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
          if (context.pending === 0) processing.resolver(context.products);
        });
    }
  }
  if (context.pending === 0) processing.resolver(context.products);
  // @ts-ignore
  return result;
}

/**
 * @template T
 * @param {Tacocat.Log.Instance} log
 * @param {T} input
 * @param {Tacocat.Internal.Processing} processing
 * @returns {T}
 */
const Process = (
  log,
  input,
  {
    resolver = () => {},
    transformer = (product) => product,
  } = {},
) => awaitProducts(
  log,
  { resolver, transformer },
  { pending: 0, products: [] },
  input,
);

export default Process;
