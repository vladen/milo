import Log from "./log";
import Process from './process';
import safe from "./safe";

const log = Log.common.module('provide');

/**
 * @param {Tacocat.Internal.Provider} provider
 * @param {AbortSignal} signal
 * @param {Tacocat.Internal.Transformer[]} transformers
 * @returns {Tacocat.Internal.Provider}
 */
const Provide = (provider, signal, transformers) => (contexts) => {
  log.debug('Providing:', { contexts })
  const results = safe(
    'Provider callback error:',
    // @ts-ignore
    () => provider(contexts, signal),
    log,
  );
  return Process(
    log,
    () => {},
    // @ts-ignore
    results,
    (product) => transformers.reduce(
      // @ts-ignore
      (product, transformer) => {
        // @ts-ignore
        const result = safe('Transformer callback error:', () => transformer(product), log);
        log.debug('Transformed:', { product, result });
        return result;
      },
      product,
    ),
  );
}

export default Provide;
