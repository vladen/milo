import { CssClass, Event, Stage } from './constant.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isHTMLElement, isNil } from './util.js';

const StageCssClass = [CssClass.pending, CssClass.rejected, CssClass.resolved, CssClass.stale];

/**
 * @param {Element} element
 * @param {Tacocat.Stage} stage
 */
function setStageCssClasses(element, stage) {
  StageCssClass.forEach((name) => {
    element.classList.remove(name);
  });
  element.classList.add(CssClass[stage]);
  element.classList.toggle(CssClass.disabled, stage !== Stage.resolved);
}

/**
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Internal.Subscriber}
 */
const Present = (presenters) => (control, cycle) => {
  const log = Log.common.module('present');

  cycle.listen(
    cycle.scope,
    [Event.observed, Event.extracted, Event.provided],
    ({ detail: { context, element, result, stage } }, event) => {
      /** @type {Tacocat.Internal.Presenter[]} */
      const group = presenters[stage];
      setStageCssClasses(element, stage);

      if (!group?.length) {
        log.debug('No presenters, ignoring result:', { context, element, event, result, stage });
        return;
      }

      const last = group.reduce(
        (current, presenter) => safeSync(
          log,
          'Presenter callback error:',
          () => {
            const next = presenter(
              current,
              // @ts-ignore
              result ?? { context },
              event,
              control,
            );
            return isHTMLElement(next) ? next : current;
          },
        ),
        element,
      ) ?? element;

      if (!last.isConnected) element.replaceWith(last);

      cycle.present(context, last);
      const detail = { context, element: last, stage };
      if (!isNil(event)) detail.event = event;
      if (!isNil(result)) detail.result = result;
      log.debug('Presented:', detail);
    },
  );

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { presenters });
};

export default Present;
