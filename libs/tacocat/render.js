import Log from './log.js';
import { safeSync } from './safe.js';
import { isProduct } from './product.js';
import { isFunction, isUndefined } from './utilities.js';

const log = Log.common.module('render');

/**
 * @param {Tacocat.Internal.Renderers[]} renderers
 * @returns {Tacocat.Internal.SafeRenderer}
 */
const Render = (renderers) => {
  const groups = {
    /** @type {Tacocat.Internal.SafeRenderer[]} */
    pending: [],
    /** @type {Tacocat.Internal.SafeRenderer[]} */
    rejected: [],
    /** @type {Tacocat.Internal.SafeRenderer[]} */
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
      result = safeSync(log, 'Renderer callback error:', () => renderer(element, product));
      return !isUndefined(result);
    });

    log.debug('Rendered:', { element, product, renderers: group });

    return result;
  };
};

export default Render;
