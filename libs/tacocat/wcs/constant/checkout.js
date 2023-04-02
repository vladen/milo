import Common, { Key, namespace, ostBaseUrl } from './common.js';
import { Stage, qualifyCssName, qualifyDatasetAttribute, qualifyDatasetName } from '../../constant.js';

export const CssClass = {
  link: qualifyCssName(namespace, Key.ost, Key.checkout),
  placeholder: qualifyCssName(namespace, Key.checkout),
};

export const CssSelector = {
  link: `a.${CssClass.link}[href^="${ostBaseUrl}"]`,
  literals: `script.${qualifyCssName(namespace, Key.checkout, Key.literals)}`,
  placeholder: `a.${CssClass.placeholder
  }, button.${CssClass.placeholder
  }`,
  settings: `script.${qualifyCssName(namespace, Key.checkout, Key.settings)}`,
};

/**
 * @type {Tacocat.Engine.Reactions}
 */
export const DatasetReactions = {
  mutations: {
    attributeFilter: [
      ...Common.DatasetReactions.mutations.attributeFilter,
      qualifyDatasetAttribute(namespace, Key.promo),
      qualifyDatasetAttribute(namespace, Key.quantity),
      qualifyDatasetAttribute(namespace, Key.quantities),
      qualifyDatasetAttribute(namespace, Key.step),
      qualifyDatasetAttribute(namespace, Key.target),
    ],
    attributes: true,
    childList: true,
    subtree: true,
  },
};

export const DatasetParam = {
  [Stage.pending]: {
    ...Common.DatasetParam[Stage.pending],
    client: qualifyDatasetName(namespace, Key.client),
    promo: qualifyDatasetName(namespace, Key.promo),
    quantity: qualifyDatasetName(namespace, Key.quantity),
    quantities: qualifyDatasetName(namespace, Key.quantities),
    step: qualifyDatasetName(namespace, Key.step),
    target: qualifyDatasetName(namespace, Key.target),
  },
  [Stage.resolved]: {
    ...Common.DatasetParam[Stage.resolved],
    commitments: qualifyDatasetName(namespace, Key.commitments),
    offers: qualifyDatasetName(namespace, Key.offers),
    terms: qualifyDatasetName(namespace, Key.terms),
    url: qualifyDatasetName(namespace, Key.url),
  },
};

export const Target = {
  blank: '_blank',
  parent: '_parent',
  self: '_self',
  top: '_top',
};

export default {
  CssClass,
  CssSelector,
  DatasetParam,
  DatasetReactions,
  Target,
};
