import { Event } from './constant.js';
import Log from './log.js';
import { safeAsyncEvery } from './safe.js';
import { isNil, isObject } from './util.js';

/**
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.Subscriber}
 */
const Extract = (extractors) => (control, cycle) => {
  const log = Log.common.module('extract', control.alias);

  cycle.listen(
    cycle.scope,
    Event.observed,
    async ({ detail: { context, element } }, event) => {
      const { id: prevId, ...prevRest } = context;
      const detail = { context, element };
      if (!isNil(event)) detail.event = event;

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
          log.debug('Extractor function returned not object, ignoring placeholder:', detail);
          return false;
        },
      );

      if (success) {
        const { id: nextId, ...nextRest } = context;
        if (JSON.stringify(nextRest) !== JSON.stringify(prevRest)) {
          context.id = prevId;
          log.debug('Extracted:', detail);
          cycle.extract(context);
        }
      }
    },
  );

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { extractors });
};

export default Extract;
