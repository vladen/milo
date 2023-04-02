import { pendingTemplate, rejectedTemplate } from './common.js';
import { CheckoutCssClass, CheckoutDatasetParam, CheckoutTarget, Key, namespace } from '../constants.js';
import { createTag } from '../../../utils/utils.js';
import Log from '../../log.js';

const log = Log.common.module(namespace).module('template').module('checkout');

const baseUrl = 'https://commerce.adobe.com';

/**
 * @param {Event} event
 */
function onCheckoutButtonClick(event) {
  const {
    [CheckoutDatasetParam.pending.target]: target,
    [CheckoutDatasetParam.resolved.url]: url,
  // @ts-ignore
  } = event.target?.dataset ?? {};
  if (!url) {
    log.warn('Missing "url" dataset item on clicked button, canceling navigation:', event);
  }
  switch (target) {
    case CheckoutTarget.blank:
      window.open(url);
      break;
    case CheckoutTarget.parent:
      window.parent.location.assign(url);
      break;
    case CheckoutTarget.self:
      window.location.assign(url);
      break;
    default:
      window.top.location.assign(url);
      break;
  }
}

/**
 * @param {HTMLAnchorElement | HTMLButtonElement} element
 * @param {string} target
 * @param {URL} url
 */
function setCheckoutUrl(element, target, url) {
  if (element instanceof HTMLAnchorElement) {
    element.href = url.toString();
    element.target = target;
  } else if (element instanceof HTMLButtonElement) {
    element.disabled = false;
  }
}

/**
 * @param {HTMLElement} element
 * @param {Tacocat.Contextful<
 *  Tacocat.Wcs.CheckoutLiterals & Tacocat.Wcs.PlaceholderContext
 * >} result
 * @param {event} event
 * @param {Tacocat.Engine.Control} control
 * @returns {HTMLAnchorElement | HTMLButtonElement}
 */
function checkoutTemplate(element, { context }, event, control) {
  let tag = element;
  if (context.template === Key.checkoutButton && element.tagName !== 'BUTTON') {
    tag = createTag(
      'button',
      {},
      context.literals.ctaLabel,
    );
    tag.addEventListener('click', onCheckoutButtonClick);
    control.dispose(() => tag.removeEventListener('click', onCheckoutButtonClick));
  } else if (element.tagName !== 'A') {
    tag = createTag(
      'a',
      { href: '#' },
      context.literals.ctaLabel,
    );
  }
  tag.classList.add(CheckoutCssClass.placeholder);

  if (tag !== element) element.replaceWith(tag);
  // @ts-ignore
  return tag;
}

/**
 * Replaces current placeholder element with `a` or `button` element if needed,
 * sets data attributes reflecting checkout context.
 * @param {HTMLElement} element
 * @param {Tacocat.Contextful<
 *  Tacocat.Wcs.CheckoutPlaceholderContext & Tacocat.Wcs.CheckoutLiterals
 * >} result
 * @param {event} event
 * @param {Tacocat.Engine.Control} control
 * @returns
 */
export function pendingCheckoutTemplate(element, { context }, event, control) {
  const tag = checkoutTemplate(element, { context }, event, control);
  pendingTemplate(tag, { context });

  const Param = CheckoutDatasetParam.stale;
  tag.dataset[Param.client] = context.client;
  tag.dataset[Param.osis] = context.osis.join('\n');
  tag.dataset[Param.quantities] = context.quantities.join(',');
  tag.dataset[Param.step] = context.step;
  tag.dataset[Param.target] = context.target;

  return tag;
}

/**
 * Replaces current placeholder element with `a` or `button` element if needed,
 * sets data attributes reflecting resolved offers,
 * sets checkout href for `a` element
 * or enables `button` element and adds click event listener to it.
 * @param {HTMLElement} element
 * @param {Tacocat.Wcs.CheckoutResolution} result
 * @param {event} event
 * @param {Tacocat.Engine.Control} control
 * @returns {Element}
 */
export function resolvedCheckoutTemplate(element, { context, offers }, event, control) {
  if (!offers.length) {
    log.warn('No offers were resolved for checkout context, rejecting placeholder:', { context, element });
    // @ts-ignore
    return rejectedTemplate(element, { context });
  }

  const analytics = [];
  const url = new URL(baseUrl);
  url.searchParams.append(Key.cli, context.client);
  url.searchParams.append(Key.co, context.country);
  url.searchParams.append(Key.lang, context.language);
  offers.forEach((offer, index) => {
    if (offer.analytics) analytics.push(offer.analytics);
    const prefix = `items[${index}]`;
    url.searchParams.append(`${prefix}[${Key.q}]`, (context.quantities[index] ?? 1).toString());
    url.searchParams.append(`${prefix}[${Key.id}]`, offer.offerId);
  });

  Object.entries(context.extra).forEach(
    ([key, value]) => url.searchParams.append(key, value),
  );

  const tag = checkoutTemplate(element, { context }, event, control);
  setCheckoutUrl(tag, context.target, url);

  const Param = CheckoutDatasetParam.resolved;
  tag.dataset[Param.analytics] = analytics.join(' ');
  tag.dataset[Param.commitments] = offers.map(({ commitment }) => commitment).join(',');
  tag.dataset[Param.offers] = offers.map(({ offerId }) => offerId).join(',');
  tag.dataset[Param.terms] = offers.map(({ term }) => term).join(',');
  if (tag instanceof HTMLButtonElement) {
    tag.dataset[Param.url] = url.toString();
  }

  return tag;
}

/**
 * Sets href of `a` element to '#' or disables `button` element.
 * @param {HTMLElement} element
 */
export function staleCheckoutTemplate(element) {
  if (element instanceof HTMLAnchorElement) {
    element.href = '#';
  } else if (element instanceof HTMLButtonElement) {
    element.disabled = true;
  }
  return element;
}
