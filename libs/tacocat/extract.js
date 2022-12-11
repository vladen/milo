import Log from './log.js';
import safe from './safe.js';
import { isObject } from './utilities.js';

const log = Log.common.module('extract');

/**
 * @param {Tacocat.Internal.CombinedDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.CombinedExtractor}
 */
const Extract = (declarer, extractors) => (element) => {
  const context = extractors.reduce(
    (extracted, extractor) => {
      const result = safe('Extractor callback error:', () => extractor(extracted, element), log);
      return isObject(result) ? Object.assign(extracted, result) : extracted;
    },
    declarer(),
  );

  log.debug('Extracted:', { context, extractors });
  return context;
};

export default Extract;
