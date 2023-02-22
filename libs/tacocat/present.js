import Channel from './channel.js';
import Log from './log.js';
import { safeSync } from './safe.js';

/**
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Internal.Subscriber}
 */
const Present = (presenters) => (control, element) => {
  const log = Log.common.module('provide');
  log.debug('Activating:', { element, presenters });

  /**
   * @param {Tacocat.Internal.ContextfulEvent} event
   */
  const present = (event) => {
    const group = presenters[event.detail.stage];
    if (group?.length) {
      group.forEach((presenter) => {
        safeSync(log, 'Presenter callback error:', () => presenter(element, event.detail, event));
      });
      log.debug('Presented:', { element, event, presenters: group });
      Channel.present.dispatch(element, event.detail, event);
    } else {
      log.debug('Not presented:', { element, event });
    }
  };

  control.dispose(Channel.provide.listen(element, present), element);
  control.dispose(() => log.debug('Disposed'));
  log.debug('Activated');
};

export default Present;
