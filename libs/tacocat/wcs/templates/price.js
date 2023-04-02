import { pendingTemplate, rejectedTemplate } from './common.js';
import { Key, PriceCssClass, PriceDatasetParam, namespace } from '../constants.js';
import Log from '../../log.js';
import { isObject } from '../../utils.js';
import { createTag } from '../../../utils/utils.js';

const log = Log.common.module(namespace).module('template').module('price');

/**
 * @param {HTMLElement} element
 * @returns {HTMLSpanElement}
 */
function priceTemplate(element) {
  /** @type {HTMLElement} */
  let tag = element;
  if (tag.tagName !== 'SPAN') {
    tag = createTag('span');
  }
  tag.classList.add(PriceCssClass.placeholder);
  return tag;
}

/**
 * Replaces current placeholder element with `span` element if needed,
 * sets data attributes reflecting price context.
 * Used to transform OST price placeholder links into `span` elements.
 * @param {HTMLElement} element
 * @param {Tacocat.Contextful<
 *   Tacocat.Wcs.PricePlaceholderContext
 * >} result
 * @returns {HTMLSpanElement} Original or new `span` element.
 */
export function pendingPriceTemplate(element, { context }) {
  const tag = priceTemplate(element);
  pendingTemplate(tag, { context });

  const Param = PriceDatasetParam.stale;
  tag.dataset[Param.format] = context.format.toString();
  tag.dataset[Param.osi] = context.osi;
  tag.dataset[Param.recurrence] = context.recurrence.toString();
  tag.dataset[Param.tax] = context.tax.toString();
  tag.dataset[Param.unit] = context.unit.toString();

  return tag;
}

/**
 * Replaces current placeholder element with `span` element if needed,
 * sets data attributes reflecting resolved offer,
 * renders offer price.
 * Used to render price.
 * @param {HTMLElement} element
 * @param {Tacocat.Wcs.PriceResolution} result
 * @returns {HTMLSpanElement} Original or new `span` element.
 */
export function resolvedPriceTemplate(element, { context, offers }) {
  const offer = offers.find(isObject);
  if (!offer) {
    log.warn('No offer was resolved for price context, rejecting placeholder:', { context, element });
    // @ts-ignore
    return rejectedTemplate(element, { context });
  }

  const tag = priceTemplate(element);

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

  const Param = PriceDatasetParam.resolved;
  tag.dataset[Param.analytics] = offer.analytics ?? '';
  tag.dataset[Param.commitment] = offer.commitment;
  tag.dataset[Param.offer] = offer.offerId;
  tag.dataset[Param.term] = offer.term;

  return tag;
}

/**
 * Removes content of price placeholder element.
 * @param {HTMLElement} element
 */
export function stalePriceTemplate(element) {
  element.innerHTML = '';
}
