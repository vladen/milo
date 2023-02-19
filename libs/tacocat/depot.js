import constants from './constants.js';
import { isNil } from './utilities.js';

const { namespace } = constants;
const { defineProperty } = Object;

const hasOwnProperty = (object, property) => !isNil(object)
  && Object.prototype.hasOwnProperty.call(object, property);

/**
 * @param {number} index
 * @param {Element} element
 * @returns {Tacocat.Internal.Depot}
 */
const Depot = (index, element) => {
  if (!hasOwnProperty(element, namespace)) {
    defineProperty(element, namespace, {
      enumerable: true,
      value: {},
    });
  }

  return {
    delete() {
      delete element[namespace][index];
    },
    get state() {
      if (hasOwnProperty(element[namespace], index)) {
        return element[namespace][index];
      }
      return null;
    },
    set state(state) {
      if (!hasOwnProperty(element, namespace)) {
        defineProperty(element, namespace, {
          enumerable: true,
          value: {},
        });
      }
      defineProperty(element, namespace, {
        configurable: true,
        enumerable: true,
        value: Object.seal(state),
      });
    },
  };
};

export default Depot;
