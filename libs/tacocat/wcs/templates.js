import { namespace } from './constants.js';
import { createTag } from '../../utils/utils.js';
import { qualify } from '../constants.js';
import Log from '../log.js';
import { parseHrefParams } from '../parsers.js';
import { joinUnique } from '../utils.js';

const log = Log.common.module(namespace).module('template');

export const DatasetKey = {
  analytics: qualify(namespace, 'analytics'),
  commitments: qualify(namespace, 'commitments'),
  offers: qualify(namespace, 'offers'),
  osis: qualify(namespace, 'osis'),
  template: qualify(namespace, 'template'),
  terms: qualify(namespace, 'terms'),
};

/**
 * @param {HTMLElement} element
 * @param {Tacocat.Wcs.CheckoutRejection | Tacocat.Wcs.PriceRejection} result
 */
export function rejectedTemplate(element, { context }) {
  element.dataset[DatasetKey.template] = context.template;
  element.textContent = '...';
  return element;
}

/**
 * @param {HTMLElement} element
 * @param {Tacocat.Wcs.CheckoutResolution} result
 * @returns {Element}
 */
export function checkoutTemplate(element, { context, offers }) {
  if (!offers.length) {
    log.warn('No offers were resolved for checkout context, rejecting:', context);
    // @ts-ignore
    return rejectedTemplate(element, { context });
  }
  const analytics = [];
  const url = new URL('https://commerce.adobe.com');
  url.searchParams.append('cli', context.client);
  url.searchParams.append('co', context.country);
  url.searchParams.append('lang', context.language);
  offers.forEach((offer, index) => {
    if (offer.analytics) analytics.push(offer.analytics);
    const prefix = `items[${index}]`;
    url.searchParams.append(`${prefix}[q]`, (context.qantity[index] ?? 1).toString());
    url.searchParams.append(`${prefix}[id]`, offer.offerId);
  });
  Object.entries(context.extra).forEach(
    ([key, value]) => url.searchParams.append(key, value),
  );
  /** @type {HTMLElement} */
  let tag;
  if (context.template === 'checkoutButton') {
    tag = createTag('button', { class: 'checkout' }, context.literals.ctaLabel);
    tag.addEventListener('click', () => {
      window.location.assign(url);
    });
  } else {
    tag = createTag('a', { class: 'checkout', href: url.toString() }, context.literals.ctaLabel);
  }
  tag.dataset[DatasetKey.analytics] = analytics.join(',');
  tag.dataset[DatasetKey.commitments] = joinUnique(offers.map(({ commitment }) => commitment));
  tag.dataset[DatasetKey.offers] = joinUnique(offers.map(({ offerId }) => offerId));
  tag.dataset[DatasetKey.osis] = joinUnique(context.osis);
  tag.dataset[DatasetKey.template] = context.template;
  tag.dataset[DatasetKey.terms] = joinUnique(offers.map(({ term }) => term));
  element.replaceWith(tag);
  return tag;
}

/**
 * @param {HTMLElement} element
 * @param {Tacocat.Wcs.PriceResolution} result
 * @returns {HTMLElement}
 */
// eslint-disable-next-line import/prefer-default-export
export function priceTemplate(element, { context, offers }) {
  const [offer] = offers;
  if (!offers.length) {
    log.warn('No offers were resolved for price context, rejecting:', context);
    // @ts-ignore
    return rejectedTemplate(element, { context });
  }
  /** @type {HTMLElement} */
  let tag;
  if (context.template === 'priceOptical') {
    tag = createTag('span', { }, Math.round(offer.priceDetails.price));
  } else if (context.template === 'priceStrikethrough') {
    tag = createTag('s', {}, offer.priceDetails.price);
  } else {
    tag = createTag('span', { }, offer.priceDetails.price);
  }
  if (context.recurrence && context.literals.recurrenceLabel) {
    tag.textContent += ` ${context.literals.recurrenceLabel}`;
  }
  if (context.unit && context.literals.perUnitLabel) {
    tag.textContent += ` ${context.literals.perUnitLabel}`;
  }
  tag.classList.add(context.template);
  tag.dataset[DatasetKey.analytics] = offer.analytics ?? '';
  tag.dataset[DatasetKey.commitments] = offer.commitment;
  tag.dataset[DatasetKey.offers] = offer.offerId;
  tag.dataset[DatasetKey.osis] = joinUnique(context.osis);
  tag.dataset[DatasetKey.template] = context.template;
  tag.dataset[DatasetKey.terms] = offer.term;
  element.replaceWith(tag);
  return tag;
}

/**
 * @param {HTMLAnchorElement} element
 */
export function staleTemplate(element) {
  const span = createTag('span');
  span.dataset = Object.fromEntries(
    [...parseHrefParams(element).entries()].map(
      ([key, value]) => [qualify(key), value],
    ),
  );
  element.replaceWith(span);
  return span;
}
