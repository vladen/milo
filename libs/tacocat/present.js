import Log from './log.js';
import { safeSync } from './safe.js';
import { getStage } from './product.js';
import { isFunction } from './utilities.js';
import Event from './event.js';

/**
 * @param {Tacocat.Internal.Presenters[]} presenters
 * @returns {Tacocat.Internal.SafePresenter}
 */
const Present = (presenters) => {
  const log = Log.common.module('render');
  log.debug('Created:', { renderers: presenters });

  const groups = {
    /** @type {Tacocat.Engine.PendingPresenter<any>[]}} */
    pending: [],
    /** @type {Tacocat.Engine.RejectedPresenter<any>[]}} */
    rejected: [],
    /** @type {Tacocat.Engine.ResolvedPresenter<any, any>[]}} */
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

  /**
   * @param {Tacocat.ResultEvent<any, any>} event
   */
  const present = (event) => {
    // Run presenters for stage defined for given event
    const stage = getStage(event.detail);
    if (!stage) return;

    const group = groups[stage];
    if (group.length) {
      group.forEach((presenter) => safeSync(
        log,
        'Renderer callback error:',
        () => presenter(event),
      ));
      log.debug('Presented:', { event, presenters: group });
      Event.present.dispatch(event.target, event.detail);
    } else {
      log.debug('Not presented:', { event });
    }
  };

  // Return function adding event listeners to the provided element
  return (element) => [
    Event.reject.listen(element, present),
    Event.resolve.listen(element, present),
  ];
};

export default Present;
