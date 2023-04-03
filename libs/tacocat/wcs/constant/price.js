import Common, { Key, namespace, ostBaseUrl } from './common.js';
import { Stage, qualifyCssName, qualifyDatasetAttribute, qualifyDatasetName } from '../../constant.js';

export const CssClass = {
  link: qualifyCssName(namespace, Key.ost, Key.price),
  placeholder: qualifyCssName(namespace, Key.price),
};

export const CssSelector = {
  link: `a.${CssClass.link}[href^="${ostBaseUrl}"]`,
  literals: `script.${qualifyCssName(namespace, Key.price, Key.literals)}`,
  placeholder: `span.${
    CssClass.placeholder
  }, s.${
    CssClass.placeholder
  }`,
  settings: `script.${qualifyCssName(namespace, Key.price, Key.settings)}`,
};

/**
 * @type {Tacocat.Engine.Reactions}
 */
export const DatasetReactions = {
  mutations: {
    attributeFilter: [
      // eslint-disable-next-line import/no-named-as-default-member
      ...Common.DatasetReactions.mutations.attributeFilter,
      qualifyDatasetAttribute(namespace, Key.format),
      qualifyDatasetAttribute(namespace, Key.recurrence),
      qualifyDatasetAttribute(namespace, Key.tax),
      qualifyDatasetAttribute(namespace, Key.unit),
    ],
    attributes: true,
    childList: true,
    subtree: true,
  },
};

export const DatasetParam = {
  [Stage.pending]: {
    // eslint-disable-next-line import/no-named-as-default-member
    ...Common.DatasetParam[Stage.pending],
    format: qualifyDatasetName(namespace, Key.format),
    recurrence: qualifyDatasetName(namespace, Key.recurrence),
    tax: qualifyDatasetName(namespace, Key.tax),
    unit: qualifyDatasetName(namespace, Key.unit),
  },
  [Stage.resolved]: {
    // eslint-disable-next-line import/no-named-as-default-member
    ...Common.DatasetParam[Stage.resolved],
    commitment: qualifyDatasetName(namespace, Key.commitment),
    offer: qualifyDatasetName(namespace, Key.offer),
    term: qualifyDatasetName(namespace, Key.term),
  },
};

export default {
  CssClass,
  CssSelector,
  DatasetParam,
  DatasetReactions,
};
