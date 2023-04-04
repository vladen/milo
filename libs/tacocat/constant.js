import namespace from './namespace.js';
import { qualifyCssName, qualifyDataAttribute, qualifyJsName } from './util.js';

export { namespace };

export const Stage = {
  /** @type {Tacocat.Mounted} */
  mounted: 'mounted',
  /** @type {Tacocat.Pending} */
  pending: 'pending',
  /** @type {Tacocat.Rejected} */
  rejected: 'rejected',
  /** @type {Tacocat.Resolved} */
  resolved: 'resolved',
};

export const Key = {
  ...Stage,
  disabled: 'disabled',
  extracted: 'extracted',
  observed: 'observed',
  provided: 'provided',
  presented: 'presented',
};

export const CssClass = {
  disabled: qualifyCssName(Key.disabled),
  mounted: qualifyCssName(Key.mounted),
  pending: qualifyCssName(Key.pending),
  rejected: qualifyCssName(Key.rejected),
  resolved: qualifyCssName(Key.resolved),
};

export const Event = {
  extracted: qualifyJsName(Key.extracted),
  mounted: qualifyJsName(Key.mounted),
  observed: qualifyJsName(Key.observed),
  pending: qualifyJsName(Key.pending),
  presented: qualifyJsName(Key.presented),
  provided: qualifyJsName(Key.provided),
  rejected: qualifyJsName(Key.rejected),
  resolved: qualifyJsName(Key.resolved),
};

export default {
  CssClass,
  Event,
  Stage,
  qualifyCssName,
  qualifyDataAttribute,
  qualifyJsName,
  namespace,
};
