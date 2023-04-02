import { WeakCache } from '../../cache.js';
import { Key, DatasetParam } from '../constants.js';
import Log from '../../log.js';
import { parseHrefParams, tryParseJson } from '../../parsers.js';

const log = Log.common.module('Wcs').module('parsers');

const hrefParamsCache = WeakCache();

/**
 * @param {HTMLElement} element
 * @returns {Tacocat.Wcs.PlaceholderContext}
 */
export function parsePlaceholderDataset(element) {
  const {
    [DatasetParam.pending.extra]: extra,
    [DatasetParam.pending.template]: template,
  } = element.dataset;
  if (!template) {
    log.warn('Missing "template" dataset item, ignoring:', element.dataset);
    return undefined;
  }
  return {
    extra: tryParseJson(extra, 'Unable to parse "extra" dataset item as JSON:'),
    template,
  };
}

/**
 * @param {HTMLAnchorElement} element
 * @returns {Tacocat.Wcs.PlaceholderContext}
 */
export const parsePlaceholderHref = (element) => hrefParamsCache.getOrSet(
  element,
  () => {
    const params = parseHrefParams(element);
    const extra = element.dataset;
    const template = params.get(Key.template) ?? '';
    if (!template) {
      log.warn('Missing "template" param, ignoring:', params.toString());
      return undefined;
    }
    return { extra, template };
  },
);
