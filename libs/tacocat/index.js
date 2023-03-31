import { EventType, StageName } from './constants.js';
import { assignContext } from './context.js';
import Control from './control.js';
import Extract from './extract.js';
import Log from './log.js';
import Observe from './observe.js';
import Present from './present.js';
import Provide from './provide.js';
import { isFunction, mergeReactions } from './utilities.js';

/**
 * @template T, U
 * @param {Tacocat.Internal.Subscriber[]} subscribers
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Engine.Present<T, U>}
 */
const Step2 = (subscribers, reactions, presenters = {
  pending: [],
  rejected: [],
  resolved: [],
}) => ({
  observe(scope = document.body, selector = '*', signal = null) {
    if (!(scope instanceof Element)) {
      throw new Error('Scope must be a DOM Element');
    }
    const merged = mergeReactions(reactions);
    return Observe(
      Control(signal),
      merged,
      [...subscribers, Present(presenters)],
      scope,
      selector,
    );
  },

  present(stage, condition, presenter) {
    if (isFunction(presenter)) {
      return Step2(subscribers, reactions, {
        ...presenters,
        [stage]: [
          ...(presenters[stage] ?? []),
          isFunction(condition)
            ? (result) => {
              if (condition(result)) presenter(result);
            }
            : (result) => {
              if (condition) presenter(result);
            },
        ],
      });
    }
    if (isFunction(condition)) {
      return Step2(subscribers, reactions, {
        ...presenters,
        [stage]: [...(presenters[stage] ?? []), condition],
      });
    }
    throw new Error('Presenter must be a function');
  },
});

/**
 * @template T, U
 * @param {object} context
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @returns {Tacocat.Engine.Extract<T, U>}
 */
const Step1 = (context, extractors = [], reactions = []) => ({
  extract(extractor, nextReactions) {
    if (!isFunction(extractor)) {
      throw new Error('Extractor must be a function');
    }
    return Step1(
      context,
      [...extractors, extractor],
      [...reactions, nextReactions],
    );
  },
  provide(provider) {
    if (!isFunction(provider)) {
      throw new Error('Provider must be a function');
    }
    const presenters = {
      pending: [],
      rejected: [],
      resolved: [],
    };
    return Step2(
      [Extract(context, extractors), Provide(provider)],
      reactions,
      presenters,
    );
  },
});

/** @type {Tacocat.Engine.Factory} */
const Tacocat = {
  assign: assignContext,
  define(context) {
    return Step1(context);
  },
  Log,
  Event: EventType,
  Stage: StageName,
};

export default Tacocat;
