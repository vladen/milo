import { namespace } from './constants.js';
import { hasOwnProperty } from './utilities.js';

const { defineProperty } = Object;

function initState(element) {
  if (!hasOwnProperty(element, namespace)) {
    defineProperty(element, namespace, {
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
    delete element[namespace][key];
  },
  getState(element) {
    initState(element);
    if (hasOwnProperty(element[namespace], key)) {
      return element[namespace][key];
    }
    return null;
  },
  setState(element, value) {
    initState(element);
    if (!hasOwnProperty(element, namespace)) {
      defineProperty(element, namespace, {
        enumerable: true,
        value: {},
      });
    }
    defineProperty(element[namespace], key, {
      configurable: true,
      enumerable: true,
      value,
    });
  },
});

export default Storage;
