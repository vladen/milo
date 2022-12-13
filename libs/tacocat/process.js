import { isProduct } from './product.js';
import { safeAsync } from './safe.js';
import { isFunction, isPromise } from './utilities.js';

/**
 * @template T
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Log.Instance} log
 * @param {Tacocat.Internal.Processing} processing
 * @param {{
 *  pending: number,
 *  products: (Tacocat.Internal.Failure | Tacocat.Internal.Product)[]
 * }} context
 * @param {T} input
 * @returns {T}
 */
function awaitProducts(control, log, processing, context, input) {
  if (control.signal.aborted) return undefined;
  let result;
  if (input != null) {
    if (Array.isArray(input)) {
      log.debug('array:', input);
      context.pending += input.length;
      result = input.map(
        (item) => awaitProducts(control, log, processing, context, item),
      );
      context.pending -= input.length;
    } else if (isProduct(input)) {
      log.debug('product:', input);
      /** @type {Tacocat.Internal.Product} */
      let product = input;
      product = processing.transformer(product);
      if (isProduct(product)) {
        context.products.push(product);
        result = product;
      } else log.warn('Transformer must return product:', { product });
    } else if (isFunction(input)) {
      log.debug('function:', input);
      // @ts-ignore
      const products = safeAsync(log, 'Provided function error:', input);
      context.pending += 1;
      result = awaitProducts(control, log, processing, context, products);
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
            return awaitProducts(control, log, processing, context, products);
          },
          (error) => {
            /** @type {Tacocat.Internal.Failure} */
            const failure = error;
            log.debug('promise rejected:', error);
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
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Log.Instance} log
 * @param {T} results
 * @param {Tacocat.Internal.Processing} processing
 * @returns {T}
 */
const Process = (
  control,
  log,
  results,
  {
    resolver = () => {},
    transformer = (product) => product,
  } = {},
) => awaitProducts(
  control,
  log,
  { resolver, transformer },
  { pending: 0, products: [] },
  results,
);

export default Process;
