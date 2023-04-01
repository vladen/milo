import { expect } from './tools.js';
import Tacocat, { Utilility, Wcs } from '../../libs/tacocat/index.js';
import { createTag } from '../../libs/utils/utils.js';
import { namespace } from '../../libs/tacocat/constants.js';

const ostBaseUrl = 'https://milo.adobe.com//tools/ost?';

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
      <script id="tacocat-checkout-literals" type="application/json">
        {
          "label": "Buy now"
        }
      </script>
      <script id="tacocat-checkout-settings" type="application/json">
        {
          "client": "adobe",
          "workflow": "ucv3",
          "workflowStep": "email"
        }
      </script>
      <script id="tacocat-price-literals" type="application/json">
        {
          "perUnitLabel": "{perUnit, select, LICENSE {/seat} other {}}",
          "recurrenceLabel": "{recurrenceTerm, select, MONTH {/month} YEAR {/year} other {}}"
        }
      </script>
      <script id="tacocat-price-settings" type="application/json">
        {
          "format": "1",
          "tax": "0",
          "unit": "0"
        }
      </script>
      <a href="${ostBaseUrl}osi=1234&template=price&recurrence=1&unit=1&tax=1"></a>
      <a href="${ostBaseUrl}osi=2345&template=priceOptical&recurrence=1"></a>
      <a href="${ostBaseUrl}osi=3456&template=priceStrikethrough&format=0"></a>
      <a href="${ostBaseUrl}osi=3456&template=checkoutButton&workflowStep=recommendation"></a>
      <a href="${ostBaseUrl}osi=3456&template=checkoutLink&client=adobe-firefly"></a>
    `;
    // on pending, replace a with comment
    // on resolved, replace comment with price markup or CTA href
    // on rejected, replace comment with another comment
    const checkouts = Tacocat
      .select(
        `a[href^="${ostBaseUrl}"],a[href~="template=checkout"]`,
        Wcs.matchTemplateParam('checkout'),
      )
      .extract((context) => Promise.resolve({
        ...context,
        literals: Wcs.tryParseCheckoutLiterals(
          document.getElementById(`${namespace}-price-literals`),
        ),
      }))
      .extract((context, element) => Promise.resolve({
        ...context,
        ...Wcs.parseCheckoutHrefParams(element),
      }))
      .provide(
        (contexts) => Promise.resolve(
          contexts.map(
            (context) => Utilility.setContext({ href: '#' }, context),
          ),
        ),
      )
      .present(Tacocat.Stage.stale, (element) => {
        const span = createTag('span');
        span.dataset = Object.fromEntries(Wcs.parseHrefParams(element).entries());
        element.replaceWith(span);
        return span;
      })
      .present(Tacocat.Stage.rejected, (element) => {
        const span = createTag('span', {}, '...');
        element.replaceWith(span);
        return span;
      })
      .present(Tacocat.Stage.resolved, (element, { context, href }) => {
        const a = createTag('a', { href }, context.literals.ctaLabel);
        element.replaceWith(a);
        return a;
      });

    const prices = Tacocat
      .select(
        `a[href^="${ostBaseUrl}"]`,
        Wcs.matchTemplateParam('price'),
      )
      .extract((context) => Promise.resolve({
        ...context,
        literals: Wcs.tryParsePriceLiterals(
          document.getElementById(`${namespace}-price-literals`),
        ),
      }))
      .extract((context, element) => Promise.resolve({
        ...context,
        ...Wcs.parsePriceHrefParams(element),
      }))
      .provide(
        (contexts) => Promise.resolve(
          contexts.map(
            (context) => Utilility.setContext(
              { product: `${context.ost}-product` },
              context,
            ),
          ),
        ),
      )
      .present(Tacocat.Stage.stale, (element) => {
        const span = createTag('span');
        span.dataset = Object.fromEntries(Utilility.parseHrefParams(element).entries());
        element.replaceWith(span);
        return span;
      })
      .present(Tacocat.Stage.rejected, (element) => {
        element.textContent = '...';
      })
      .present(Tacocat.Stage.resolved, (element, product) => {
        element.textContent = `${product} ${product}`;
      });

    const placeholders = [
      ...checkouts.observe(container, controller.signal).explore(),
      ...prices.observe(container, controller.signal).explore(),
    ];

    await Promise.all(
      placeholders.map((placeholder) => placeholder.promise),
    );

    // TODO: snapshot test?
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
