import { DatasetParam } from './constants.js';
import { parseHrefParams } from '../parsers.js';

/**
 * @param {string} template
 * @returns {(element: HTMLAnchorElement) => boolean}
 */
export const matchTemplateDatasetParam = (template) => (element) => !!element.dataset[
  DatasetParam.pending.template
]?.startsWith(template);

/**
 * @param {string} template
 * @returns {(element: HTMLAnchorElement) => boolean}
 */
// eslint-disable-next-line import/prefer-default-export
export const matchTemplateHrefParam = (template) => (element) => !!parseHrefParams(
  element,
).get('template')?.startsWith(template);
