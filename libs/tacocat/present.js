import { Stage } from './constants.js';
import Event from './event.js';
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
   * @param {Tacocat.Stage} stage
   * @return {(event: Tacocat.ContextEvent<any>) => void}
   */
  const present = (stage) => (event) => {
    const group = presenters[stage];
    if (group.length) {
      group.forEach((presenter) => {
        safeSync(log, 'Presenter callback error:', () => presenter(element, event.detail));
      });
      log.debug('Presented:', { element, event, presenters: group });
      Event.present.dispatch(element, event.detail, event);
    } else {
      log.debug('Not presented:', { element, event });
    }
  };

  control.dispose(Event.extract.listen(element, present(Stage.pending)), element);
  control.dispose(Event.reject.listen(element, present(Stage.rejected)), element);
  control.dispose(Event.resolve.listen(element, present(Stage.resolved)), element);
  control.dispose(() => log.debug('Disposed'));
  log.debug('Activated');
};

export default Present;
