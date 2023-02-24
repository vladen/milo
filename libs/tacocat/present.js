import Channel from './channel.js';
import Log from './log.js';
import { safeSync } from './safe.js';

/**
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Internal.Subscriber}
 */
const Present = (presenters) => (control, element) => {
  const log = Log.common.module('present');

  control.dispose(
    Channel.provide.listen(element, (state, stage, event) => {
      const group = presenters[stage];
      if (group?.length) {
        group.forEach((presenter) => {
          safeSync(log, 'Presenter callback error:', () => presenter(
            element,
            // @ts-ignore
            state,
            event,
            control.signal,
          ));
        });
        log.debug('Presented:', { element, event, presenters: group });
        Channel.present.dispatch(element, state, stage, event);
      } else {
        log.debug('Not presented:', { element, event });
      }
    }),
    element,
  );
  control.dispose(() => log.debug('Disposed'));
  log.debug('Activated:', { element, presenters });
};

export default Present;
