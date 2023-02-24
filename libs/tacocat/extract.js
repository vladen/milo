import Channel from './channel.js';
import { Stage } from './constants.js';
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

  control.dispose(
    Channel.observe.listen(element, async (state, stage, event) => {
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
            log.error('Unexpected extraction:', { extracted, event, extractor });
          }
          return false;
        },
      );

      if (
        success
        && getContextKey(context) !== getContextKey(storage.getState(element)?.context)
      ) {
        const nextState = { context };
        storage.setState(element, nextState);
        log.debug('Extracted:', { state: nextState, element, event });
        Channel.extract.dispatch(element, nextState, Stage.pending, event);
      }
    }),
  );

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { base, element, extractors });
};

export default Extract;
