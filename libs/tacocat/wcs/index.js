import { getLocale } from './locale.js';
import Constant from './constants.js';
import Parser from './parsers/index.js';
import Template from './templates/index.js';
import { matchTemplateDatasetParam, matchTemplateHrefParam } from './utils.js';

export default {
  getLocale,
  matchTemplateDatasetParam,
  matchTemplateHrefParam,
  Constant,
  Parser,
  Template,
};
