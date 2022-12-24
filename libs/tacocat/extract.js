import Log from './log.js';
import { safeSync } from './safe.js';
import { isNil, isObject } from './utilities.js';

/**
 * @param {Tacocat.Internal.SafeDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.SafeExtractor}
 */
function Extract(declarer, extractors) {
  const log = Log.common.module('extract');
  log.debug('Created:', { declarer, extractors });

  return (context, element) => {
    if (declarer(context) && extractors.every((extractor) => {
      const extracted = safeSync(
        log,
        'Extractor callback error:',
        () => extractor(context, element),
      );
      if (isObject(extracted)) {
        Object.assign(context, extracted);
        return true;
      }
      if (!isNil(extracted)) {
        log.warn('Unexpected extracted type:', { extracted, extractor });
      }
      return false;
    })) {
      log.debug('Extracted:', { context, extractors });
      return true;
    }
    return false;
  };
}

export default Extract;
