import Log from './log.js';
import Process from './process.js';
import { safeAsync, safeSync } from './safe.js';

const log = Log.common.module('provide');

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Transformer[]} transformers
 * @returns {Tacocat.Internal.SafeProvider}
 */
const Provide = (control, provider, transformers) => (contexts) => {
  log.debug('Providing:', { contexts });
  const results = safeAsync(
    log,
    'Provider callback error:',
    () => provider(control, contexts),
  );
  return Process(control, log, results, {
    transformer(product) {
      const result = transformers.reduce(
        (transformed, transformer) => safeSync(
          log,
          'Transformer callback error:',
          () => transformer(transformed),
        ),
        product,
      );
      log.debug('Provided:', { product, result, provider, transformers });
      return result;
    },
  });
};

export default Provide;
