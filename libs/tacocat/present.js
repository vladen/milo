import Log from './log.js';
import { safeSync } from './safe.js';
import { getStage } from './result.js';
import { isFunction } from './utilities.js';
import Event from './event.js';

/**
 * @param {Tacocat.Internal.Presenters[]} presenters
 * @returns {Tacocat.Internal.SafePresenter}
 */
const Present = (presenters) => {
  const log = Log.common.module('render');

  const groups = {
    /** @type {Tacocat.Internal.PendingPresenter[]}} */
    pending: [],
    /** @type {Tacocat.Internal.RejectedPresenter[]}} */
    rejected: [],
    /** @type {Tacocat.Internal.ResolvedPresenter[]}} */
    resolved: [],
  };

  // Group renderers by their stages
  presenters.forEach(({ pending, rejected, resolved }) => {
    [pending].flat(2).forEach((renderer) => {
      if (isFunction(renderer)) groups.pending.push(renderer);
    });
    [rejected].flat(2).forEach((renderer) => {
      if (isFunction(renderer)) groups.rejected.push(renderer);
    });
    [resolved].flat(2).forEach((renderer) => {
      if (isFunction(renderer)) groups.resolved.push(renderer);
    });
  });

  log.debug('Created:', { renderers: presenters });

  // Return function adding event listeners to the provided element
  return (control, element) => {
    /**
     * @param {Tacocat.ResultEvent<any, any>} event
     */
    const present = (event) => {
    // Run presenters for stage defined for given event
      const stage = getStage(event.detail);
      if (!stage) return;

      const group = groups[stage];
      if (group.length) {
        group.forEach((presenter) => {
          if (control.signal?.aborted) return;
          safeSync(log, 'Presenter callback error:', () => presenter(event.target, event.detail));
        });
        log.debug('Presented:', { event, presenters: group });
        Event.present.dispatch(event.target, event.detail);
      } else {
        log.debug('Not presented:', { event });
      }
    };

    control.dispose(Event.reject.listen(element, present), element);
    control.dispose(Event.resolve.listen(element, present), element);
  };
};

export default Present;
