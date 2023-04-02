/// <reference path="../../../libs/tacocat/types.d.ts" />
/// <reference path="../../../libs/tacocat/wcs/types.d.ts" />
import Tacocat, { Util } from '../../../libs/tacocat/index.js';
import Wcs from '../../../libs/tacocat/wcs/index.js';

/**
 * @param {{
 *  [country: string]: { resolvedOffers: Tacocat.Wcs.Offer[] },
 * }} responsesByCountry
 */
export default function WcsMock(responsesByCountry) {
  const selectOffers = (country, osis) => responsesByCountry[country]?.resolvedOffers.filter(
    ({ offerSelectorIds }) => osis.some(
      (osi) => offerSelectorIds?.includes(osi),
    ),
  );

  /**
 * @param {Tacocat.Wcs.WcsContext[]} contexts
 * @returns {Promise<
 *  Tacocat.Resolution<Tacocat.Wcs.WcsContext, { offers: Tacocat.Wcs.Offer[] }>
  * >[]}
  */
  async function mockProvider(contexts) {
    // TODO: add cache
    return contexts.map(
      (context) => new Promise(
        (resolve, reject) => {
          context.country = (context.country ?? 'US').toUpperCase();
          /** @type {Tacocat.Wcs.Offer[]} */
          const offers = selectOffers(context.country, context.osis);
          if (offers.length) {
            resolve(Util.setContext({ offers }, context));
          } else {
            reject(Util.setContext(new Error(`Offers not found: ${context.osis.join(',')}`), context));
          }
        },
      ),
    );
  }

  return {
    get checkoutOstLink() {
      return Tacocat
        .select(
          Wcs.Constant.CheckoutCssSelector.link,
          Wcs.Matcher.templateHrefParam('checkout'),
        )
        .extract((_, element) => Wcs.Parser.Checkout.settings(element))
        .extract((_, element) => Wcs.Parser.Checkout.href(element))
        .extract((_, element) => Wcs.Parser.Checkout.literals(element))
        .extract(() => Wcs.getLocale())
        .provide(mockProvider)
        .stale(Wcs.Template.Checkout.stale)
        .pending(Wcs.Template.Checkout.pending);
    },

    get checkoutPlaceholder() {
      return Tacocat
        .select(
          Wcs.Constant.CheckoutCssSelector.placeholder,
          Wcs.Matcher.templateDatasetParam('checkout'),
        )
        .extract((_, element) => Wcs.Parser.Checkout.settings(element))
        .extract((_, element) => Wcs.Parser.Checkout.dataset(element))
        .extract((_, element) => Wcs.Parser.Checkout.literals(element))
        .extract(() => Wcs.getLocale())
        .provide(mockProvider)
        .pending(Wcs.Template.Checkout.pending)
        .rejected(Wcs.Template.rejected)
        .resolved(Wcs.Template.Checkout.resolved);
    },

    get priceOstLink() {
      return Tacocat
        .select(
          Wcs.Constant.PriceCssSelector.link,
          Wcs.Matcher.templateHrefParam('price'),
        )
        .extract((_, element) => Wcs.Parser.Price.settings(element))
        .extract((_, element) => Wcs.Parser.Price.href(element))
        .extract((_, element) => Wcs.Parser.Price.literals(element))
        .extract(() => Wcs.getLocale())
        .provide(mockProvider)
        .stale(Wcs.Template.Price.stale)
        .pending(Wcs.Template.Price.pending);
    },

    get pricePlaceholder() {
      return Tacocat
        .select(
          Wcs.Constant.PriceCssSelector.placeholder,
          Wcs.Matcher.templateDatasetParam('price'),
        )
        .extract((_, element) => Wcs.Parser.Price.settings(element))
        .extract((_, element) => Wcs.Parser.Price.dataset(element))
        .extract((_, element) => Wcs.Parser.Price.literals(element))
        .extract(() => Wcs.getLocale())
        .provide(mockProvider)
        .pending(Wcs.Template.Price.pending)
        .rejected(Wcs.Template.rejected)
        .resolved(Wcs.Template.Price.resolved);
    },

    /**
     * @param  {Tacocat.Engine.Instance} engines
     */
    async run(...engines) {
      await Util.delay(10);
      await Promise.all(
        engines.flatMap(({ placeholders }) => placeholders).map(({ promise }) => promise),
      );
      await Util.delay(10);
    },

    selectOffers,
  };
}
