import { Cache, WeakCache } from '../../cache.js';
import { CheckoutCssSelector, CheckoutDatasetParam, CheckoutTarget, Key } from '../constants.js';
import { parsePlaceholderDataset, parsePlaceholderHref } from './common.js';
import Log from '../../log.js';
import { parseHrefParams, tryParseJson } from '../../parsers.js';
import { getMatchingSelfOrAncestor, toInteger } from '../../utils.js';

const defaultClient = 'adobe';
const defaultStep = 'email';
const defaultTarget = '_top';

const literalsCache = Cache();
const hrefParamsCache = WeakCache();
const settingsCache = Cache();

const log = Log.common.module('Wcs').module('parsers').module('checkout');

const targetValues = Object.values(CheckoutTarget);

function parseTarget(target = defaultTarget) {
  // eslint-disable-next-line no-param-reassign
  target = target.toLowerCase();
  if (!targetValues.includes(target)) {
    log.warn('Unknown "target" value, ignoring:', target);
    return defaultTarget;
  }
  return target;
}

/**
 * @param {HTMLElement} element
 * @returns {Omit<Tacocat.Wcs.CheckoutPlaceholderContext, keyof Tacocat.Wcs.LocaleContext>}
 */
export function parseCheckoutDataset(element) {
  const { extra, template } = parsePlaceholderDataset(element) ?? {};
  if (template) return undefined;
  const Param = CheckoutDatasetParam.stale;
  const {
    [Param.client]: client = defaultClient,
    [Param.osi]: oneOsi = '',
    [Param.osis]: manyOsis = '',
    [Param.quantity]: oneQantity = '',
    [Param.quantities]: manyQantities = '',
    [Param.step]: step = defaultStep,
    [Param.target]: target = defaultTarget,
  } = element.dataset;

  const osis = [...new Set([
    oneOsi,
    ...(manyOsis?.split('\n') ?? []),
  ].filter((osi) => osi))];
  if (!osis.length) {
    log.warn('Missing "osi" or "osis" dataset item, ignoring:', element.dataset);
    return undefined;
  }

  const quantity = toInteger(oneQantity, 1);
  const quantities = manyQantities?.split(',') ?? [];

  return {
    client,
    extra,
    osis,
    quantities: osis.reduce(
      (array, _, index) => [...array, toInteger(quantities[index], quantity)],
      [],
    ),
    step,
    target: parseTarget(target),
    template,
  };
}

/**
 * @param {HTMLAnchorElement} element
 * @returns {Tacocat.Wcs.CheckoutPlaceholderContext}
 */
export const parseCheckoutHref = (element) => hrefParamsCache.getOrSet(
  element,
  () => {
    const params = parseHrefParams(element);
    const { extra, template } = parsePlaceholderHref(element) ?? {};
    const osis = params.getAll(Key.osi);
    if (!osis.length) {
      log.warn('Osi param is missing, ignoring:', params.toString());
      return undefined;
    }
    const client = params.get(Key.cli) || 'adobe';
    const qantities = params.getAll(Key.q);
    const step = params.get('step') || 'email';
    return {
      client, extra, osis, qantities, step, template,
    };
  },
);

/**
 * @param {HTMLElement} element
 * @returns {Tacocat.Wcs.CheckoutLiterals}
*/
export const parseCheckoutLiterals = (element) => literalsCache.getOrSet(
  element,
  () => {
    const source = getMatchingSelfOrAncestor(element, CheckoutCssSelector.literals);
    const { ctaLabel = '' } = tryParseJson(source?.textContent) ?? {};
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
    const source = getMatchingSelfOrAncestor(element, CheckoutCssSelector.settings);
    const json = tryParseJson(source?.textContent) ?? {};
    const client = json[Key.client] ?? defaultClient;
    const step = json[Key.step] ?? defaultStep;
    const target = parseTarget(json[Key.target]);

    return { client, step, target };
  },
);
