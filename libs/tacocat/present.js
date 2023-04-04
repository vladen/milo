import { CssClass, Event, Stage } from './constant.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isHTMLElement, isNil } from './util.js';

const StageCssClass = [CssClass.pending, CssClass.rejected, CssClass.resolved, CssClass.mounted];

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
  const log = Log.common.module('present', control.alias);

  cycle.listen(
    control.scope,
    [Event.observed, Event.extracted, Event.provided],
    ({ detail, type }) => {
      const { context, element, event, result, stage } = detail;
      if (type === Event.observed && stage !== Stage.mounted) return;
      /** @type {Tacocat.Internal.Presenter[]} */
      const group = presenters[stage];

      const fact = { context, element, stage };
      if (!isNil(event)) fact.event = event;
      if (!isNil(result)) fact.result = result;

      if (!group?.length) {
        log.debug('No presenters, ignoring:', fact);
        return;
      }

      const last = group.reduce(
        (current, presenter) => safeSync(
          log,
          'Presenter callback error:',
          () => {
            const next = presenter({
              ...detail,
              element: current,
              // @ts-ignore
              result: result ?? { context },
            });
            return isHTMLElement(next) ? next : current;
          },
        ),
        element,
      ) ?? element;

      setStageCssClasses(last, stage);

      fact.element = last;
      log.debug('Presented:', fact);
      cycle.present(context, last);
    },
  );

  control.capture(() => log.debug('Aborted'));
  log.debug('Activated:', { presenters });
};

export default Present;
