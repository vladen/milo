import {
  pendingCheckoutTemplate,
  resolvedCheckoutTemplate,
  mountedCheckoutTemplate,
} from './checkout.js';
import { rejectedTemplate } from './common.js';
import {
  pendingPriceTemplate,
  resolvedPriceTemplate,
  mountedPriceTemplate,
} from './price.js';

export default {
  Checkout: {
    mounted: mountedCheckoutTemplate,
    pending: pendingCheckoutTemplate,
    resolved: resolvedCheckoutTemplate,
  },
  Price: {
    mounted: mountedPriceTemplate,
    pending: pendingPriceTemplate,
    resolved: resolvedPriceTemplate,
  },
  rejected: rejectedTemplate,
};
