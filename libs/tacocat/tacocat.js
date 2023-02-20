import Compare from './compare.js';
import { compareContexts } from './context.js';
import Control from './control.js';
import Extract from './extract.js';
import Event from './event.js';
import Log from './log.js';
import Observe from './observe.js';
import Present from './present.js';
import Provide from './provide.js';
import { safeAsync, safeSync } from './safe.js';
import Subtree from './subtree.js';

export { Log, safeAsync, safeSync };

/**
 * @template T, U
 * @param {Tacocat.Internal.Subscriber[]} subscribers
 * @param {Tacocat.Internal.Reactions[]} reactions
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Engine.Present<T, U>}
 */
const present = (subscribers, reactions, presenters = {
  pending: [],
  rejected: [],
  resolved: [],
}) => ({
  observe(scope, selector, signal) {
    return Observe(
      Control(signal),
      reactions,
      [...subscribers, Present(presenters)],
      Subtree(scope, selector),
    );
  },
  pending(presenter) {
    return present(subscribers, reactions, {
      ...presenters,
      pending: [...presenters.pending, presenter],
    });
  },
  rejected(presenter) {
    return present(subscribers, reactions, {
      ...presenters,
      rejected: [...presenters.rejected, presenter],
    });
  },
  resolved(presenter) {
    return present(subscribers, reactions, {
      ...presenters,
      resolved: [...presenters.resolved, presenter],
    });
  },
});

/**
 * @template T, U
 * @param {object} context
 * @param {Tacocat.Internal.Comparer} comparer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {Tacocat.Internal.Reactions[]} reactions
 * @returns {Tacocat.Engine.Extract<T, U>}
 */
const extract = (context, comparer, extractors = [], reactions = []) => ({
  extract(extractor, nextReactions) {
    return extract(
      context,
      Compare(comparer),
      [...extractors, extractor],
      [...reactions, nextReactions],
    );
  },
  provide(provider) {
    const presenters = {
      pending: [],
      rejected: [],
      resolved: [],
    };
    return present(
      [Extract(context, comparer, extractors), Provide(provider)],
      reactions,
      presenters,
    );
  },
});

/**
 * @type {Tacocat.Engine.Factory}
 */
const tacocat = {
  define(context, comparer = compareContexts) {
    return extract(context, comparer);
  },
  event: Event.Type,
};

export default tacocat;
