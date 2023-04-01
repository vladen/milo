declare namespace Tacocat {
  module Wcs {
    interface LocaleContext {
      country: string;
      language: string;
    }

    interface OsisContext extends LocaleContext {
      osis: string[];
    }

    interface CheckoutLiterals {
      ctaLabel: string;
    }

    interface CheckoutSettings extends OsisContext {
      client: string;
      step: string;
    }

    interface CheckoutContext extends CheckoutSettings, OsisContext {
      countrySpecific: string[];
      qantity: number[];
    }

    interface PlaceholderContext {
      template: string;
    }

    interface CheckoutPlaceholderContext
      extends CheckoutContext,
        PlaceholderContext {
      extra: DOMStringMap;
    }

    interface PriceLiterals {
      perUnitLabel: string;
      recurrenceLabel: string;
    }

    interface PriceSettings {
      format: boolean;
      recurrence: boolean;
      tax: boolean;
      unit: boolean;
    }

    interface PricePlaceholderContext
      extends OsisContext,
        PriceSettings,
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
  }
}
