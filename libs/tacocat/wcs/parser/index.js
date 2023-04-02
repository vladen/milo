import {
  parseCheckoutDataset,
  parseCheckoutHref,
  parseCheckoutLiterals,
  parseCheckoutSettings,
} from './checkout.js';
import {
  parsePriceDataset,
  parsePriceHref,
  parsePriceLiterals,
  parsePriceSettings,
} from './price.js';

export default {
  Checkout: {
    dataset: parseCheckoutDataset,
    href: parseCheckoutHref,
    literals: parseCheckoutLiterals,
    settings: parseCheckoutSettings,
  },
  Price: {
    dataset: parsePriceDataset,
    href: parsePriceHref,
    literals: parsePriceLiterals,
    settings: parsePriceSettings,
  },
};
