import {
  extractCheckoutDataset,
  extractCheckoutHref,
  extractCheckoutLiterals,
  extractCheckoutSettings,
  validateCheckoutContext,
} from './checkout.js';
import {
  extractPriceDataset,
  extractPriceHref,
  extractPriceLiterals,
  extractPriceSettings,
  validatePriceContext,
} from './price.js';

export default {
  Checkout: {
    dataset: extractCheckoutDataset,
    href: extractCheckoutHref,
    literals: extractCheckoutLiterals,
    settings: extractCheckoutSettings,
    validate: validateCheckoutContext,
  },
  Price: {
    dataset: extractPriceDataset,
    href: extractPriceHref,
    literals: extractPriceLiterals,
    settings: extractPriceSettings,
    validate: validatePriceContext,
  },
};
