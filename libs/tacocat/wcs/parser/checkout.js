import { WeakCache } from '../../cache.js';
import { Checkout, Key } from '../constant/index.js';
import { parsePlaceholderDataset, parseOstLinkContext, getOstLinkParams } from './common.js';
import Log from '../../log.js';
import { parseJson } from '../../parser.js';
import { isNil, isString, querySelectorUp, toInteger } from '../../util.js';

const defaultClient = 'adobe';
const defaultStep = 'email';
const defaultTarget = '_top';

const literalsCache = WeakCache();
const settingsCache = WeakCache();

const log = Log.common.module('Wcs').module('parsers').module('checkout');

const targetValues = Object.values(Checkout.Target);

/**
 * @param {string[]} osis
 * @param {string} quantity
 * @param {string} quantities
 * @returns {number[]}
 */
function parseQuantities(osis, quantity, quantities) {
  const defaultQuantity = toInteger(quantity, 1);
  const quantityItems = quantities.split(',');
  return osis.reduce(
    (array, _, index) => [...array, toInteger(quantityItems[index], defaultQuantity)],
    [],
  );
}

function parseTarget(target) {
  if (isString(target)) {
    // eslint-disable-next-line no-param-reassign
    target = target.toLowerCase();
    if (targetValues.includes(target)) return target;
    log.warn('Unknown "target" value, ignoring:', target);
  }
  return defaultTarget;
}

/**
 * @param {HTMLElement} element
 * @returns {Omit<Tacocat.Wcs.CheckoutPlaceholderContext, keyof Tacocat.Wcs.LocaleContext>}
 */
export function parseCheckoutDataset(element) {
  const base = parsePlaceholderDataset(element);
  if (isNil(base)) return undefined;

  const Param = Checkout.DatasetParam.pending;
  const {
    [Param.client]: client = defaultClient,
    [Param.promo]: promo = '',
    [Param.quantity]: quantity = '',
    [Param.quantities]: quantities = '',
    [Param.step]: step = defaultStep,
    [Param.target]: target = defaultTarget,
  } = element.dataset;

  return {
    ...base,
    client,
    promo,
    quantities: parseQuantities(base.osis, quantity, quantities),
    step,
    target: parseTarget(target),
  };
}

/**
 * @param {HTMLAnchorElement} element
 * @returns {Omit<
 *  Tacocat.Wcs.CheckoutPlaceholderContext,
 *  keyof Tacocat.Wcs.LocaleContext
 * >}
 */
export function parseCheckoutHref(element) {
  const params = getOstLinkParams(element);
  if (isNil(params)) return undefined;
  const base = parseOstLinkContext(element, params);
  if (isNil(base)) return undefined;
  const client = params.get(Key.cli) || defaultClient;
  const [quantity = '', quantities = ''] = params.getAll(Key.q);
  const promo = params.get(Key.promo);
  const step = params.get('step') || defaultStep;
  const target = parseTarget(params.get(Key.target));
  return {
    ...base,
    client,
    quantities: parseQuantities(base.osis, quantity, quantities),
    promo,
    step,
    target,
  };
}

/**
 * @param {HTMLElement} element
 * @returns {Tacocat.Wcs.CheckoutLiterals}
*/
export const parseCheckoutLiterals = (element) => literalsCache.getOrSet(
  element,
  () => {
    const source = querySelectorUp(element, Checkout.CssSelector.literals);
    const { ctaLabel = '' } = parseJson(source?.textContent) ?? {};
    return { literals: { ctaLabel } };
  },
);

/**
 * @param {HTMLElement} element
 * @returns {Tacocat.Wcs.CheckoutSettings}
 */
export const parseCheckoutSettings = (element) => settingsCache.getOrSet(
  element,
  () => {
    const source = querySelectorUp(element, Checkout.CssSelector.settings);
    const json = parseJson(source?.textContent) ?? {};
    const client = json[Key.client] ?? defaultClient;
    const step = json[Key.step] ?? defaultStep;
    const target = parseTarget(json[Key.target]);

    return { client, step, target };
  },
);
