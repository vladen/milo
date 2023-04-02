import {
  pendingCheckoutTemplate,
  resolvedCheckoutTemplate,
  staleCheckoutTemplate,
} from './checkout.js';
import { rejectedTemplate } from './common.js';
import {
  pendingPriceTemplate,
  resolvedPriceTemplate,
  stalePriceTemplate,
} from './price.js';

export default {
  Checkout: {
    pending: pendingCheckoutTemplate,
    resolved: resolvedCheckoutTemplate,
    stale: staleCheckoutTemplate,
  },
  Price: {
    pending: pendingPriceTemplate,
    resolved: resolvedPriceTemplate,
    stale: stalePriceTemplate,
  },
  rejected: rejectedTemplate,
};
