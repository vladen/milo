import { WeakCache } from '../../cache.js';
import { Key, PriceDatasetParam, namespace } from '../constant.js';
import Log from '../../log.js';
import { getOstLinkParams, parsePlaceholderDataset, parseOstLinkContext } from './common.js';
import { parseJson } from '../../parser.js';
import { isNil, querySelectorUp, toBoolean } from '../../util.js';

const literalsCache = WeakCache();
const settingsCache = WeakCache();

const log = Log.common.module('Wcs').module('parsers').module('price');

const PriceCssSelector = {
  literals: `.${namespace}-${Key.price}-${Key.literals}`,
  settings: `.${namespace}-${Key.price}-${Key.settings}`,
};

/**
 * @param {HTMLElement} element
 * @returns {Omit<Tacocat.Wcs.PricePlaceholderContext, keyof Tacocat.Wcs.LocaleContext>}
 */
export function parsePriceDataset(element) {
  const base = parsePlaceholderDataset(element);
  if (isNil(base)) return undefined;

  const Param = PriceDatasetParam.pending;
  const {
    [Param.format]: format,
    [Param.recurrence]: recurrence,
    [Param.tax]: tax,
    [Param.unit]: unit,
  } = element.dataset;

  return {
    ...base,
    format: toBoolean(format),
    recurrence: toBoolean(recurrence),
    tax: toBoolean(tax),
    unit: toBoolean(unit),
  };
}

/**
 * @param {HTMLAnchorElement} element
 * @returns {Omit<
 *  Tacocat.Wcs.PricePlaceholderContext,
 *  keyof Tacocat.Wcs.LocaleContext
 * >}
 */
export function parsePriceHref(element) {
  const params = getOstLinkParams(element);
  if (isNil(params)) return undefined;
  const base = parseOstLinkContext(element, params);
  if (isNil(base)) return undefined;
  const format = toBoolean(params.get(Key.format) ?? false);
  const promo = params.get(Key.promo);
  const recurrence = toBoolean(params.get(Key.client));
  const tax = toBoolean(params.get(Key.tax) ?? false);
  const unit = toBoolean(params.get(Key.unit) ?? false);
  return {
    ...base,
    format,
    recurrence,
    promo,
    tax,
    unit,
  };
}

/**
 * @param {HTMLElement} element
 * @returns {Tacocat.Wcs.PriceLiterals}
 */
export const parsePriceLiterals = (element) => literalsCache.getOrSet(
  element,
  () => {
    const source = querySelectorUp(element, PriceCssSelector.literals);
    const {
      perUnitLabel = '',
      recurrenceLabel = '',
    } = parseJson(source?.textContent) ?? {};
    return { literals: { perUnitLabel, recurrenceLabel } };
  },
);

/**
 * @param {HTMLElement} element
 * @returns {Tacocat.Wcs.PricePlaceholderContext}
 */
export const parsePriceSettings = (element) => settingsCache.getOrSet(
  element,
  () => {
    const source = querySelectorUp(element, PriceCssSelector.settings);
    const json = parseJson(source?.textContent) ?? {};
    const format = toBoolean(json[Key.format]);
    const recurrence = toBoolean(json[Key.recurrence]);
    const tax = toBoolean(json[Key.tax]);
    const unit = toBoolean(json[Key.unit]);
    return { format, recurrence, tax, unit };
  },
);
