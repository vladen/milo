import Event from './event.js';
import Log from './log.js';
import { safeAsyncEvery } from './safe.js';
import { getPlaceholderState, setPlaceholderState } from './state.js';
import { isFunction, isNil, isObject } from './utilities.js';

/**
 * @param {Tacocat.Internal.SafeDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {Tacocat.Internal.Comparer} comparer
 * @returns {Tacocat.Internal.SafeExtractor}
 */
function Extract(declarer, extractors, comparer) {
  const log = Log.common.module('extract');
  log.debug('Created:', { comparer, declarer, extractors });

  return (control, element) => control.dispose(Event.observe.listen(element, async (event) => {
    const { context = {} } = event?.detail ?? {};

    const success = await declarer(control, context) && await safeAsyncEvery(
      log,
      'Extractor callback error:',
      extractors,
      async (extractor) => {
        if (control.signal?.aborted) return false;
        const newContext = await extractor(event, context.signal);
        if (isObject(newContext)) {
          Object.assign(context, newContext);
          return true;
        }
        if (!isNil(newContext)) {
          log.error('Unexpected extraction:', { event, newContext, extractor });
        }
        return false;
      },
    );

    if (success && !comparer(context, getPlaceholderState(element).context)) {
      setPlaceholderState(element, { context });
      log.debug('Extracted:', { context });
      Event.extract.dispatch(event.target, { context });
    }
  }));
}

export default Extract;
