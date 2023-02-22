import Channel from './channel.js';
import { getContextKey } from './context.js';
import Log from './log.js';
import { safeAsyncEvery } from './safe.js';
import { isFunction, isNil, isObject } from './utilities.js';

/**
 * @param {object} base
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.Subscriber}
 */
const Extract = (base, extractors) => (control, element, storage) => {
  const log = Log.common.module('extract');
  log.debug('Activating:', { base, element, extractors });

  control.dispose(Channel.observe.listen(element, async (event) => {
    const context = { ...base };

    const success = await safeAsyncEvery(
      log,
      'Extractor callback error:',
      extractors,
      async (extractor) => {
        if (control.signal?.aborted) return false;
        let extracted;
        if (isFunction(extractor)) {
          extracted = await extractor(context, element, event, control.signal);
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

    if (success && getContextKey(context) !== getContextKey(storage.getState(element)?.context)) {
      const state = { context };
      storage.setState(element, state);
      log.debug('Extracted:', state);
      Channel.extract.dispatch(element, state);
    }
  }));

  control.dispose(() => log.debug('Disposed'));
  log.debug('Activated');
};

export default Extract;
