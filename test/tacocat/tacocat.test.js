import { expect } from './tools.js';
import Log, { quietFilter } from '../../libs/tacocat/log.js';
import Tacocat from '../../libs/tacocat/tacocat.js';
import { delay } from '../../libs/tacocat/utilities.js';

describe('function "Tacocat"', () => {
  let controller = new AbortController();

  after(() => {
    Log.reset();
  });

  before(() => {
    Log.use(quietFilter);
  });

  afterEach(() => {
    document.body.innerHTML = '';
    controller.abort();
    controller = new AbortController();
  });

  it.only('processes placeholders existed in the DOM', async () => {
    document.body.innerHTML = `
      <a href="https://sidekick.milo.adobe.com/plugin/wcs?osi=abc123&type=price">???</a>
    `;

    Tacocat(controller.signal)
      .declare({})
      .extract((context, element) => Object.fromEntries([
        ...new URL(element.href).searchParams.entries(),
      ]), { childList: true })
      .provide((_, contexts) => contexts.map((context) => ({ context, value: 'test' })))
      .render({
        pending(element) {
          element.textContent = '...';
        },
        rejected(element) {
          element.textContent = '---';
        },
        resolved(element, product) {
          Object.entries(product.context).forEach(([key, value]) => {
            element.href = '#';
            element.dataset[key] = value;
            element.textContent = '+++';
          });
          element.setAttribute('value', product.value);
        },
      })
      .observe(document.body, 'a[href*="sidekick.milo.adobe.com/plugin/wcs"');

    await delay(10);
    expect(document.body.innerHTML.trim()).to.equal(`
      <a href="#" data-osi="abc123" data-type="price" value="test">+++</a>
    `.trim());
  });

  it('updates placeholder on attribute change', () => {

  });

  it('updates placeholder on text change', () => {

  });

  it('updates placeholder on child element addition', () => {

  });

  it('updates placeholder on descendant element addition', () => {

  });

  it('updates placeholder on child element removal', () => {

  });

  it('updates placeholder on descendant element removal', () => {

  });

  describe('returned object', () => {
    describe('method "explore"', () => {
      it('returns array of placeholders located within the provided scope', async () => {

      });
    });

    describe('method "refresh"', () => {
    });

    describe('method "resolve"', () => {
      it('returns promise resolving to the provided value', async () => {
        const value = 'test';
        const context = { test: value };

        const engine = Tacocat(controller.signal)
          .declare(context)
          .extract((ctx) => ctx, { childList: true })
          .provide((_, contexts) => contexts.map(() => ({ context, value })))
          .render({})
          .observe(document.body);

        const product = await engine.resolve(context);
        expect(product).to.deep.equal({ context, value });
      });
    });
  });
});
