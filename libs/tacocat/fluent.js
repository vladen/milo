import Control from './control.js';
import Declare from './declare.js';
import Engine from './engine.js';
import Extract from './extract.js';
import Observe from './observe.js';
import Provide from './provide.js';
import Present from './present.js';
import Subtree from './subtree.js';

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.SafeExtractor} extractor
 * @param {Tacocat.Internal.SafeObserver} observer
 * @param {Tacocat.Internal.SafeProvider} provider
 * @param {Tacocat.Internal.SafePresenter} renderer
 * @param {Tacocat.Internal.Subtree} subtree
 * @returns
 */
const observe = (control, extractor, observer, provider, renderer, subtree) => ({
  ...Engine(
    control,
    extractor,
    observer,
    provider,
    renderer,
    subtree,
  ),
  observe(scope, selector) {
    return observe(
      control,
      extractor,
      observer,
      provider,
      renderer,
      Subtree(scope, selector),
    );
  },
});

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.SafeExtractor} extractor
 * @param {Tacocat.Internal.SafeObserver} observer
 * @param {Tacocat.Internal.SafeProvider} provider
 * @param {Tacocat.Internal.Presenters[]} renderers
 * @returns
 */
const render = (control, extractor, observer, provider, renderers = []) => ({
  observe(scope, selector) {
    return observe(
      control,
      extractor,
      observer,
      provider,
      Present(renderers),
      Subtree(scope, selector),
    );
  },
  render(nextRenderers) {
    return render(
      control,
      extractor,
      observer,
      provider,
      [...renderers, nextRenderers],
    );
  },
});

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.SafeExtractor} extractor
 * @param {Tacocat.Internal.SafeObserver} observer
 * @param {Tacocat.Internal.Provider} provider
 * @param {Tacocat.Internal.Transformer[]} transformers
 */
const transform = (control, extractor, observer, provider, transformers = []) => ({
  transform(transformer) {
    return transform(
      control,
      extractor,
      observer,
      provider,
      [...transformers, transformer],
    );
  },
  render(renderers) {
    return render(
      control,
      extractor,
      observer,
      Provide(control, provider, transformers),
      [renderers],
    );
  },
});

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.SafeDeclarer} declarer
 * @param {Tacocat.Internal.Extractor[]} extractors
 * @param {Tacocat.Engine.Reactions[]} options
 */
const extract = (control, declarer, extractors, options = []) => ({
  extract(nextExtractor, nextOptions) {
    return extract(
      control,
      declarer,
      [...extractors, nextExtractor],
      [...options, nextOptions],
    );
  },
  provide(provider) {
    return transform(
      control,
      Extract(declarer, extractors),
      Observe(control, options),
      provider,
    );
  },
});

/**
 * @param {Tacocat.Internal.Control} control
 * @param {Tacocat.Internal.Declarer[]} declarers
 */
const declare = (control, declarers) => ({
  declare(declarer) {
    return declare(
      control,
      [...declarers, declarer],
    );
  },
  extract(extractor, options) {
    return extract(
      control,
      Declare(declarers),
      [extractor],
      [options],
    );
  },
});

/**
 * @type {Tacocat.Engine.Builder}
 */
const Tacocat = (signal, timeout) => ({
  declare(declarer) {
    return declare(
      Control({ signal, timeout }),
      [declarer],
    );
  },
});

export default Tacocat;
