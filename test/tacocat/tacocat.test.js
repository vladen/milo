/// <reference path="../../libs/tacocat/types.d.ts" />
/// <reference path="../../libs/tacocat/wcs/types.d.ts" />
import { readFile } from '@web/test-runner-commands';
import Tacocat, { Utils } from '../../libs/tacocat/index.js';
import Wcs from '../../libs/tacocat/wcs/index.js';
import { expect } from './tools.js';

let wcsMock;
const ostBaseUrl = 'https://milo.adobe.com/tools/ost?';

async function mockWcs() {
  if (!wcsMock) {
    wcsMock = JSON.parse(await readFile('./mocks/offers.json'));
  }
  return wcsMock;
}

async function mockHtmlDocument() {
  const html = await readFile('./mocks/placeholders.html');
  // eslint-disable-next-line no-template-curly-in-string
  document.body.innerHTML = html.replaceAll('${ostBaseUrl}', ostBaseUrl);
}

/**
 * @param {Tacocat.Wcs.OsisContext[]} contexts
 * @returns {Promise<
 *  Tacocat.Resolution<Tacocat.Wcs.OsisContext, { offers: Tacocat.Wcs.Offer[] }>
 * >[]}
 */
async function mockWcsProvider(contexts) {
  const mock = await mockWcs();
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
          resolve(Utils.setContext({ offers }, context));
        } else {
          reject(Utils.setContext(new Error(`Offer not found: ${context.osi}`), context));
        }
      },
    ),
  );
}

const checkoutOstLinkPipeline = Tacocat
  .select(
    Wcs.Constant.CheckoutCssSelector.link,
    Wcs.matchTemplateHrefParam('checkout'),
  )
  .extract((_, element) => Wcs.Parser.parseCheckoutHref(element))
  .extract((_, element) => Wcs.Parser.parseCheckoutLiterals(element))
  .extract(() => Wcs.getLocale())
  .provide(mockWcsProvider)
  .stale(Wcs.Template.staleCheckoutTemplate)
  .pending(Wcs.Template.pendingCheckoutTemplate);

const priceOstLinkPipeline = Tacocat
  .select(
    Wcs.Constant.PriceCssSelector.link,
    Wcs.matchTemplateHrefParam('price'),
  )
  .extract((_, element) => Wcs.Parser.parsePriceHref(element))
  .extract((_, element) => Wcs.Parser.parsePriceLiterals(element))
  .extract(() => Wcs.getLocale())
  .provide(mockWcsProvider)
  .stale(Wcs.Template.stalePriceTemplate)
  .pending(Wcs.Template.pendingPriceTemplate);

const checkoutPlaceholderPipeline = Tacocat
  .select(
    Wcs.Constant.CheckoutCssSelector.placeholder,
    Wcs.matchTemplateDatasetParam('checkout'),
  )
  .extract((_, element) => Wcs.Parser.parseCheckoutHref(element))
  .extract((_, element) => Wcs.Parser.parseCheckoutLiterals(element))
  .extract(() => Wcs.getLocale())
  .provide(mockWcsProvider)
  .stale(Wcs.Template.staleTemplate)
  .pending(Wcs.Template.pendingCheckoutTemplate)
  .rejected(Wcs.Template.rejectedTemplate)
  .resolved(Wcs.Template.resolvedCheckoutTemplate);

const pricePlaceholderPipeline = Tacocat
  .select(
    Wcs.Constant.PriceCssSelector.placeholder,
    Wcs.matchTemplateDatasetParam('price'),
  )
  .extract((_, element) => Wcs.Parser.parsePriceHref(element))
  .extract((_, element) => Wcs.Parser.parsePriceLiterals(element))
  .extract(() => Wcs.getLocale())
  .provide(mockWcsProvider)
  .stale(Wcs.Template.staleTemplate)
  .pending(Wcs.Template.pendingPriceTemplate)
  .rejected(Wcs.Template.rejectedTemplate)
  .resolved(Wcs.Template.resolvedPriceTemplate);

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
    checkoutOstLinkPipeline.observe(container, controller.signal);
    priceOstLinkPipeline.observe(container, controller.signal);
    const checkoutTacos = checkoutPlaceholderPipeline
      .observe(container, controller.signal)
      .placeholders;
    const priceTacos = pricePlaceholderPipeline
      .observe(container, controller.signal)
      .placeholders;

    await Promise.all([
      ...checkoutTacos.map((placeholder) => placeholder.promise),
      ...priceTacos.map((placeholder) => placeholder.promise),
    ]);

    // eslint-disable-next-line no-await-in-loop
    const mock = await mockWcs();

    // eslint-disable-next-line no-restricted-syntax
    for (const taco of checkoutTacos) {
      const { context, element } = taco;
      const Param = Wcs.Constant.CheckoutDatasetParam.resolved;
      const {
        [Param.commitments]: commitments,
        [Param.offers]: offers,
        [Param.terms]: terms,
        [Param.url]: url,
      } = element.dataset;
      /** @type {Tacocat.Wcs.Offer[]} */
      const wcsOffers = mock[context.country]?.resolvedOffers ?? [];
      expect(wcsOffers).to.be.not.empty;
      expect(commitments).to.be(
        wcsOffers.map(({ commitment }) => commitment).join(','),
      );
      expect(offers).to.be(
        wcsOffers.map(({ offerId }) => offerId).join(','),
      );
      expect(terms).to.be(
        wcsOffers.map(({ term }) => term).join(','),
      );
      expect(url.indexOf(ostBaseUrl)).to.be(0);
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const taco of priceTacos) {
      const { context, element } = taco;
      const Param = Wcs.Constant.PriceDatasetParam.resolved;
      const {
        [Param.analytics]: analytics,
        [Param.commitment]: commitment,
        [Param.offer]: offer,
        [Param.term]: term,
      } = element.dataset;
      /** @type {Tacocat.Wcs.Offer[]} */
      const wcsOffers = mock[context.country]?.resolvedOffers ?? [];
      expect(wcsOffers).to.be.not.empty;
      expect(analytics).to.be(wcsOffers[0].analytics);
      expect(commitment).to.be(wcsOffers[0].commitment);
      expect(offer).to.be(wcsOffers[0].offerId);
      expect(term).to.be(wcsOffers[0].term);
    }
  });
});
