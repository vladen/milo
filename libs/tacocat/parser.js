import Log from './log.js';
import { safeSync } from './safe.js';
import { isNil } from './util';

const log = Log.common.module('parser');

/**
 * @param {HTMLAnchorElement} element
 * @returns {URLSearchParams}
 */
export const parseHrefParams = (element) => safeSync(
  log,
  'Unable to parse href params:',
  () => (
    isNil(element.href) || element.href === '#'
      ? new URLSearchParams()
      : new URL(element.href).searchParams
  ),
);

/** @type {Tacocat.tryParseJson} */
// eslint-disable-next-line import/prefer-default-export
export const parseJson = (json, message = 'Unable to parse JSON data:') => {
  if (json != null) {
    try {
      return JSON.parse(json);
    } catch (error) {
      log.error(message, error);
    }
  }
  return undefined;
};

export default {
  hrefParams: parseHrefParams,
  json: parseJson,
};
