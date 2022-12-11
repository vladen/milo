import { getContextKey } from './context';
import safe from "./safe";
import { isFunction, isObject, isPromise } from "./utilities";

/**
 * @param {{
 *  pending: number,
 *  results: (Tacocat.Internal.Failure | Tacocat.Internal.Product)[]
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
      result = results.flatMap(
        // @ts-ignore
        (result) => awaitProducts(context, log, resolver, result, transformer)
      );
    }
    if (isFunction(results)) {
      // @ts-ignore
      const products = safe('Provided function error:', results, log);
      // @ts-ignore
      result = awaitProducts(context, log, resolver, products, transformer);
    } else if (isPromise(results)) {
      context.pending += 1;
      // @ts-ignore
      result = safe('Provided promise error:', results, log)
        // @ts-ignore
        .then(
          (value) => awaitProducts(context, log, resolver, value, transformer),
          (error) => {
            context.results.push({
              context: error.context,
              key: getContextKey(error.context),
              error: error.error ?? error,
            });
          },
        )
        .finally(() => {
          context.pending -= 1;
        });
    } else if (isObject(results)) {
      // @ts-ignore
      result = transformer(results);
      result.key = getContextKey(result.context);
      context.results.push(result);
    }
  }
  if (context.pending === 0) {
    resolver(context.results);
  }
  return result;
}

/**
 * @param {Tacocat.Log.Instance} log
 * @param {Tacocat.Internal.Resolver} resolver
 * @param {Tacocat.Internal.Results} results
 * @param {Tacocat.Internal.Transformer} transformer
 * @returns {Tacocat.Internal.Results}
 */
const Process = (log, resolver, results, transformer) => awaitProducts(
  { pending: 0, results: [] },
  log,
  resolver,
  results,
  transformer,
);

export default Process;
