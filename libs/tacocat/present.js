import { CssClass, Event } from './constants.js';
import Log from './log.js';
import { safeSync } from './safe.js';
import { isHTMLElement } from './utils.js';

const CssClasses = Object.values(CssClass);

/**
 * @param {Element} element
 * @param {Tacocat.Stage} stage
 */
function setStageCssClasses(element, stage) {
  CssClasses.forEach((name) => {
    element.classList.remove(name);
  });
  element.classList.add(CssClass[stage]);
}

/**
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Internal.Subscriber}
 */
const Present = (presenters) => (control, cycle) => {
  const log = Log.common.module('present');

  cycle.listen(
    [Event.observed, Event.extracted, Event.provided],
    ({ detail: { context, element, result, stage } }, event) => {
      /** @type {Tacocat.Internal.Presenter[]} */
      const group = presenters[stage];
      let last = element;
      if (group?.length) {
        last = group.reduce(
          (current, presenter) => safeSync(log, 'Presenter callback error:', () => {
            const next = presenter(
              current,
              // @ts-ignore
              result ?? { context },
              event,
              control.signal,
            );
            return isHTMLElement(next) ? next : current;
          }),
          element,
        ) ?? element;
        setStageCssClasses(last, stage);
        cycle.present(context, last);
        log.debug('Presented:', { context, element, event, result, stage });
      } else {
        setStageCssClasses(last, stage);
        log.debug('No presenters, ignoring:', { context, element, event, result, stage });
      }
    },
  );

  control.dispose(() => log.debug('Aborted'));
  log.debug('Activated:', { presenters });
};

export default Present;
