import { DatasetParam } from '../constant/index.js';
import { isNil } from '../../util.js';

/**
 * Updates common Wcs data attributes on the placeholder element from tacocat context.
 * @param {HTMLElement} element
 * @param {Tacocat.Contextful<Tacocat.Wcs.PlaceholderContext>} result
 */
export function pendingTemplate(element, { context }) {
  const Param = DatasetParam.pending;
  if (isNil(context.extra)) {
    delete element.dataset[Param.extra];
  } else {
    element.dataset[Param.extra] = JSON.stringify(context.extra);
  }
  element.dataset[Param.osis] = context.osis.join('\n');
  element.dataset[Param.template] = context.template;
  return element;
}

/**
 * Sets text content of the placeholder element to '...'
 * and appends HTML comment with error message to it.
 * @param {HTMLElement} element
 * @param {Tacocat.Wcs.CheckoutRejection | Tacocat.Wcs.PriceRejection} result
 */
export function rejectedTemplate(element, { message }) {
  element.textContent = '...';
  if (message) element.append(new Comment(message));
  return element;
}
