import { qualifyDatasetAttribute, qualifyDatasetName, Stage } from '../../constant.js';

export const namespace = 'wcs';

export const ostBaseUrl = 'https://milo.adobe.com/tools/ost';

export const Key = {
  analytics: 'analytics',
  cli: 'cli',
  client: 'client',
  checkout: 'checkout',
  checkoutButton: 'checkoutButton',
  checkoutLink: 'checkoutLink',
  commitment: 'commitment',
  commitments: 'commitments',
  co: 'co',
  cs: 'cs',
  format: 'format',
  id: 'id',
  lang: 'lang',
  literals: 'literals',
  offer: 'offer',
  offers: 'offers',
  osi: 'osi',
  osis: 'osis',
  ost: 'ost',
  price: 'price',
  priceOptical: 'priceOptical',
  priceStrikethrough: 'priceStrikethrough',
  promo: 'promo',
  q: 'q',
  quantity: 'quantity',
  quantities: 'quantities',
  recurrence: 'recurrence',
  settings: 'settings',
  step: 'step',
  target: 'target',
  tax: 'tax',
  template: 'template',
  term: 'term',
  terms: 'terms',
  unit: 'unit',
  url: 'url',
};

/**
 * @type {Tacocat.Engine.Reactions}
 */
export const DatasetReactions = {
  mutations: {
    attributeFilter: [
      qualifyDatasetAttribute(namespace, Key.osi),
      qualifyDatasetAttribute(namespace, Key.osis),
      qualifyDatasetAttribute(namespace, Key.promo),
      qualifyDatasetAttribute(namespace, Key.template),
    ],
  },
};

export const DatasetParam = {
  [Stage.pending]: {
    osi: qualifyDatasetName(namespace, Key.osi),
    osis: qualifyDatasetName(namespace, Key.osis),
    promo: qualifyDatasetName(namespace, Key.promo),
    template: qualifyDatasetName(namespace, Key.template),
  },
  [Stage.resolved]: { analytics: qualifyDatasetName(namespace, Key.analytics) },
};

export default {
  DatasetParam,
  DatasetReactions,
  Key,
  namespace,
  ostBaseUrl,
};
