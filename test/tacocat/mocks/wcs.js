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
    get checkoutCta() {
      return Tacocat
        .select(
          'checkoutCta',
          Wcs.Constant.Checkout.CssSelector.placeholder,
          Wcs.Matcher.templateDatasetParam('checkout'),
        )
        .extract((_, element) => Wcs.Parser.Checkout.settings(element))
        .extract(
          (_, element) => Wcs.Parser.Checkout.dataset(element),
          Wcs.Constant.Checkout.DatasetReactions,
        )
        .extract((_, element) => Wcs.Parser.Checkout.literals(element))
        .extract(() => Wcs.getLocale())
        .provide(mockProvider)
        .pending(Wcs.Template.Checkout.pending)
        .rejected(Wcs.Template.rejected)
        .resolved(Wcs.Template.Checkout.resolved);
    },

    get checkoutOstLink() {
      return Tacocat
        .select(
          'checkoutOstLink',
          Wcs.Constant.Checkout.CssSelector.link,
          Wcs.Matcher.templateHrefParam('checkout'),
        )
        .extract((_, element) => Wcs.Parser.Checkout.settings(element))
        .extract((_, element) => Wcs.Parser.Checkout.href(element))
        .extract((_, element) => Wcs.Parser.Checkout.literals(element))
        .extract(() => Wcs.getLocale())
        .provide(mockProvider)
        .mounted(Wcs.Template.Checkout.mounted)
        .pending(Wcs.Template.Checkout.pending);
    },

    get price() {
      return Tacocat
        .select(
          'price',
          Wcs.Constant.Price.CssSelector.placeholder,
          Wcs.Matcher.templateDatasetParam('price'),
        )
        .extract((_, element) => Wcs.Parser.Price.settings(element))
        .extract(
          (_, element) => Wcs.Parser.Price.dataset(element),
          Wcs.Constant.Price.DatasetReactions,
        )
        .extract((_, element) => Wcs.Parser.Price.literals(element))
        .extract(() => Wcs.getLocale())
        .provide(mockProvider)
        .pending(Wcs.Template.Price.pending)
        .rejected(Wcs.Template.rejected)
        .resolved(Wcs.Template.Price.resolved);
    },

    get priceOstLink() {
      return Tacocat
        .select(
          'priceOstLink',
          Wcs.Constant.Price.CssSelector.link,
          Wcs.Matcher.templateHrefParam('price'),
        )
        .extract((_, element) => Wcs.Parser.Price.settings(element))
        .extract((_, element) => Wcs.Parser.Price.href(element))
        .extract((_, element) => Wcs.Parser.Price.literals(element))
        .extract(() => Wcs.getLocale())
        .provide(mockProvider)
        .mounted(Wcs.Template.Price.mounted)
        .pending(Wcs.Template.Price.pending);
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
