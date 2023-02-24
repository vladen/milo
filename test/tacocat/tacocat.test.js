import { expect } from './tools.js';
import Log, { consoleLogWriter } from '../../libs/tacocat/log.js';
import tacocat from '../../libs/tacocat/tacocat.js';

/*
  - processing DOM snapshot
    - breaks after immediate abort
  - tiggering by events
    - updates placeholders when event is dispatched
    - event data can be used in extractor
    - stops after abort
  - tiggering by mutations
    - updates placeholders when their attribute mutates
    - stops after abort
  - resilience
    - does not throw if extractor/provider/presenter throw
*/

describe('tacocat pipeline', () => {
  let container;

  after(() => {
    Log.reset();
  });
  afterEach(() => {
    document.body.remove(container);
    container = null;
  });
  before(() => {
    Log.use(consoleLogWriter);
    container = document.createElement('div');
    document.body.append(container);
  });

  it('processes placeholders present in DOM', async () => {
    container.innerHTML = `
      <p context="1"></p>
      <p context="2"></p>
    `;

    const placeholders = tacocat
      .define({})
      .extract(
        (context, element) => Promise.resolve({ test: element.getAttribute('context') }),
      )
      .provide(
        (contexts) => [],
        /*
        Promise.resolve(contexts.map((context) => ({
          context,
          product: `${context.test}-product`,
        }))),
        */
      )
      .present(tacocat.stage.resolved, (element, { product }) => {
        element.setAttribute('product', product);
      })
      .observe(container, 'p')
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
