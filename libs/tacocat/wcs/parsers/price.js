import { Cache, WeakCache } from '../../cache.js';
import { Key, PriceDatasetParam, namespace } from '../constants.js';
import Log from '../../log.js';
import { parsePlaceholderDataset, parsePlaceholderHref } from './common.js';
import { parseHrefParams, tryParseJson } from '../../parsers.js';
import { getMatchingSelfOrAncestor, toBoolean } from '../../utils.js';

const literalsCache = Cache();
const hrefParamsCache = WeakCache();
const settingsCache = Cache();

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
  const { extra, template } = parsePlaceholderDataset(element);
  const PriceParam = PriceDatasetParam.stale;
  const {
    [PriceParam.format]: format,
    [PriceParam.recurrence]: recurrence,
    [PriceParam.osi]: osi,
    [PriceParam.tax]: tax,
    [PriceParam.unit]: unit,
  } = element.dataset;
  if (!osi) {
    log.warn('Osi dataset item is missing, ignoring:', element.dataset);
    return undefined;
  }
  return {
    extra,
    format: toBoolean(format),
    osi,
    recurrence: toBoolean(recurrence),
    tax: toBoolean(tax),
    template,
    unit: toBoolean(unit),
  };
}

/**
 * @param {HTMLAnchorElement} element
 * @returns {Tacocat.Wcs.PricePlaceholderContext}
 */
export const parsePriceHref = (element) => hrefParamsCache.getOrSet(
  element,
  () => {
    const params = parseHrefParams(element);
    const { extra, template } = parsePlaceholderHref(element) ?? {};
    const osi = params.get(Key.osi);
    if (!osi) {
      log.warn('Osi param is missing, ignoring:', params.toString());
      return undefined;
    }
    const format = toBoolean(params.get(Key.format) ?? false);
    const recurrence = params.get(Key.client);
    const tax = toBoolean(params.get(Key.tax) ?? false);
    const unit = toBoolean(params.get(Key.unit) ?? false);
    return {
      extra, format, recurrence, osi, tax, template, unit,
    };
  },
);

/**
 * @param {HTMLElement} element
 * @returns {Tacocat.Wcs.PriceLiterals}
 */
export const parsePriceLiterals = (element) => literalsCache.getOrSet(
  element,
  () => {
    const source = getMatchingSelfOrAncestor(element, PriceCssSelector.literals);
    const {
      perUnitLabel = '',
      recurrenceLabel = '',
    } = tryParseJson(source?.textContent) ?? {};
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
    const source = getMatchingSelfOrAncestor(element, PriceCssSelector.settings);
    const json = tryParseJson(source?.textContent) ?? {};
    const format = toBoolean(json[Key.format]);
    const recurrence = toBoolean(json[Key.recurrence]);
    const tax = toBoolean(json[Key.tax]);
    const unit = toBoolean(json[Key.unit]);
    return { format, recurrence, tax, unit };
  },
);
