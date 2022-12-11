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
    () => { },
    // @ts-ignore
    results,
    (product) => {
      const result = transformers.reduce(
        // @ts-ignore
        (product, transformer) => safe(
          'Transformer callback error:',
          // @ts-ignore
          () => transformer(product),
          log
        ),
        product,
      );
      log.debug('Provided:', { product, result, provider, transformers });
      return result;
    },
  );
}

export default Provide;
