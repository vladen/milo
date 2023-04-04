import { WeakCache } from '../../cache.js';
import { Checkout, Key } from '../constant/index.js';
import { extractDataset, extractOstLinkParams, getOstLinkParams, validateContext } from './common.js';
import Log from '../../log.js';
import { parseJson } from '../../parser.js';
import { isNil, isString, querySelectorUp, toInteger } from '../../util.js';

const defaultClient = 'adobe';
const defaultStep = 'email';
const defaultTarget = '_top';

const log = Log.common.module('Wcs').module('extractor').module('checkout');
const literalsCache = WeakCache();
const settingsCache = WeakCache();
const targetValues = Object.values(Checkout.Target);

/**
 * @param {string[]} osis
 * @param {string} quantity
 * @param {string} quantities
 * @returns {number[]}
 */
function extractQuantities(osis, quantity, quantities) {
  const defaultQuantity = toInteger(quantity, 1);
  const quantityItems = quantities.split(',');
  return osis.reduce(
    (array, _, index) => [...array, toInteger(quantityItems[index], defaultQuantity)],
    [],
  );
}

function extractTarget(target) {
  if (isString(target)) {
    // eslint-disable-next-line no-param-reassign
    target = target.toLowerCase();
    if (targetValues.includes(target)) return target;
    log.warn('Unknown "target" value, ignoring:', target);
  }
  return defaultTarget;
}

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<T & object, Omit<
 *  Tacocat.Wcs.CheckoutPlaceholderContext,
 *  keyof Tacocat.Wcs.LocaleContext
 * >>}
 */
export async function extractCheckoutDataset(state) {
  // @ts-ignore
  const base = await extractDataset(state);
  if (isNil(base)) return undefined;

  const Param = Checkout.DatasetParam.pending;
  const {
    [Param.client]: client = defaultClient,
    [Param.promo]: promo = '',
    [Param.quantity]: quantity = '',
    [Param.quantities]: quantities = '',
    [Param.step]: step = defaultStep,
    [Param.target]: target = defaultTarget,
  } = state.element.dataset;

  return {
    ...base,
    client,
    promo,
    quantities: extractQuantities(base.osis, quantity, quantities),
    step,
    target: extractTarget(target),
  };
}

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<T & object, Omit<
 *  Tacocat.Wcs.CheckoutPlaceholderContext,
 *  keyof Tacocat.Wcs.LocaleContext
 * >>}
 */
export async function extractCheckoutHref(state) {
  // @ts-ignore
  const params = getOstLinkParams(state.element);
  if (isNil(params)) return undefined;
  const base = extractOstLinkParams(params);
  if (isNil(base)) return undefined;
  const client = params.get(Key.cli) || defaultClient;
  const [quantity = '', quantities = ''] = params.getAll(Key.q);
  const step = params.get('step') || defaultStep;
  const target = extractTarget(params.get(Key.target));
  return {
    ...base,
    client,
    quantities: extractQuantities(base.osis, quantity, quantities),
    step,
    target,
  };
}

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<T & object, Tacocat.Wcs.CheckoutLiterals>}
 */
export const extractCheckoutLiterals = ({ element }) => literalsCache.getOrSet(
  [element],
  async () => {
    const source = querySelectorUp(element, Checkout.CssSelector.literals);
    const { ctaLabel = '' } = parseJson(source?.textContent) ?? {};
    return { literals: { ctaLabel } };
  },
);

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<T & object, Tacocat.Wcs.CheckoutSettings>}
 */
export const extractCheckoutSettings = ({ element }) => settingsCache.getOrSet(
  [element],
  async () => {
    const source = querySelectorUp(element, Checkout.CssSelector.settings);
    const json = parseJson(source?.textContent) ?? {};
    const client = json[Key.client] ?? defaultClient;
    const step = json[Key.step] ?? defaultStep;
    const target = extractTarget(json[Key.target]);
    return { client, step, target };
  },
);

/**
 * @template T
 * @type {Tacocat.Engine.Extractor<
 *  T & Tacocat.Wcs.CheckoutPlaceholderContext & Tacocat.Wcs.LiteralsContext,
 *  T & Tacocat.Wcs.CheckoutPlaceholderContext & Tacocat.Wcs.LiteralsContext
 * >}
 */
export async function validateCheckoutContext(detail) {
  // @ts-ignore
  const result = await validateContext(detail);
  if (!result) return undefined;
  const { context, context: { quantities, osis, step } } = detail;
  if (!Array.isArray(quantities) || quantities.length !== osis.length) {
    log.warn('Invalid "quantities" context, skipping:', detail);
    return undefined;
  }
  if (!isString(step) || !step) {
    log.warn('Invalid "step" context, skipping:', detail);
    return undefined;
  }
  return context;
}
