import { CssClass, Event, Stage, namespace } from './constants.js';
import { setContext } from './context.js';
import Control from './control.js';
import Extract from './extract.js';
import Log from './log.js';
import Observe from './observe.js';
import { parseHrefParams, tryParseJson } from './parsers.js';
import Present from './present.js';
import Provide from './provide.js';
import {
  isBoolean, isElement, isError, isFunction, isNil, isObject,
  isPromise, isString, mergeReactions, toArray, toBoolean,
} from './utilities.js';

export const Util = {
  isBoolean,
  isElement,
  isError,
  isFunction,
  isNil,
  isObject,
  isPromise,
  isString,
  parseHrefParams,
  setContext,
  toArray,
  toBoolean,
  tryParseJson,
};

/**
 * @template T, U
 * @param {string} selector
 * @param {Tacocat.Engine.Filter} filter
 * @param {Tacocat.Internal.Subscriber[]} subscribers
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @param {Tacocat.Internal.Presenters} presenters
 * @returns {Tacocat.Engine.Present<T, U>}
 */
const Step2 = (selector, filter, subscribers, reactions, presenters = {
  pending: [],
  rejected: [],
  resolved: [],
}) => ({
  observe(scope = document.body, signal = null) {
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
      filter,
    );
  },

  present(stage, condition, presenter) {
    if (isFunction(presenter)) {
      return Step2(selector, filter, subscribers, reactions, {
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
      return Step2(selector, filter, subscribers, reactions, {
        ...presenters,
        [stage]: [...(presenters[stage] ?? []), condition],
      });
    }
    throw new Error('Presenter must be a function');
  },
});

/**
 * @template T, U
 * @param {string} selector
 * @param {Tacocat.Engine.Filter} filter
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {Tacocat.Engine.Reactions[]} reactions
 * @returns {Tacocat.Engine.Extract<T, U>}
 */
const Step1 = (selector, filter, extractors = [], reactions = []) => ({
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
      pending: [],
      rejected: [],
      resolved: [],
    };
    return Step2(
      selector,
      filter,
      [Extract(extractors), Provide(provider)],
      reactions,
      presenters,
    );
  },
});

/** @type {Tacocat.Engine.Factory} */
const Tacocat = Object.freeze({
  /**
   * @param {string} selector
   * @param {Tacocat.Engine.Filter} filter
   * @returns {Tacocat.Engine.Extract<any>}
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
