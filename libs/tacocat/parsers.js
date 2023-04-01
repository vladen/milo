import { WeakCache } from './cache.js';
import Log from './log.js';
import { safeSync } from './safe.js';

const hrefParamsCache = WeakCache();

const log = Log.common.module('parsers');

/**
 * @param {HTMLAnchorElement} element
 * @returns {URLSearchParams}
 */
export const parseHrefParams = (element) => hrefParamsCache.getOrSet(
  element,
  () => safeSync(log, 'Unable to parse href params:', () => new URL(element.href).searchParams),
);

/** @type {Tacocat.tryParseJson} */
// eslint-disable-next-line import/prefer-default-export
export const tryParseJson = (json, message = 'Unable to parse JSON data:') => {
  if (json != null) {
    try {
      return JSON.parse(json);
    } catch (error) {
      log.error(message, error);
    }
  }
  return undefined;
};
