import Log from './log.js';
import { safeSync } from './safe.js';
import { isObject } from './utilities.js';

const log = Log.common.module('extract');

/**
 * @param {Tacocat.Internal.SafeDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.SafeExtractor}
 */
const Extract = (declarer, extractors) => (element) => {
  const context = extractors.reduce(
    (extracted, extractor) => {
      const result = safeSync(
        log,
        'Extractor callback error:',
        () => extractor(extracted, element),
      );
      return isObject(result) ? Object.assign(extracted, result) : extracted;
    },
    declarer(),
  );

  log.debug('Extracted:', { context, extractors });
  return context;
};

export default Extract;
