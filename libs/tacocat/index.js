import { Cache, WeakCache } from './cache.js';
import { CssClass, Event, Stage, namespace } from './constants.js';
import Control from './control.js';
import Extract from './extract.js';
import Log from './log.js';
import Observe from './observe.js';
import Present from './present.js';
import Provide from './provide.js';
import Utils, { isFunction, mergeReactions } from './utils.js';

export { Cache, Utils, WeakCache };

/**
 * @template T, U
 * @param {string} selector
 * @param {Tacocat.Engine.Filter} filter
 * @param {Tacocat.Internal.Subscriber[]} subscribers
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Engine.Present<T, U>}
 */
function Step2(selector, filter, subscribers, reactions, presenters = {
  pending: [],
  rejected: [],
  resolved: [],
}) {
  /**
   * @param {Tacocat.Stage} stage
   */
  function present(stage, presenter) {
    if (isFunction(presenter)) {
      return Step2(selector, filter, subscribers, reactions, {
        ...presenters,
        [stage]: [...presenters[stage], presenter],
      });
    }
    throw new Error('Presenter must be a function');
  }

  return {
    observe(scope = document.body, overrides = null, signal = null) {
      if (!(scope instanceof Element)) {
        throw new Error('Scope must be a DOM Element');
      }
      const merged = mergeReactions(...reactions, overrides);
      return Observe(
        Control(signal),
        merged,
        [...subscribers, Present(presenters)],
        scope,
        selector,
        filter,
      );
    },

    pending(presenter) {
      return present(Stage.pending, presenter);
    },
    rejected(presenter) {
      return present(Stage.rejected, presenter);
    },
    resolved(presenter) {
      return present(Stage.resolved, presenter);
    },
    stale(presenter) {
      return present(Stage.stale, presenter);
    },
  };
}

/**
 * @template T, U
 * @param {string} selector
 * @param {Tacocat.Engine.Filter} filter
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @returns {Tacocat.Engine.Extract<T, U>}
 */
function Step1(selector, filter, extractors = [], reactions = []) {
  return {
    extract(extractor, nextReactions) {
      if (!isFunction(extractor)) {
        throw new Error('Extractor must be a function');
      }
      return Step1(
        selector,
        filter,
        [...extractors, extractor],
        [...reactions, nextReactions],
      );
    },
    provide(provider) {
      if (!isFunction(provider)) {
        throw new Error('Provider must be a function');
      }
      const presenters = {
        [Stage.stale]: [],
        [Stage.pending]: [],
        [Stage.rejected]: [],
        [Stage.resolved]: [],
      };
      return Step2(
        selector,
        filter,
        [Extract(extractors), Provide(provider)],
        reactions,
        presenters,
      );
    },
  };
}

/** @type {Tacocat.Engine.Factory} */
const Tacocat = Object.freeze({
  /**
   * @param {string} selector
   * @param {Tacocat.Engine.Filter} filter
   * @returns {Tacocat.Engine.Select}
   */
  select(selector, filter) {
    return Step1(selector, filter ?? (() => true));
  },
  CssClass,
  Event,
  Log,
  namespace,
  Stage,
});

export default Tacocat;
