import { Cache, WeakCache } from '../cache.js';
import Log from '../log.js';
import { parseHrefParams, tryParseJson } from '../parsers.js';
import { toBoolean } from '../utilities.js';

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
*  ost: string;
*  template: string;
* }}
*/
export const parseCommonHrefParams = (element) => checkoutHrefParamsCache.getOrSet(
  element,
  () => {
    const params = parseHrefParams(element);
    const ost = params.get('ost');
    const template = params.get('template') ?? '';
    if (!ost) {
      log.warn('Ost param is missing, igniring:', params.toString());
      return {};
    }
    return { ost, template };
  },
);

/**
 * @param {HTMLAnchorElement} element
 * @returns {{
 *  client: string;
 *  ost: string;
 *  template: string;
 *  workflow: string;
 *  workflowStep: string;
 * }}
 */
export const parseCheckoutHrefParams = (element) => checkoutHrefParamsCache.getOrSet(
  element,
  () => {
    const params = parseHrefParams(element);
    const { ost, template } = parseCommonHrefParams(element);
    if (!ost) return undefined;
    const client = params.get('client') ?? 'adobe';
    const workflow = params.get('workflow') ?? 'ucv3';
    const workflowStep = workflow === 'ucv3'
      ? params.get('workflowStep') ?? 'email'
      : undefined;
    return { client, ost, template, workflow, workflowStep };
  },
);

/**
 * @param {HTMLAnchorElement} element
 * @returns {{
 *  format: boolean;
 *  ost: string;
 *  tax: boolean;
 *  template: string;
 *  unit: boolean;
 * }}
 */
export const parsePriceHrefParams = (element) => priceHrefParamsCache.getOrSet(
  element,
  () => {
    const params = parseHrefParams(element);
    const { ost, template } = parseCommonHrefParams(element);
    if (!ost) return undefined;
    const format = toBoolean(params.get('format') ?? false);
    const recurrence = params.get('client');
    const tax = toBoolean(params.get('tax') ?? false);
    return { format, ost, recurrence, tax, template };
  },
);

/**
 * @param {Element} element
 * @returns {{
*  ctaLabel: string;
* }}
*/
export const tryParseCheckoutLiterals = (element) => checkoutLiteralsCache.getOrSet(
  element,
  () => {
    const { ctaLabel } = tryParseJson(
      document.textContent,
    ) ?? {};
    return { ctaLabel };
  },
);

/**
 * @param {Element} element
 * @returns {{
 *  client: string;
 *  workflow: string;
 *  workflowStep: string;
 * }}
 */
export const tryParseCheckoutSettings = (element) => checkoutSettingsCache.getOrSet(
  element,
  () => {
    const json = tryParseJson(element.textContent);
    const client = json.client ?? 'adobe';
    const workflow = json.workflow ?? 'ucv3';
    const workflowStep = workflow === 'ucv3'
      ? json.workflowStep ?? 'email'
      : undefined;
    return { client, workflow, workflowStep };
  },
);

/**
 * @param {Element} element
 * @returns {{
 *  perUnitLabel: string;
 *  recurrenceLabel: string;
 * }}
 */
export const tryParsePriceLiterals = (element) => priceLiteralsCache.getOrSet(
  element,
  () => {
    const { perUnitLabel, recurrenceLabel } = tryParseJson(
      document.textContent,
    ) ?? {};
    return { perUnitLabel, recurrenceLabel };
  },
);

/**
 * @param {Element} element
 * @returns {{
 *  format: boolean;
 *  tax: boolean;
 *  unit: boolean;
 * }}
 */
export const tryParsePriceSettings = (element) => priceSettingsCache.getOrSet(
  element,
  () => {
    const json = tryParseJson(element.textContent);
    const format = toBoolean(json.format);
    const tax = toBoolean(json.tax);
    const unit = toBoolean(json.unit);
    return { format, tax, unit };
  },
);
