import { WeakCache } from '../../cache.js';
import { Key, DatasetParam, ostBaseUrl } from '../constant.js';
import Log from '../../log.js';
import { parseJson } from '../../parser.js';
import { safeSync } from '../../safe.js';
import { isNil } from '../../util.js';

const log = Log.common.module('Wcs').module('parsers');

/**
 * @param {HTMLElement} element
 * @returns {Tacocat.Wcs.PlaceholderContext}
 */
export function parsePlaceholderDataset(element) {
  const Param = DatasetParam.pending;
  const {
    [Param.extra]: extra,
    [Param.osi]: osi = '',
    [Param.osis]: osis = '',
    [Param.promo]: promo,
    [Param.template]: template,
  } = element.dataset;

  const set = new Set([osi, ...(osis?.split('\n') ?? [])]);
  set.delete('');
  if (!set.size) {
    log.warn('Missing "osi" or "osis" dataset item, ignoring:', element.dataset);
    return undefined;
  }

  if (!template) {
    log.warn('Missing "template" dataset item, ignoring:', element.dataset);
    return undefined;
  }

  return {
    extra: extra ? parseJson(extra, 'Unable to parse "extra" dataset item as JSON:') : null,
    osis: [...set],
    promo,
    template,
  };
}

/**
 * @param {HTMLAnchorElement} element
 * @returns {URLSearchParams}
 */
export function getOstLinkParams(element) {
  const url = safeSync(
    log,
    'Unable to parse "href" attribute:',
    () => (
      isNil(element.href) || element.href === window.location.href
        ? null
        : new URL(element.href)
    ),
  );
  if (url && url.toString().startsWith(ostBaseUrl)) {
    return url.searchParams;
  }
  return undefined;
}

/**
 * @param {HTMLAnchorElement} element
 * @param {URLSearchParams} params
 * @returns {Tacocat.Wcs.PlaceholderContext}
 */
export function parseOstLinkContext(element, params) {
  const extra = { ...element.dataset };
  const osis = params.getAll(Key.osi).filter((osi) => osi);
  if (!osis.length) {
    log.warn('Missing "osi" param, ignoring:', params.toString());
    return undefined;
  }
  const template = params.get(Key.template) ?? '';
  if (!template) {
    log.warn('Missing "template" param, ignoring:', params.toString());
    return undefined;
  }
  return { extra, osis, template };
}
