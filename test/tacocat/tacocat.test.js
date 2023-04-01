/// <reference path="../../libs/tacocat/types.d.ts" />
/// <reference path="../../libs/tacocat/wcs/types.d.ts" />
import { readFile } from '@web/test-runner-commands';
import Tacocat, { Utils } from '../../libs/tacocat/index.js';
import Wcs from '../../libs/tacocat/wcs/index.js';
import { namespace } from '../../libs/tacocat/constants.js';
import { expect } from './tools.js';

let wcsMock;
const ostBaseUrl = 'https://milo.adobe.com//tools/ost?';

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
    const ctaPipeline = Tacocat
      .select(
        `a[href^="${ostBaseUrl}"]`,
        Wcs.matchTemplateParam('checkout'),
      )
      .extract((_, element) => Wcs.parseCheckoutHrefParams(element))
      .extract((_, element) => Wcs.tryParseCheckoutLiterals(
        element.closest(`${namespace}-price-literals`),
      ))
      .extract(() => Wcs.getLocale())
      .provide(mockWcsProvider)
      .stale(Wcs.staleTemplate)
      .rejected(Wcs.rejectedTemplate)
      .resolved(Wcs.checkoutTemplate);

    const pricePipeline = Tacocat
      .select(
        `a[href^="${ostBaseUrl}"]`,
        Wcs.matchTemplateParam('price'),
      )
      .extract((_, element) => Promise.resolve(Wcs.parsePriceHrefParams(element)))
      .extract(() => Wcs.getLocale())
      .extract((_, element) => Wcs.tryParsePriceLiterals(
        element.closest(`${namespace}-price-literals`),
      ))
      .provide(mockWcsProvider)
      .stale(Wcs.staleTemplate)
      .rejected(Wcs.rejectedTemplate)
      .resolved(Wcs.priceTemplate);

    const ctaTacos = ctaPipeline.observe(container, controller.signal).placeholders;
    const priceTacos = pricePipeline.observe(container, controller.signal).placeholders;

    await Promise.all([
      ...ctaTacos.map((placeholder) => placeholder.promise),
      ...priceTacos.map((placeholder) => placeholder.promise),
    ]);

    // eslint-disable-next-line no-restricted-syntax
    for (const placeholder of ctaTacos) {
      const { context, element } = placeholder;
      const {
        [Wcs.DatasetKey.osis]: osis,
        [Wcs.DatasetKey.template]: template,
      } = element.dataset;
      // eslint-disable-next-line no-await-in-loop
      const mock = await mockWcs();
      /** @type {Tacocat.Wcs.Offer[]} */
      const offers = mock[context.country].resolvedOffers;
      expect(osis).to.be(
        Utils.joinUnique(
          offers.flatMap(({ offerSelectorIds }) => offerSelectorIds),
        ),
      );
      expect(template).to.be(context.template);
    }
  });
});
