import { setLocale } from './locale.js';
import {
  matchTemplateParam,
  parseCheckoutHrefParams,
  parsePriceHrefParams,
  tryParseCheckoutLiterals,
  tryParseCheckoutSettings,
  tryParsePriceLiterals,
  tryParsePriceSettings,
} from './parsers.js';

export default {
  matchTemplateParam,
  parseCheckoutHrefParams,
  parsePriceHrefParams,
  setLocale,
  tryParseCheckoutLiterals,
  tryParseCheckoutSettings,
  tryParsePriceLiterals,
  tryParsePriceSettings,
};
