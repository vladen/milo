import { Event } from './constants.js';
import Log from './log.js';
import { safeAsync, safeAsyncEvery } from './safe.js';
import { isFunction, isNil } from './utils.js';

/**
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.Subscriber}
 */
const Extract = (extractors) => (control, cycle) => {
  const log = Log.common.module('extract');

  cycle.listen(
    Event.observed,
    async ({ detail: { context, element } }, event) => {
      const { id } = context;

      const success = await safeAsyncEvery(
        log,
        'Extractor callback error:',
        extractors,
        async (extractor) => {
          if (control.signal?.aborted) return false;
          if (isFunction(extractor)) {
            const extraction = await safeAsync(
              log,
              'Extractor callback error:',
              () => Promise.resolve(extractor(context, element, event, control.signal)),
            );
            if (!isNil(extraction)) {
              Object.assign(context, extraction);
            }
          } else {
            log.error('Extractor must be a function, cancelling:', { extractor });
          }
          return false;
        },
      );

      if (success) {
        context.id = id;
        cycle.extract(context);
        log.debug('Extracted:', { context, element, event });
      }
    },
  );

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { extractors });
};

export default Extract;
