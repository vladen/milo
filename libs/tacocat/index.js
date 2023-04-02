import { Cache, WeakCache } from './cache.js';
import Constant, { CssClass, Event, Stage } from './constant.js';
import Extract from './extract.js';
import Log from './log.js';
import Observe from './observe.js';
import Present from './present.js';
import Provide from './provide.js';
import Util, { isFunction, isNil, isObject, isString, mergeReactions } from './util.js';

export { Constant, Cache, Util, WeakCache };

function assertExtractor(extractor) {
  if (!isFunction(extractor)) {
    throw new Error('Tacocat extractor must be a function');
  }
}

function assertProvider(provider) {
  if (!isFunction(provider)) {
    throw new Error('Tacocat provider must be a function');
  }
}

/**
 * @param {Tacocat.Engine.Reactions} reactions
 */
function assertReactions(reactions) {
  if (!isObject(reactions)) {
    throw new Error('Tacocat reactions must be an object');
  }
  if (!isNil(reactions.events) && (
    isString(reactions.events)
    || (Array.isArray(reactions.events) && reactions.events.every(isString))
  )) {
    throw new Error('Tacocat reactions events must be a string or an array of strings');
  }
  if (!isNil(reactions.trigger) && !isFunction(reactions.trigger)) {
    throw new Error('Tacocat reactions trigger must be a function');
  }
}

/**
 * @template T, U
 * @param {{
 *  filter: Tacocat.Engine.Filter;
 *  presenters?: Tacocat.Internal.Presenters;
 *  provider: Tacocat.Internal.Provider;
 *  reactions: Tacocat.Engine.Reactions[];
 *  selector: string;
 *  subscribers: Tacocat.Internal.Subscriber[];
 * }} detail
 * @returns {Tacocat.Engine.Present<T, U>}
 */
function Step2(detail) {
  if (isNil(detail.presenters)) {
    detail.presenters = {
      [Stage.pending]: [],
      [Stage.rejected]: [],
      [Stage.resolved]: [],
      [Stage.mounted]: [],
    };
  }
  /**
   * @param {Function} presenter
   * @param {Tacocat.Stage} stage
   */
  function present(presenter, stage) {
    if (isFunction(presenter)) {
      return Step2({
        ...detail,
        presenters: {
          ...detail.presenters,
          [stage]: [...detail.presenters[stage], presenter],
        },
      });
    }
    throw new Error('Tacocat presenter must be a function');
  }

  return {
    observe({
      scope = document.body,
      reactions = {},
      signal = null,
    }) {
      if (!(scope instanceof HTMLElement)) {
        throw new Error('Tacocat scope must be an instance of HTMLElement');
      }
      return Observe({
        ...detail,
        reactions: mergeReactions(...detail.reactions, reactions),
        scope,
        signal,
        subscribers: [...detail.subscribers, Present(detail.presenters)],
      });
    },

    pending(presenter) {
      return present(presenter, Stage.pending);
    },
    rejected(presenter) {
      return present(presenter, Stage.rejected);
    },
    resolved(presenter) {
      return present(presenter, Stage.resolved);
    },
    mounted(presenter) {
      return present(presenter, Stage.mounted);
    },
  };
}

/**
 * @template T, U
 * @param {{
 *  filter: Tacocat.Engine.Filter;
 *  extractors?: Tacocat.Internal.Extractor[];
 *  reactions?: Tacocat.Engine.Reactions[];
 *  selector: string;
 * }} detail
 * @returns {Tacocat.Engine.Extract<T, U>}
 */
function Step1(detail) {
  if (isNil(detail.extractors)) detail.extractors = [];
  if (isNil(detail.reactions)) detail.reactions = [];
  return {
    extract(extractor, reactions = {}) {
      assertExtractor(extractor);
      assertReactions(reactions);
      return Step1({
        ...detail,
        extractors: [...detail.extractors, extractor],
        reactions: [...detail.reactions, reactions],
      });
    },
    provide(provider) {
      assertProvider(provider);
      return Step2({
        ...detail,
        reactions: detail.reactions,
        provider,
        subscribers: [Extract(detail.extractors), Provide(provider)],
      });
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
  select(selector, filter = (() => true)) {
    if (!isFunction(filter)) {
      throw new Error('Tacocat DOM element filter must be a function');
    }
    return Step1({ selector, filter });
  },
  CssClass,
  Event,
  Log,
  Stage,
});

export default Tacocat;
