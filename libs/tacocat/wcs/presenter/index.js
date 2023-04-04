import {
  pendingCheckoutPresenter,
  resolvedCheckoutPresenter,
  mountedCheckoutPresenter,
} from './checkout.js';
import { rejectedPresenter } from './common.js';
import {
  pendingPricePresenter,
  resolvedPricePresenter,
  mountedPriceTemplate,
} from './price.js';

export default {
  Checkout: {
    mounted: mountedCheckoutPresenter,
    pending: pendingCheckoutPresenter,
    resolved: resolvedCheckoutPresenter,
  },
  Price: {
    mounted: mountedPriceTemplate,
    pending: pendingPricePresenter,
    resolved: resolvedPricePresenter,
  },
  rejected: rejectedPresenter,
};
