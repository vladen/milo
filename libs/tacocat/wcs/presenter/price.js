import { pendingPresenter, rejectedPresenter } from './common.js';
import { Key, Price, namespace } from '../constant/index.js';
import Log from '../../log.js';
import { isNil, isObject } from '../../util.js';

const log = Log.common.module(namespace).module('template').module('price');

/**
 * @type {Tacocat.Engine.PendingPresenter<Tacocat.Wcs.PlaceholderContext>}
 */
function pricePresenter({ context: { template }, element }) {
  /** @type {HTMLElement} */
  let tag = element;
  if (template === Key.priceStrikethrough) {
    if (tag.tagName !== 'S') tag = document.createElement('S');
  } else if (tag.tagName !== 'SPAN') {
    tag = document.createElement('SPAN');
  }
  tag.classList.add(Price.CssClass.placeholder);
  return tag;
}

/**
 * Removes content of price placeholder element.
 * @param {HTMLElement} element
 */
export function mountedPriceTemplate(element) {
  element.innerHTML = '';
}

/**
 * Replaces current placeholder element with `span` element if needed,
 * sets data attributes reflecting price context.
 * Used to transform OST price placeholder links into `span` elements.
 * @type {Tacocat.Engine.PendingPresenter<Tacocat.Wcs.PricePlaceholderContext>}
 */
export function pendingPricePresenter(detail) {
  const { context } = detail;
  const tag = pricePresenter(detail);
  if (tag) {
    pendingPresenter({ ...detail, element: tag });
    const Param = Price.DatasetParam.pending;
    tag.dataset[Param.format] = context.format.toString();
    tag.dataset[Param.recurrence] = context.recurrence.toString();
    tag.dataset[Param.tax] = context.tax.toString();
    tag.dataset[Param.unit] = context.unit.toString();
    tag.classList.remove(Price.CssClass.link);
  }
  return tag;
}

/**
 * Replaces current placeholder element with `span` element if needed,
 * sets data attributes reflecting resolved offer,
 * renders offer price.
 * Used to render price.
 * @type {Tacocat.Engine.ResolvedPresenter<
 *  Tacocat.Wcs.PricePlaceholderContext & Tacocat.Wcs.PriceLiterals,
 *  Tacocat.Wcs.Offers
 * >}
 */
export function resolvedPricePresenter(detail) {
  const { context, element, result: { offers } } = detail;
  const offer = offers.find(isObject);
  if (isNil(offer)) {
    log.warn('No offer was resolved for price context, rejecting placeholder:', { context, element });
    // @ts-ignore
    return rejectedPresenter(element, { context });
  }

  const tag = pricePresenter(detail);
  if (tag) {
    if (context.template === Key.priceOptical) {
      tag.textContent = Math.round(+offer.priceDetails.price).toString();
    } else {
      tag.textContent = (+offer.priceDetails.price).toString();
    }
    if (context.recurrence && context.literals.recurrenceLabel) {
      tag.textContent += ` ${context.literals.recurrenceLabel}`;
    }
    if (context.unit && context.literals.perUnitLabel) {
      tag.textContent += ` ${context.literals.perUnitLabel}`;
    }

    const Param = Price.DatasetParam.resolved;
    tag.dataset[Param.analytics] = offer.analytics ?? '';
    tag.dataset[Param.commitment] = offer.commitment;
    tag.dataset[Param.offer] = offer.offerId;
    tag.dataset[Param.term] = offer.term;
  }
  return tag;
}
