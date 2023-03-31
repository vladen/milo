import { expect } from './tools.js';
import Tacocat from '../../libs/tacocat/index.js';

const ostBaseUrl = 'https://ost--milo--adobecom.hlx.page/tools/ost?';

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

describe.skip('tacocat pipeline', () => {
  /** @type {Element} */
  let container;
  /** @type {AbortController} */
  let controller;

  after(() => {
    controller.abort();
    Tacocat.Log.reset();
  });
  afterEach(() => {
    // document.body.remove(container);
    container = null;
  });
  before(() => {
    Tacocat.Log.use(Tacocat.Log.consoleWriter);
    controller = new AbortController();
    container = document.createElement('div');
    document.body.append(container);
  });

  it('processes placeholders present in DOM', async () => {
    container.innerHTML = `
      <a href="${ostBaseUrl}osi=1234&type=price"></a>
      <a href="${ostBaseUrl}osi=2345&type=priceOptical"></a>
      <a href="${ostBaseUrl}osi=3456&type=priceStrikethrough"></a>
    `;
    // on pending, replace a with comment
    // on resolved, replace comment with price markup or CTA href
    // on rejected, replace comment with another comment
  });

  it('processes placeholders present in DOM', async () => {
    container.innerHTML = `
      <p class="1" context="1"></p>
      <p class="2" context="2"></p>
    `;

    const placeholders = Tacocat
      .define({})
      .extract(
        (context, element) => Promise.resolve({ test: element.getAttribute('context') }),
      )
      .provide(
        (contexts) => Promise.resolve(contexts.map((context) => ({
          context,
          product: `${context.test}-product`,
        }))),
      )
      .present(Tacocat.Stage.rejected, (element, error) => {
        element.textContent = error.message;
      })
      .present(Tacocat.Stage.resolved, (element, { context, product }) => {
        element.textContent = `${context.test} ${product}`;
      })
      .observe(container, 'p', controller.signal)
      .explore();

    await Promise.all(
      placeholders.map((placeholder) => placeholder.promise),
    );

    placeholders.forEach(({ element }) => {
      expect(element.getAttribute('product')).toBe(
        `${element.getAttribute('context')}-product`,
      );
    });
  });
});
