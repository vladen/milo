import Channel from './channel.js';
import Log from './log.js';
import { safeSync } from './safe.js';

/**
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Internal.Subscriber}
 */
const Present = (presenters) => (control, element) => {
  const log = Log.common.module('provide');

  control.dispose(
    Channel.provide.listen(element, (event) => {
      const group = presenters[event.detail.stage];
      if (group?.length) {
        group.forEach((presenter) => {
          safeSync(log, 'Presenter callback error:', () => presenter(
            element,
            // @ts-ignore
            event.detail,
            event,
          ));
        });
        log.debug('Presented:', { element, event, presenters: group });
        Channel.present.dispatch(element, event.detail, event);
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
