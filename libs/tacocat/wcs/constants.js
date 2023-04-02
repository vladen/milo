import { Stage, qualify } from '../constants.js';

/**
 * @param {string[]} keys
 */
const makeDatasetSelector = (...keys) => keys.reduce(
  (selector, key) => `${selector}[data-${key}]`,
  '',
);

export const namespace = 'wcs';

export const Key = {
  analytics: 'analytics',
  cli: 'cli',
  client: 'client',
  checkout: 'checkout',
  checkoutButton: 'checkoutButton',
  checkoutLink: 'checkoutLink',
  commitment: 'commitment',
  commitments: 'commitments',
  cs: 'cs',
  extra: 'extra',
  format: 'format',
  id: 'id',
  literals: 'literals',
  offer: 'offer',
  offers: 'offers',
  osi: 'osi',
  osis: 'osis',
  ost: 'ost',
  price: 'price',
  priceOptical: 'priceOptical',
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
    extra: qualify(namespace, Key.extra),
    template: qualify(namespace, Key.template),
  },
  [Stage.resolved]: { analytics: qualify(namespace, Key.analytics) },
};

export const CheckoutDatasetParam = {
  [Stage.pending]: {
    ...DatasetParam[Stage.pending],
    client: qualify(namespace, Key.client),
    osi: qualify(namespace, Key.osi),
    osis: qualify(namespace, Key.osis),
    quantity: qualify(namespace, Key.quantity),
    quantities: qualify(namespace, Key.quantities),
    step: qualify(namespace, Key.step),
    target: qualify(namespace, Key.target),
  },
  [Stage.resolved]: {
    ...DatasetParam[Stage.resolved],
    commitments: qualify(namespace, Key.commitments),
    offers: qualify(namespace, Key.offers),
    terms: qualify(namespace, Key.terms),
    url: qualify(namespace, Key.url),
  },
};

export const CheckoutCssClass = {
  link: qualify(namespace, Key.ost, Key.checkout),
  placeholder: qualify(namespace, Key.checkout),
};

export const CheckoutCssSelector = {
  link: `a.${CheckoutCssClass.link}`,
  literals: `script.${qualify(namespace, Key.checkout, Key.literals)}`,
  placeholder: `a.${
    CheckoutCssClass.placeholder
  }, button${
    CheckoutCssClass.placeholder
  }`,
  settings: `script.${qualify(namespace, Key.checkout, Key.settings)}`,
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
    format: qualify(namespace, Key.format),
    osi: qualify(namespace, Key.osi),
    recurrence: qualify(namespace, Key.recurrence),
    tax: qualify(namespace, Key.tax),
    unit: qualify(namespace, Key.unit),
  },
  [Stage.resolved]: {
    ...DatasetParam[Stage.resolved],
    commitment: qualify(namespace, Key.commitment),
    offer: qualify(namespace, Key.offer),
    term: qualify(namespace, Key.term),
  },
};

export const PriceCssClass = {
  link: qualify(namespace, Key.ost, Key.price),
  placeholder: qualify(namespace, Key.price),
};
export const PriceCssSelector = {
  link: `a.${PriceCssClass.link}`,
  literals: `script.${qualify(namespace, Key.price, Key.literals)}`,
  placeholder: `span.${PriceCssClass.link}`,
  settings: `script.${qualify(namespace, Key.price, Key.settings)}`,
};

export default {
  CheckoutTarget,
  CheckoutCssSelector,
  CheckoutDatasetParam,
  DatasetParam,
  namespace,
  Key,
  PriceCssSelector,
  PriceDatasetParam,
};
