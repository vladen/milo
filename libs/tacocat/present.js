import { EventType } from './constants.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isElement } from './utilities.js';

/**
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Internal.Subscriber}
 */
const Present = (presenters) => (control, cycle) => {
  const log = Log.common.module('present');

  cycle.listen(
    EventType.provided,
    ({ detail: { context, element, result, stage } }, event) => {
      /** @type {Tacocat.Internal.Presenter[]} */
      const group = presenters[stage];
      if (group?.length) {
        cycle.present(
          context,
          group.reduce(
            (current, presenter) => safeSync(log, 'Presenter callback error:', () => {
              const newElement = presenter(
                current,
                // @ts-ignore
                result ?? { context },
                event,
                control.signal,
              );
              return isElement(newElement) ? newElement : current;
            }),
            element,
          ) ?? element,
        );
        log.debug('Presented:', { context, element, event, result, stage });
      } else {
        log.debug('No presenters, ignoring:', { context, element, event, result, stage });
      }
    },
  );

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { presenters });
};

export default Present;
