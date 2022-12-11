import Log from "./log";
import safe from "./safe";

const log = Log.common.module('extract');

/**
 * @param {Tacocat.Internal.CombinedDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.CombinedExtractor}
 */
const Extract = (declarer, extractors) => (element) => {
  const context = extractors.reduce(
    (context, extractor) => safe('Callback error:', () => extractor(context, element), log),
    declarer(),
  );
  log.debug('Extracted:', { context });
  return context;
};

export default Extract;
