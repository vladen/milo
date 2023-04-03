import { pendingTemplate, rejectedTemplate } from './common.js';
import { Checkout, Key, namespace } from '../constant/index.js';
import { createTag, isNil } from '../../util.js';
import Log from '../../log.js';

const log = Log.common.module(namespace).module('template').module('checkout');

const baseUrl = 'https://commerce.adobe.com';

/**
 * @param {Event} event
 */
function onCheckoutButtonClick(event) {
  const {
    [Checkout.DatasetParam.pending.target]: target,
    [Checkout.DatasetParam.resolved.url]: url,
  // @ts-ignore
  } = event.target?.dataset ?? {};
  if (!url) {
    log.warn('Missing "url" dataset item on clicked button, canceling navigation:', event);
  }
  switch (target) {
    case Checkout.Target.blank:
      window.open(url);
      break;
    case Checkout.Target.parent:
      window.parent.location.assign(url);
      break;
    case Checkout.Target.self:
      window.location.assign(url);
      break;
    default:
      window.top.location.assign(url);
      break;
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
  if (context.template === Key.checkoutButton) {
    if (element.tagName !== 'BUTTON') {
      tag = createTag(
        'button',
        {},
        context.literals.ctaLabel,
      );
      tag.addEventListener('click', onCheckoutButtonClick);
      control.dispose(() => tag.removeEventListener('click', onCheckoutButtonClick));
    }
  } else if (element.tagName !== 'A') {
    tag = createTag(
      'a',
      { href: '#' },
      context.literals.ctaLabel,
    );
  }
  if (tag !== element) log.debug('Created:', { element: tag });
  tag.classList.add(Checkout.CssClass.placeholder);

  // @ts-ignore
  return tag;
}

/**
 * Sets href of `a` element to '#' or disables `button` element.
 * @param {HTMLElement} element
 */
export function mountedCheckoutTemplate(element) {
  if (element instanceof HTMLAnchorElement) {
    element.style.display = 'none';
  } else if (element instanceof HTMLButtonElement) {
    element.disabled = true;
  }
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

  const Param = Checkout.DatasetParam.pending;
  tag.dataset[Param.client] = context.client;
  tag.dataset[Param.quantities] = context.quantities.join(',');
  tag.dataset[Param.step] = context.step;
  tag.dataset[Param.target] = context.target;

  tag.classList.remove(Checkout.CssClass.link);

  if (element instanceof HTMLAnchorElement) {
    element.href = '#';
  }

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
  if (!isNil(context.promo)) {
    url.searchParams.append(Key.promoid, context.promo);
  }
  offers.forEach((offer, index) => {
    if (offer.analytics) analytics.push(offer.analytics);
    const prefix = `items[${index}]`;
    url.searchParams.append(`${prefix}[${Key.q}]`, (context.quantities[index] ?? 1).toString());
    url.searchParams.append(`${prefix}[${Key.id}]`, offer.offerId);
  });

  const tag = checkoutTemplate(element, { context }, event, control);

  const Param = Checkout.DatasetParam.resolved;
  tag.dataset[Param.analytics] = analytics.join(' ');
  const commitments = offers.map(({ commitment }) => commitment);
  const uniqueCommitments = new Set(commitments);
  tag.dataset[Param.commitments] = uniqueCommitments.size === 1
    ? [...uniqueCommitments][0]
    : commitments.join(',');
  tag.dataset[Param.offers] = offers.map(({ offerId }) => offerId).join(',');
  const terms = offers.map(({ term }) => term);
  const uniqueTerms = new Set(terms);
  tag.dataset[Param.terms] = uniqueTerms.size === 1
    ? [...uniqueTerms][0]
    : terms.join(',');

  if (tag instanceof HTMLAnchorElement) {
    tag.href = url.toString();
    tag.style.display = null;
    tag.target = context.target;
  } else if (tag instanceof HTMLButtonElement) {
    tag.dataset[Param.url] = url.toString();
    tag.disabled = false;
  }

  tag.textContent = context.literals.ctaLabel;

  return tag;
}
