import { DatasetParam } from './constant/index.js';
import { parseHrefParams } from '../parser.js';

/**
 * @param {string} template
 * @returns {(element: HTMLAnchorElement) => boolean}
 */
export const templateDatasetParam = (template) => (element) => !!element.dataset[
  DatasetParam.pending.template
]?.startsWith(template);

/**
 * @param {string} template
 * @returns {(element: HTMLAnchorElement) => boolean}
 */
// eslint-disable-next-line import/prefer-default-export
export const templateHrefParam = (template) => (element) => !!parseHrefParams(
  element,
).get('template')?.startsWith(template);

export default {
  templateDatasetParam,
  templateHrefParam,
};
