import { projectObject } from './context.js';
import Event from './event.js';
import Log from './log.js';
import { safeAsyncEvery } from './safe.js';
import { isFunction, isNil, isObject } from './utilities.js';

/**
 * @param {object} common
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {Tacocat.Internal.Comparer} comparer
 * @returns {Tacocat.Internal.Subscriber}
 */
function Extract(common, extractors, comparer) {
  const log = Log.common.module('extract');
  log.debug('Created:', { common, comparer, extractors });

  return (control, depot, element) => control.dispose(
    Event.observe.listen(element, async (event) => {
      if (control.signal?.aborted) return;

      const context = projectObject({}, common);

      const success = await safeAsyncEvery(
        log,
        'Extractor callback error:',
        extractors,
        async (extractor) => {
          if (control.signal?.aborted) return false;
          let extracted;
          if (isFunction(extractor)) {
            extracted = await extractor(event, control.signal);
          } else if (isObject(extractor)) {
            extracted = extractor;
          }
          if (isObject(extracted)) {
            Object.assign(context, extracted);
            return true;
          }
          if (!isNil(extracted)) {
            log.error('Unexpected extraction:', { event, extracted, extractor });
          }
          return false;
        },
      );

      if (success && !comparer(context, depot.state.context)) {
        const state = { context };
        depot.state = state;
        log.debug('Extracted:', state);
        Event.extract.dispatch(event.target, state);
      }
    }),
  );
}

export default Extract;
