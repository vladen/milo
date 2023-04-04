import { Event } from './constant.js';
import Log from './log.js';
import { safeAsync } from './safe.js';
import { isError, isNil, isObject } from './util.js';

/**
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @returns {Tacocat.Internal.Subscriber}
 */
const Extract = (extractors) => (control, cycle) => {
  const log = Log.common.module('extract', control.alias);

  cycle.listen(
    cycle.control.scope,
    Event.observed,
    async ({ detail }) => {
      const { context, element, event } = detail;
      const fact = { context, element };
      if (!isNil(event)) fact.event = event;
      const { id: prevId, ...prevRest } = context;

      for (let i = 0; i < extractors.length; i += 1) {
        if (control.signal?.aborted) return;

        const extractor = extractors[i];
        // eslint-disable-next-line no-await-in-loop
        const result = await safeAsync(
          log,
          'Extractor callback error:',
          () => extractor(detail),
          (error) => error,
        );

        if (isNil(result)) {
          fact.extractor = extractor;
          log.debug('Extractor callback has resolved to nothing, skipping:', fact);
          return;
        }

        if (isError(result)) {
          fact.result = result;
          fact.extractor = extractor;
          log.error('Extractor callback has rejected with error, skipping:', fact);
        }

        if (isObject(result)) {
          Object.entries(result).forEach(([key, value]) => {
            if (!isNil(value)) context[key] = value;
          });
        } else {
          fact.result = result;
          fact.extractor = extractor;
          log.warn('Extractor callback has resolved to unexpected type, skipping:', fact);
          return;
        }
      }

      const { id: nextId, ...nextRest } = context;
      if (JSON.stringify(nextRest) !== JSON.stringify(prevRest)) {
        context.id = prevId;
        log.debug('Extracted:', fact);
        cycle.extract(context);
      }
    },
  );

  control.capture(() => log.debug('Aborted'));
  log.debug('Activated:', { extractors });
};

export default Extract;
