import { isNil } from '../../util.js';
import { DatasetParam } from '../constant/index.js';

/**
 * Updates common Wcs data attributes on the placeholder element from tacocat context.
 * @type {Tacocat.Engine.PendingPresenter<Tacocat.Wcs.PlaceholderContext>}
 */
export function pendingPresenter({ element, context }) {
  const Param = DatasetParam.pending;
  element.dataset[Param.osis] = context.osis.join('\n');
  if (!isNil(context.promo)) {
    element.dataset[Param.promo] = context.promo;
  }
  element.dataset[Param.template] = context.template;
  return element;
}

/**
 * Sets text content of the placeholder element to '...'
 * and appends HTML comment with error message to it.
 * @type {Tacocat.Engine.RejectedPresenter<Tacocat.Wcs.PlaceholderContext>}
 */
export function rejectedPresenter({ element, result }) {
  element.textContent = '...';
  if (result.message) element.append(new Comment(result.message));
  return element;
}
