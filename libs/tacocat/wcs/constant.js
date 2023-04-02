import { Stage, qualifyCssName, qualifyDatasetName } from '../constant.js';

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
  extra: 'extra',
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

export const DatasetParam = {
  [Stage.pending]: {
    extra: qualifyDatasetName(namespace, Key.extra),
    osi: qualifyDatasetName(namespace, Key.osi),
    osis: qualifyDatasetName(namespace, Key.osis),
    promo: qualifyDatasetName(namespace, Key.promo),
    template: qualifyDatasetName(namespace, Key.template),
  },
  [Stage.resolved]: { analytics: qualifyDatasetName(namespace, Key.analytics) },
};

export const CheckoutDatasetParam = {
  [Stage.pending]: {
    ...DatasetParam[Stage.pending],
    client: qualifyDatasetName(namespace, Key.client),
    promo: qualifyDatasetName(namespace, Key.promo),
    quantity: qualifyDatasetName(namespace, Key.quantity),
    quantities: qualifyDatasetName(namespace, Key.quantities),
    step: qualifyDatasetName(namespace, Key.step),
    target: qualifyDatasetName(namespace, Key.target),
  },
  [Stage.resolved]: {
    ...DatasetParam[Stage.resolved],
    commitments: qualifyDatasetName(namespace, Key.commitments),
    offers: qualifyDatasetName(namespace, Key.offers),
    terms: qualifyDatasetName(namespace, Key.terms),
    url: qualifyDatasetName(namespace, Key.url),
  },
};

export const CheckoutCssClass = {
  link: qualifyCssName(namespace, Key.ost, Key.checkout),
  placeholder: qualifyCssName(namespace, Key.checkout),
};

export const CheckoutCssSelector = {
  link: `a.${CheckoutCssClass.link}[href^="${ostBaseUrl}"]`,
  literals: `script.${qualifyCssName(namespace, Key.checkout, Key.literals)}`,
  placeholder: `a.${
    CheckoutCssClass.placeholder
  }, button.${
    CheckoutCssClass.placeholder
  }`,
  settings: `script.${qualifyCssName(namespace, Key.checkout, Key.settings)}`,
};

export const CheckoutTarget = {
  blank: '_blank',
  parent: '_parent',
  self: '_self',
  top: '_top',
};

export const PriceDatasetParam = {
  [Stage.pending]: {
    ...DatasetParam[Stage.pending],
    format: qualifyDatasetName(namespace, Key.format),
    recurrence: qualifyDatasetName(namespace, Key.recurrence),
    tax: qualifyDatasetName(namespace, Key.tax),
    unit: qualifyDatasetName(namespace, Key.unit),
  },
  [Stage.resolved]: {
    ...DatasetParam[Stage.resolved],
    commitment: qualifyDatasetName(namespace, Key.commitment),
    offer: qualifyDatasetName(namespace, Key.offer),
    term: qualifyDatasetName(namespace, Key.term),
  },
};

export const PriceCssClass = {
  link: qualifyCssName(namespace, Key.ost, Key.price),
  placeholder: qualifyCssName(namespace, Key.price),
};
export const PriceCssSelector = {
  link: `a.${PriceCssClass.link}[href^="${ostBaseUrl}"]`,
  literals: `script.${qualifyCssName(namespace, Key.price, Key.literals)}`,
  placeholder: `span.${
    PriceCssClass.placeholder
  }, s.${
    PriceCssClass.placeholder
  }`,
  settings: `script.${qualifyCssName(namespace, Key.price, Key.settings)}`,
};

export default {
  CheckoutTarget,
  CheckoutCssSelector,
  CheckoutDatasetParam,
  DatasetParam,
  Key,
  PriceCssSelector,
  PriceDatasetParam,
  namespace,
  ostBaseUrl,
};
