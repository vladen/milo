import { Cache, WeakCache } from '../cache.js';
import Log from '../log.js';
import { parseHrefParams, tryParseJson } from '../parsers.js';
import { toBoolean } from '../utils.js';

const checkoutLiteralsCache = Cache();
const checkoutHrefParamsCache = WeakCache();
const checkoutSettingsCache = Cache();
const priceLiteralsCache = Cache();
const priceHrefParamsCache = WeakCache();
const priceSettingsCache = Cache();

const log = Log.common.module('Wcs').module('parsers');

/**
 * @param {string} template
 * @returns {(element: HTMLAnchorElement) => boolean}
 */
export const matchTemplateParam = (template) => (element) => !!parseHrefParams(element).get('template')?.startsWith(template);

/**
 * @param {HTMLAnchorElement} element
 * @returns {{
 *  osis: string[];
 *  template: string;
 * }}
 */
export const parseCommonHrefParams = (element) => checkoutHrefParamsCache.getOrSet(
  element,
  () => {
    const params = parseHrefParams(element);
    const osis = params.getAll('osi');
    const template = params.get('template') ?? '';
    if (!osis.length) {
      log.warn('Osi param is missing, ignoring:', params.toString());
      return undefined;
    }
    if (!template) {
      log.warn('Template param is missing, ignoring:', params.toString());
      return undefined;
    }
    return { osis, template };
  },
);

/**
 * @param {HTMLAnchorElement} element
 * @returns {Tacocat.Wcs.CheckoutPlaceholderContext}
 */
export const parseCheckoutHrefParams = (element) => checkoutHrefParamsCache.getOrSet(
  element,
  () => {
    const params = parseHrefParams(element);
    const { osis, template } = parseCommonHrefParams(element) ?? {};
    if (!osis.length) return undefined;
    const client = params.get('cli') || 'adobe';
    const countrySpecific = params.getAll('cs');
    const extra = element.dataset;
    const qantity = params.getAll('q');
    const step = params.get('step') || 'email';
    return {
      countrySpecific, client, extra, osis, qantity, step, template,
    };
  },
);

/**
 * @param {HTMLAnchorElement} element
 * @returns {Tacocat.Wcs.PricePlaceholderContext}
 */
export const parsePriceHrefParams = (element) => priceHrefParamsCache.getOrSet(
  element,
  () => {
    const params = parseHrefParams(element);
    const { osis, template } = parseCommonHrefParams(element) ?? {};
    if (!osis.length) return undefined;
    const format = toBoolean(params.get('format') ?? false);
    const recurrence = params.get('client');
    const tax = toBoolean(params.get('tax') ?? false);
    const unit = toBoolean(params.get('unit') ?? false);
    return {
      format, recurrence, osis, tax, template, unit,
    };
  },
);

/**
 * @param {Element} element
 * @returns {Tacocat.Wcs.CheckoutLiterals}
*/
export const tryParseCheckoutLiterals = (element) => checkoutLiteralsCache.getOrSet(
  element,
  () => {
    const { ctaLabel = '' } = element
      ? tryParseJson(element.textContent) ?? {}
      : {};
    return { literals: { ctaLabel } };
  },
);

/**
 * @param {Element} element
 * @returns {Tacocat.Wcs.CheckoutSettings}
 */
export const tryParseCheckoutSettings = (element) => checkoutSettingsCache.getOrSet(
  element,
  () => {
    const json = tryParseJson(element.textContent);
    const client = json.client ?? 'adobe';
    const step = json.step ?? 'email';
    return { client, step };
  },
);

/**
 * @param {Element} element
 * @returns {Tacocat.Wcs.PriceLiterals}
 */
export const tryParsePriceLiterals = (element) => priceLiteralsCache.getOrSet(
  element,
  () => {
    const { perUnitLabel = '', recurrenceLabel = '' } = element
      ? tryParseJson(element.textContent) ?? {}
      : {};
    return { literals: { perUnitLabel, recurrenceLabel } };
  },
);

/**
 * @param {Element} element
 * @returns {Tacocat.Wcs.PricePlaceholderContext}
 */
export const tryParsePriceSettings = (element) => priceSettingsCache.getOrSet(
  element,
  () => {
    const json = tryParseJson(element.textContent);
    const format = toBoolean(json.format);
    const recurrence = toBoolean(json.recurrence);
    const tax = toBoolean(json.tax);
    const unit = toBoolean(json.unit);
    return { format, recurrence, tax, unit };
  },
);
