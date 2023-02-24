import { namespace } from './constants.js';
import { hasOwnProperty } from './utilities.js';

const state$ = Symbol(`${namespace}:state`);

function initState(element) {
  if (!hasOwnProperty(element, state$)) {
    Object.defineProperty(element, state$, {
      enumerable: true,
      value: {},
    });
  }
}

/**
 * @param {string} key
 * @returns {Tacocat.Internal.Storage}
 */
const Storage = (key) => ({
  deleteState(element) {
    if (hasOwnProperty(element, state$)) delete element[state$][key];
  },
  getState(element) {
    initState(element);
    if (hasOwnProperty(element[state$], key)) {
      return element[state$][key];
    }
    return undefined;
  },
  setState(element, value) {
    initState(element);
    if (!hasOwnProperty(element, state$)) {
      Object.defineProperty(element, state$, {
        enumerable: true,
        value: {},
      });
    }
    Object.defineProperty(element[state$], key, {
      configurable: true,
      enumerable: true,
      value,
    });
  },
});

export default Storage;
