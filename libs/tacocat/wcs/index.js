import { getLocale } from './locale.js';
import {
  matchTemplateParam,
  parseCheckoutHrefParams,
  parsePriceHrefParams,
  tryParseCheckoutLiterals,
  tryParseCheckoutSettings,
  tryParsePriceLiterals,
  tryParsePriceSettings,
} from './parsers.js';

import {
  DatasetKey,
  checkoutTemplate,
  priceTemplate,
  rejectedTemplate,
  staleTemplate,
} from './templates.js';

export default {
  DatasetKey,
  checkoutTemplate,
  getLocale,
  matchTemplateParam,
  parseCheckoutHrefParams,
  parsePriceHrefParams,
  priceTemplate,
  rejectedTemplate,
  staleTemplate,
  tryParseCheckoutLiterals,
  tryParseCheckoutSettings,
  tryParsePriceLiterals,
  tryParsePriceSettings,
};
