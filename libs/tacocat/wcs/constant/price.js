import Common, { Key, namespace, ostBaseUrl } from './common.js';
import { Stage } from '../../constant.js';
import { qualifyCssName, qualifyDataAttribute, qualifyJsName } from '../../util.js';

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
      qualifyDataAttribute(namespace, Key.format),
      qualifyDataAttribute(namespace, Key.recurrence),
      qualifyDataAttribute(namespace, Key.tax),
      qualifyDataAttribute(namespace, Key.unit),
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
    format: qualifyJsName(namespace, Key.format),
    recurrence: qualifyJsName(namespace, Key.recurrence),
    tax: qualifyJsName(namespace, Key.tax),
    unit: qualifyJsName(namespace, Key.unit),
  },
  [Stage.resolved]: {
    // eslint-disable-next-line import/no-named-as-default-member
    ...Common.DatasetParam[Stage.resolved],
    commitment: qualifyJsName(namespace, Key.commitment),
    offer: qualifyJsName(namespace, Key.offer),
    term: qualifyJsName(namespace, Key.term),
  },
};

export default {
  CssClass,
  CssSelector,
  DatasetParam,
  DatasetReactions,
};
