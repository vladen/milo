import { Event } from './constants.js';
import Log from './log.js';
import { safeAsyncEvery } from './safe.js';
import { isObject } from './utils.js';

/**
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.Subscriber}
 */
const Extract = (extractors) => (control, cycle) => {
  const log = Log.common.module('extract');

  cycle.listen(
    Event.observed,
    async ({ detail: { context, element } }, event) => {
      const { id: prevId, ...prevRest } = context;

      const success = await safeAsyncEvery(
        log,
        'Extractor function error:',
        extractors,
        async (extractor) => {
          if (control.signal?.aborted) return false;
          const result = await extractor(context, element, event, control);
          if (isObject(result)) {
            Object.assign(context, result);
            return true;
          }
          log.debug('Extractor function returned not object, ignoring placeholder:', { context, element, event });
          return false;
        },
      );

      if (success) {
        const { id: nextId, ...nextRest } = context;
        if (JSON.stringify(nextRest) !== JSON.stringify(prevRest)) {
          context.id = prevId;
          cycle.extract(context);
          log.debug('Extracted:', { context, element, event });
        }
      }
    },
  );

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { extractors });
};

export default Extract;
