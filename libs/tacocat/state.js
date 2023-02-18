import Log from './log.js';
import { getStage } from './result.js';

const { namespace } = Log.common;

/**
 * @param {Element} element
 */
export function deletePlaceholderState(element) {
  delete element[namespace];
}

/**
 * @param {Element} element
 * @returns {Tacocat.Internal.State}
 */
export const getPlaceholderState = (element) => element[namespace] ?? {};

/**
 * @param {Element} element
 * @param {Tacocat.Internal.State} state
 */
export function setPlaceholderState(element, state = {}) {
  if (!Object.prototype.hasOwnProperty.call(element, namespace)) {
    element[namespace] = {
      get stage() {
        return getStage(this);
      },
    };
  }
  return Object.assign(element[namespace], state);
}
