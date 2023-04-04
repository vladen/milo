import Common, { Key, namespace, ostBaseUrl } from './common.js';
import { Stage } from '../../constant.js';
import { qualifyCssName, qualifyDataAttribute, qualifyJsName } from '../../util.js';

export const CssClass = {
  link: qualifyCssName(namespace, Key.ost, Key.checkout),
  placeholder: qualifyCssName(namespace, Key.checkout),
};

export const CssSelector = {
  link: `a.${CssClass.link}[href^="${ostBaseUrl}"]`,
  literals: `script.${qualifyCssName(namespace, Key.checkout, Key.literals)}`,
  placeholder: `a.${
    CssClass.placeholder
  }, button.${
    CssClass.placeholder
  }`,
  settings: `script.${qualifyCssName(namespace, Key.checkout, Key.settings)}`,
};

/**
 * @type {Tacocat.Engine.Reactions}
 */
export const DatasetReactions = {
  mutations: {
    attributeFilter: [
      // eslint-disable-next-line import/no-named-as-default-member
      ...Common.DatasetReactions.mutations.attributeFilter,
      qualifyDataAttribute(namespace, Key.promo),
      qualifyDataAttribute(namespace, Key.quantity),
      qualifyDataAttribute(namespace, Key.quantities),
      qualifyDataAttribute(namespace, Key.step),
      qualifyDataAttribute(namespace, Key.target),
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
    client: qualifyJsName(namespace, Key.client),
    promo: qualifyJsName(namespace, Key.promo),
    quantity: qualifyJsName(namespace, Key.quantity),
    quantities: qualifyJsName(namespace, Key.quantities),
    step: qualifyJsName(namespace, Key.step),
    target: qualifyJsName(namespace, Key.target),
  },
  [Stage.resolved]: {
    // eslint-disable-next-line import/no-named-as-default-member
    ...Common.DatasetParam[Stage.resolved],
    commitments: qualifyJsName(namespace, Key.commitments),
    offers: qualifyJsName(namespace, Key.offers),
    terms: qualifyJsName(namespace, Key.terms),
    url: qualifyJsName(namespace, Key.url),
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
