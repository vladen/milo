import Event from './event.js';
import Log from './log.js';
import { safeAsyncPipe } from './safe.js';
import { isFunction, isNil, isObject } from './utilities.js';

/**
 * @param {Tacocat.Internal.SafeDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.SafeExtractor}
 */
function Extract(declarer, extractors) {
  const log = Log.common.module('extract');
  log.debug('Created:', { declarer, extractors });

  return (control, element) => Event.observe.listen(element, (event) => {
    const { context = {} } = event.detail ?? {};

    declarer(control, context)
      .then((result) => {
        if (!result) return false;
        return safeAsyncPipe(log, 'Extractor callback error:', extractors, (extractor) => {
          let extraction;
          if (isFunction(result)) {
            extraction = extractor(event);
            if (isObject(result)) {
              Object.assign(context, result);
              return true;
            }
          }
          if (!isNil(result)) {
            log.error('Unexpected extraction:', { extraction, extractor });
          }
          return false;
        });
      })
      .then((result) => {
        if (!result) return false;
        log.debug('Extracted:', { context, extractors });
        Event.extract.dispatch(event.target, { context });
        return true;
      });
  });
}

export default Extract;
