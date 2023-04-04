/// <reference path="../../../libs/tacocat/types.d.ts" />
/// <reference path="../../../libs/tacocat/wcs/types.d.ts" />
import Tacocat, { Util } from '../../../libs/tacocat/index.js';
import Wcs from '../../../libs/tacocat/wcs/index.js';

export const CssClass = {
  card: Util.qualifyCssName(Wcs.Constant.namespace, 'card'),
  priceDynamic: Util.qualifyCssName(Wcs.Constant.Price.CssClass.placeholder, 'dynamic'),
  selected: 'selected',
};

export const CssSelector = {
  card: `div.${CssClass.card}`,
  priceDynamic: `span.${CssClass.priceDynamic}`,
  selected: `.${CssClass.selected}`,
};

export const countries = ['US', 'GB', 'HK'];

/**
 * @param {Tacocat.Wcs.LocaleContext} locale
 * @param {{
 *  [country: string]: { resolvedOffers: Tacocat.Wcs.Offer[] },
 * }} responses
 */
export default function WcsMock({
  country = 'US',
  data = {},
}) {
  const cache = Tacocat.Cache();
  const log = Tacocat.Log.common.module('wcs').module('mock');

  async function localeExtractor() {
    await Util.delay(1);
    return { country, languag: 'en' };
  }

  const selectOffers = (osis) => cache.getOrSet(
    [osis.sort().join('\n')],
    () => {
      const offers = data[country]?.resolvedOffers.filter(
        ({ offerSelectorIds }) => osis.some(
          (osi) => offerSelectorIds?.includes(osi),
        ),
      );
      log.debug('Fetched:', { offers });
      return offers;
    },
  );

  /**
   * @type {Tacocat.Engine.Provider<Tacocat.Wcs.WcsContext, Tacocat.Wcs.Offers>}
   */
  async function mockProvider({ contexts }) {
    return contexts.map(
      (context) => new Promise(
        (resolve) => {
          context.country = (context.country ?? 'US').toUpperCase();
          if (!Util.isString(context.country) || context.country !== country) {
            throw new Error('Invalid "country" context');
          }
          if (!context.osis?.length) {
            throw new Error('Missing "osis" context');
          }
          const offers = selectOffers(context.osis);
          if (offers?.length) {
            resolve(Util.setContext({ offers }, context));
          } else {
            throw new Error('Offers not found');
          }
        },
      ),
    );
  }

  return {
    checkoutCta() {
      return Tacocat
        .select(
          'checkoutCta',
          Wcs.Constant.Checkout.CssSelector.placeholder,
          Wcs.Matcher.templateDatasetParam('checkout'),
        )
        .extract(Wcs.Extractor.Checkout.settings)
        .extract(Wcs.Extractor.Checkout.dataset, Wcs.Constant.Checkout.DatasetReactions)
        .extract(Wcs.Extractor.Checkout.literals)
        .extract(localeExtractor)
        .extract(Wcs.Extractor.Checkout.validate)
        .provide(mockProvider)
        .pending(Wcs.Presenter.Checkout.pending)
        .rejected(Wcs.Presenter.rejected)
        .resolved(Wcs.Presenter.Checkout.resolved);
    },

    checkoutOstLink() {
      return Tacocat
        .select(
          'checkoutOstLink',
          Wcs.Constant.Checkout.CssSelector.link,
          Wcs.Matcher.templateHrefParam('checkout'),
        )
        .extract(Wcs.Extractor.Checkout.settings)
        .extract(Wcs.Extractor.Checkout.href)
        .extract(Wcs.Extractor.Checkout.literals)
        .extract(localeExtractor)
        .extract(Wcs.Extractor.Checkout.validate)
        .provide(mockProvider)
        .mounted(Wcs.Presenter.Checkout.mounted)
        .pending(Wcs.Presenter.Checkout.pending);
    },

    price() {
      return Tacocat
        .select(
          'price',
          Wcs.Constant.Price.CssSelector.placeholder,
          Wcs.Matcher.templateDatasetParam('price'),
        )
        .extract(Wcs.Extractor.Price.settings)
        .extract(Wcs.Extractor.Price.dataset, Wcs.Constant.Price.DatasetReactions)
        .extract(Wcs.Extractor.Price.literals)
        .extract(localeExtractor)
        .extract(Wcs.Extractor.Price.validate)
        .provide(mockProvider)
        .pending(Wcs.Presenter.Price.pending)
        .rejected(Wcs.Presenter.rejected)
        .resolved(Wcs.Presenter.Price.resolved);
    },

    priceDynamic() {
      return Tacocat
        .select(
          'priceDynamic',
          CssSelector.priceDynamic,
          Wcs.Matcher.templateDatasetParam('price'),
        )
        .extract(Wcs.Extractor.Price.settings)
        .extract(Wcs.Extractor.Price.dataset)
        .extract(
          (state) => {
            const { target } = state.event ?? {};
            const element = (
              target?.matches(CssSelector.card + CssSelector.selected)
                ? target
                : state.scope.querySelector(CssSelector.card + CssSelector.selected)
            ).querySelector(
              Wcs.Constant.Price.CssSelector.placeholder,
            );
            return element
              ? Wcs.Extractor.Price.dataset({ ...state, element })
              : null;
          },
          {
            trigger(_, listener, control) {
              control.listen(control.scope, [Tacocat.Event.resolved, 'click'], listener);
            },
          },
        )
        .extract(Wcs.Extractor.Price.literals)
        .extract(localeExtractor)
        .extract(Wcs.Extractor.Price.validate)
        .provide(mockProvider)
        .pending(Wcs.Presenter.Price.pending)
        .rejected(Wcs.Presenter.rejected)
        .resolved(Wcs.Presenter.Price.resolved);
    },

    priceOstLink() {
      return Tacocat
        .select(
          'priceOstLink',
          Wcs.Constant.Price.CssSelector.link,
          Wcs.Matcher.templateHrefParam('price'),
        )
        .extract(Wcs.Extractor.Price.settings)
        .extract(Wcs.Extractor.Price.href)
        .extract(Wcs.Extractor.Price.literals)
        .extract(localeExtractor)
        .extract(Wcs.Extractor.Price.validate)
        .provide(mockProvider)
        .mounted(Wcs.Presenter.Price.mounted)
        .pending(Wcs.Presenter.Price.pending);
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
