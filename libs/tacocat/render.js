import Log from './log.js';
import safe from './safe.js';
import { isProduct } from './product.js';
import { isFunction, isUndefined } from './utilities.js';

const log = Log.common.module('render');

/**
 * @param {Tacocat.Internal.Renderers[]} renderers
 * @returns {Tacocat.Internal.Renderer}
 */
const Render = (renderers) => {
  const groups = {
    /** @type {Tacocat.Internal.Renderer[]} */
    pending: [],
    /** @type {Tacocat.Internal.Renderer[]} */
    rejected: [],
    /** @type {Tacocat.Internal.Renderer[]} */
    resolved: [],
  };

  renderers.forEach(({ pending, rejected, resolved }) => {
    [pending].flat(2).forEach((renderer) => {
      if (isFunction(renderer)) groups.pending.push(renderer);
    });
    [rejected].flat(2).forEach((renderer) => {
      if (isFunction(renderer)) groups.rejected.push(renderer);
    });
    [resolved].flat(2).forEach((renderer) => {
      if (isFunction(renderer)) groups.resolved.push(renderer);
    });
  });

  log.debug('Created:', { renderers: Object.values(groups) });

  return (element, product) => {
    let group;
    let result;

    if (isUndefined(product)) group = groups.pending;
    else if (isProduct(product)) group = groups.resolved;
    else group = groups.rejected;

    group.every((renderer) => {
      // @ts-ignore
      result = safe('', () => renderer(element, product), log);
      return !isUndefined(result);
    });

    log.debug('Rendered:', { element, product, renderers: group });

    return result;
  };
};

export default Render;
