import { Key, DatasetParam, ostBaseUrl } from '../constant/index.js';
import Log from '../../log.js';
import { safeSync } from '../../safe.js';
import { isNil, isObject, isString } from '../../util.js';

const log = Log.common.module('wcs').module('extractor');

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<T & object, Tacocat.Wcs.PricePlaceholderContext>}
 * @returns {Tacocat.Wcs.PlaceholderContext}
 */
export function extractDataset({ element }) {
  const Param = DatasetParam.pending;
  const {
    [Param.osi]: osi = '',
    [Param.osis]: osis = '',
    [Param.promo]: promo,
    [Param.template]: template,
  } = element.dataset;
  return {
    osis: [...new Set(
      [
        osi,
        ...(osis?.split('\n') ?? []),
      ].filter((candidate) => candidate),
    )],
    promo,
    template,
  };
}

/**
 * @param {HTMLElement} element
 * @returns {URLSearchParams}
 */
export function getOstLinkParams(element) {
  if (!isObject(element) || !(element instanceof HTMLAnchorElement)) return undefined;
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
 * @param {URLSearchParams} params
 * @returns {Tacocat.Wcs.PlaceholderContext}
 */
export function extractOstLinkParams(params) {
  const osis = params.getAll(Key.osi).filter((osi) => osi);
  const promo = params.get(Key.promo) || undefined;
  const template = params.get(Key.template) ?? '';
  return { osis, promo, template };
}

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<
 *  T & Tacocat.Wcs.PlaceholderContext & Tacocat.Wcs.LiteralsContext,
 *  T & Tacocat.Wcs.PlaceholderContext & Tacocat.Wcs.LiteralsContext
 * >}
 */
export function validateContext(detail) {
  const { context, context: { osis, literals, template } } = detail;
  if (!isObject(literals) || !Object.values(literals).every(isString)) {
    log.warn('Missing "literals" context, ignoring:', detail);
    return undefined;
  }
  if (!osis.length) {
    log.warn('Missing "osi" context, ignoring:', detail);
    return undefined;
  }
  if (!isString(template) || !template.length) {
    log.warn('Missing "template" param, ignoring:', detail);
    return undefined;
  }
  return Promise.resolve(context);
}
