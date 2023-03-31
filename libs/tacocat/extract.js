import { EventType } from './constants.js';
import Log from './log.js';
import { safeAsyncEvery } from './safe.js';
import { isFunction, isNil, isObject } from './utilities.js';

/**
 * @param {object} base
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.Subscriber}
 */
const Extract = (base, extractors) => (control, cycle) => {
  const log = Log.common.module('extract');

  cycle.listen(
    EventType.observed,
    async ({ detail }, event) => {
      const context = { ...base, ...detail.context };
      const { id } = detail.context;

      const success = await safeAsyncEvery(
        log,
        'Extractor callback error:',
        extractors,
        async (extractor) => {
          if (control.signal?.aborted) return false;
          let extraction;
          if (isFunction(extractor)) {
            extraction = await extractor(context, detail.element, event, control.signal);
          } else if (isObject(extractor)) {
            extraction = extractor;
          }
          if (isObject(extraction)) {
            Object.assign(context, extraction);
            return true;
          }
          if (!isNil(extraction)) {
            log.error('Unexpected extraction, cancelling:', { extraction, event, extractor });
          }
          return false;
        },
      );

      if (success) {
        context.id = id;
        cycle.extract(context);
        log.debug('Extracted:', { context, element: detail.element, event });
      }
    },
  );

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { base, extractors });
};

export default Extract;
