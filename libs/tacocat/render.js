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

  log.debug('Created:', { renderers: groups });

  return (element, result) => {
    let group;

    if (isUndefined(result)) group = groups.pending;
    else if (isProduct(result)) group = groups.resolved;
    else group = groups.rejected;

    const rendered = group.filter((renderer) => safeSync(
      log,
      'Renderer callback error:',
      () => renderer(element, result),
    ));
    if (renderers.length) {
      log.debug('Rendered:', { element, result, renderers: rendered });
    } else {
      log.debug('Not rendered:', { element, result });
    }
  };
};

export default Render;
