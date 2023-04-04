import { Stage } from '../../constant.js';
import { qualifyDataAttribute, qualifyJsName } from '../../util.js';

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
  promoid: 'promoid',
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
      qualifyDataAttribute(namespace, Key.osi),
      qualifyDataAttribute(namespace, Key.osis),
      qualifyDataAttribute(namespace, Key.promo),
      qualifyDataAttribute(namespace, Key.template),
    ],
  },
};

export const DatasetParam = {
  [Stage.pending]: {
    osi: qualifyJsName(namespace, Key.osi),
    osis: qualifyJsName(namespace, Key.osis),
    promo: qualifyJsName(namespace, Key.promo),
    template: qualifyJsName(namespace, Key.template),
  },
  [Stage.resolved]: { analytics: qualifyJsName(namespace, Key.analytics) },
};

export default {
  DatasetParam,
  DatasetReactions,
  Key,
  namespace,
  ostBaseUrl,
};
