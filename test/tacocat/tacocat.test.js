/// <reference path="../../libs/tacocat/types.d.ts" />
/// <reference path="../../libs/tacocat/wcs/types.d.ts" />
import { readFile } from '@web/test-runner-commands';
import Tacocat, { Util } from '../../libs/tacocat/index.js';
import Wcs from '../../libs/tacocat/wcs/index.js';
import { createTag } from '../../libs/utils/utils.js';
import { namespace } from '../../libs/tacocat/constants.js';

const ostBaseUrl = 'https://milo.adobe.com//tools/ost?';

async function mockHtmlDocument() {
  const html = await readFile('./mocks/placeholders.html');
  // eslint-disable-next-line no-template-curly-in-string
  document.body.innerHTML = html.replaceAll('${ostBaseUrl}', ostBaseUrl);
}

/**
 * @param {Tacocat.Wcs.CheckoutPlaceholderContext} context
 * @param {Tacocat.Wcs.Offer[]} offers
 */
async function mockCheckoutUrl(context, ...offers) {
  const url = new URL('https://commerce.adobe.com');
  url.searchParams.append('cli', context.client);
  url.searchParams.append('co', context.country);
  url.searchParams.append('lang', context.language);
  offers.forEach((offer, index) => {
    const prefix = `items[${index}]`;
    url.searchParams.append(`${prefix}[q]`, context.quantities[index] ?? 1);
    url.searchParams.append(`${prefix}[id]`, offer.offerId);
  });
  Object.entries(context.extra).forEach(
    (key, value) => url.searchParams.append(key, value),
  );
  return url.toString();
}

/**
 * @param {Tacocat.Wcs.OsisContext[]} contexts
 * @returns {Promise<
 *  Tacocat.Resolution<Tacocat.Wcs.OsisContext, { offers: Tacocat.Wcs.Offer[] }>
 * >[]}
 */
async function mockWcsProvider(contexts) {
  const mock = JSON.parse(await readFile('./mocks/offers.json'));
  return contexts.map(
    (context) => new Promise(
      (resolve, reject) => {
        context.country = (context.country ?? 'US').toUpperCase();
        /** @type {Tacocat.Wcs.Offer[]} */
        const offers = mock[context.country]?.resolvedOffers.filter(
          ({ offerSelectorIds }) => context.osis.some(
            (osi) => offerSelectorIds?.includes(osi),
          ),
        ) ?? [];
        if (offers.length) {
          offers.every(
            (candidate) => {
              if (context.language !== candidate) {
                context.language = 'mult';
                return false;
              }
              return true;
            },
          );
          resolve(Util.setContext({ offers }, context));
        } else {
          reject(Util.setContext(new Error(`Offer not found: ${context.osi}`), context));
        }
      },
    ),
  );
}

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
  });
  beforeEach(async () => {
    document.body.innerHTML = await mockHtmlDocument();
  });

  it('processes placeholders present in DOM', async () => {
    // on pending, replace a with comment
    // on resolved, replace comment with price markup or CTA href
    // on rejected, replace comment with another comment
    const checkouts = Tacocat
      .select(
        `a[href^="${ostBaseUrl}"]`,
        Wcs.matchTemplateParam('checkout'),
      )
      .extract((context) => Promise.resolve({
        ...context,
        literals: Wcs.tryParseCheckoutLiterals(
          document.getElementById(`${namespace}-price-literals`),
        ),
      }))
      .extract((context) => Wcs.setLocale(context))
      .extract((context, element) => Promise.resolve({
        ...context,
        ...Wcs.parseCheckoutHrefParams(element),
      }))
      .provide(mockWcsProvider)
      .present(Tacocat.Stage.stale, (element) => {
        const span = createTag('span');
        span.dataset = Object.fromEntries(Util.parseHrefParams(element).entries());
        element.replaceWith(span);
        return span;
      })
      .present(Tacocat.Stage.rejected, (element) => {
        const span = createTag('span', {}, '...');
        element.replaceWith(span);
        return span;
      })
      .present(Tacocat.Stage.resolved, (element, { context, offers }) => {
        const href = mockCheckoutUrl(context, ...offers);
        /** @type {Element} */
        let tag;
        if (context.template === 'checkoutButton') {
          tag = createTag('button', { class: 'checkout' }, context.literals.ctaLabel);
          tag.addEventListener('click', () => {
            window.location.assign(href);
          });
        } else {
          tag = createTag('a', { href }, context.literals.ctaLabel);
        }
        element.replaceWith(tag);
        return tag;
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
      .provide(mockWcsProvider)
      .present(Tacocat.Stage.stale, (element) => {
        const span = createTag('span');
        span.dataset = Object.fromEntries(Util.parseHrefParams(element).entries());
        element.replaceWith(span);
        return span;
      })
      .present(Tacocat.Stage.rejected, (element) => {
        element.textContent = '...';
      })
      .present(Tacocat.Stage.resolved, (element, { context, offers: [offer] }) => {
        /** @type {Element} */
        let tag;
        if (context.template === 'price' || context.template === 'priceOptical') {
          tag = createTag('span', { }, offer.priceDetails.price);
        } else if (context.template === 'priceStrikethrough') {
          tag = createTag('s', {}, offer.priceDetails.price);
        }
        if (tag) {
          if (context.recurrence && context.literals.recurrenceLabel) {
            tag.textContent += ` ${context.literals.recurrenceLabel}`;
          }
          if (context.unit && context.literals.perUnitLabel) {
            tag.textContent += ` ${context.literals.perUnitLabel}`;
          }
          tag.classList.add(context.template);
          element.replaceWith(tag);
          return tag;
        }
        element.textContent = '...';
        return element;
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
});
