import Log from "./log";
import safe from "./safe";
import { isFunction, isUndefined } from "./utilities";

const log = Log.common.module('render');

/**
 * @param {Tacocat.Internal.Renderers[]} renderers
 * @returns {Tacocat.Internal.Renderer}
 */
const Render = (renderers) => {
  const groups = {
    pending: [],
    rejected: [],
    resolved: [],
  };

  for (const { pending, rejected, resolved } of renderers) {
    if (isFunction(pending)) groups.pending.push(pending);
    if (isFunction(rejected)) groups.rejected.push(rejected);
    if (isFunction(resolved)) groups.rejected.push(resolved);
  }

  // @ts-ignore
  return (element, product) => {
    let group;
    let result;

    if (isUndefined(product)) group = groups.pending;
    // @ts-ignore
    else if (isUndefined(product.value)) group = groups.rejected;
    else group = groups.resolved;

    for (const renderer of group) {
      result = safe('', () => renderer(element, product), log);
      if (!isUndefined(result)) break;
    }

    return result;
  };
};

export default Render;
