declare namespace Tacocat {
  module Wcs {
    // --- types ---
    type CheckoutRejection = Tacocat.Rejection<
      CheckoutPlaceholderContext & CheckoutLiterals
    >;
    type CheckoutResolution = Tacocat.Resolution<
      CheckoutPlaceholderContext & CheckoutLiterals,
      Offers
    >;

    type PriceRejection = Tacocat.Rejection<
      PricePlaceholderContext & PriceLiterals
    >;
    type PriceResolution = Tacocat.Resolution<
      PricePlaceholderContext & PriceLiterals,
      Offers
    >;

    // --- interfaces ---
    interface LocaleContext {
      country: string;
      language: string;
    }

    interface CheckoutLiterals {
      literals: {
        ctaLabel: string;
      };
    }

    interface CheckoutSettings {
      client: string;
      step: string;
      target: string;
    }

    interface CheckoutContext extends CheckoutSettings, LocaleContext {
      osis: string[];
      quantities: number[];
    }

    interface PlaceholderContext {
      extra: DOMStringMap;
      template: string;
    }

    interface CheckoutPlaceholderContext
      extends CheckoutContext,
        PlaceholderContext {}

    interface PriceLiterals {
      literals: {
        perUnitLabel: string;
        recurrenceLabel: string;
      };
    }

    interface PriceSettings {
      format: boolean;
      recurrence: boolean;
      tax: boolean;
      unit: boolean;
    }

    interface PriceContext extends PriceSettings, LocaleContext {
      osi: string;
    }

    interface PricePlaceholderContext
      extends PriceContext,
        PlaceholderContext {}

    interface Offer {
      analytics: string;
      buyingProgram: string;
      commitment: string;
      customerSegment: string;
      language: string;
      marketSegments: string;
      merchant: string;
      offerSelectorIds: string[];
      offerId: string;
      offerType: string;
      priceDetails: {
        price: number;
        usePrecision: boolean;
        formatString: string;
        taxDisplay: string;
        taxTerm: string;
      };
      pricePoint: string;
      productArrangementCode: string;
      salesChannel: string;
      term: string;
    }

    interface Offers {
      offers: Offer[];
    }
  }
}
