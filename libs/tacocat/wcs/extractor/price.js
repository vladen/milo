import { WeakCache } from '../../cache.js';
import { extractDataset, extractOstLinkParams, getOstLinkParams, validateContext } from './common.js';
import { Key, Price } from '../constant/index.js';
import { parseJson } from '../../parser.js';
import { isNil, querySelectorUp, toBoolean } from '../../util.js';

const literalsCache = WeakCache();
const settingsCache = WeakCache();

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<T & object, Omit<
 *  Tacocat.Wcs.PricePlaceholderContext,
 *  keyof Tacocat.Wcs.LocaleContext
 * >>}
 */
export async function extractPriceDataset(state) {
  const base = extractDataset(state);
  if (isNil(base)) return undefined;

  const Param = Price.DatasetParam.pending;
  const {
    [Param.format]: format,
    [Param.recurrence]: recurrence,
    [Param.tax]: tax,
    [Param.unit]: unit,
  } = state.element.dataset;

  return {
    ...base,
    format: toBoolean(format),
    recurrence: toBoolean(recurrence),
    tax: toBoolean(tax),
    unit: toBoolean(unit),
  };
}

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<T & object, Omit<
*  Tacocat.Wcs.PricePlaceholderContext,
*  keyof Tacocat.Wcs.LocaleContext
* >>}
*/
export async function extractPriceHref({ element }) {
  const params = getOstLinkParams(element);
  if (isNil(params)) return undefined;
  const base = extractOstLinkParams(params);
  if (isNil(base)) return undefined;
  const format = toBoolean(params.get(Key.format) ?? false);
  const recurrence = toBoolean(params.get(Key.recurrence));
  const tax = toBoolean(params.get(Key.tax) ?? false);
  const unit = toBoolean(params.get(Key.unit) ?? false);
  return {
    ...base,
    format,
    recurrence,
    tax,
    unit,
  };
}

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<T & object, Tacocat.Wcs.PriceLiterals>}
*/
export const extractPriceLiterals = ({ element }) => literalsCache.getOrSet(
  [element],
  async () => {
    const source = querySelectorUp(element, Price.CssSelector.literals);
    const {
      perUnitLabel = '',
      recurrenceLabel = '',
    } = parseJson(source?.textContent) ?? {};
    return { literals: { perUnitLabel, recurrenceLabel } };
  },
);

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<T & object, Tacocat.Wcs.PriceSettings>}
*/
export const extractPriceSettings = ({ element }) => settingsCache.getOrSet(
  [element],
  async () => {
    const source = querySelectorUp(element, Price.CssSelector.settings);
    const json = parseJson(source?.textContent) ?? {};
    const format = toBoolean(json[Key.format]);
    const recurrence = toBoolean(json[Key.recurrence]);
    const tax = toBoolean(json[Key.tax]);
    const unit = toBoolean(json[Key.unit]);
    return { format, recurrence, tax, unit };
  },
);

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<
*  T & Tacocat.Wcs.PricePlaceholderContext & Tacocat.Wcs.LiteralsContext,
*  T & Tacocat.Wcs.PricePlaceholderContext & Tacocat.Wcs.LiteralsContext
* >}
*/
export function validatePriceContext(detail) {
  // @ts-ignore
  return validateContext(detail);
}
