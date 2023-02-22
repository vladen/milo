import { expect } from './tools.js';
import Log, { quietFilter } from '../../libs/tacocat/log.js';
import tacocat from '../../libs/tacocat/tacocat.js';

describe.skip('tacocat pipeline', () => {
  after(() => {
    Log.reset();
  });
  before(() => {
    Log.use(quietFilter);
  });

  it('processes static DOM', async () => {
    const placeholders = tacocat
      .define({})
      .extract(
        (_, element) => Promise.resolve({ test: element.getAttribute('context') }),
      )
      .provide(
        (contexts) => Promise.resolve(contexts.map((context) => ({
          context,
          product: `${context.test}-product`,
        }))),
      )
      .present(tacocat.stage.resolved, (element, { product }) => {
        element.setAttribute('product', product);
      })
      .observe(document.body, 'p')
      .explore();

    await Promise.all(
      placeholders.map((placeholder) => placeholder.wait(tacocat.stage.resolved)),
    );

    placeholders.forEach((placeholder) => {
      expect(placeholder.element.getAttribute('product')).toBe(
        `${placeholder.element.getAttribute('context')}-product`,
      );
    });
  });
});
