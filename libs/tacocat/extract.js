import Log from './log.js';
import { safeSync } from './safe.js';
import { isNil, isObject } from './utilities.js';

const log = Log.common.module('extract');

/**
 * @param {Tacocat.Internal.SafeDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.SafeExtractor}
 */
const Extract = (declarer, extractors) => (element) => {
  const context = declarer();
  if (!isNil(context) && extractors.every((extractor) => {
    const extracted = safeSync(
      log,
      'Extractor callback error:',
      () => extractor(context, element),
    );
    if (isObject(extracted)) {
      Object.assign(context, extracted);
      return true;
    } if (!isNil(extracted)) {
      log.warn('Unexpected extracted type:', { extracted, extractor });
    }
    return false;
  })) {
    log.debug('Extracted:', { context, extractors });
    return context;
  }
  return undefined;
};

export default Extract;
