export const namespace = 'taco';

/**
 * @param {string[]} names
 */
export const qualifyCssName = (...names) => [namespace, ...names].join('-');
export const qualifyDatasetName = (...names) => qualifyCssName(...names).replace(
  /(\w)-(\w)/g,
  (_, prev, next) => `${prev}${next.toUpperCase()}`,
);

export const Stage = {
  /** @type {Tacocat.Stale} */
  stale: 'stale',
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

export const Event = {
  extracted: qualifyCssName(Key.extracted),
  observed: qualifyCssName(Key.observed),
  pending: qualifyCssName(Key.pending),
  presented: qualifyCssName(Key.presented),
  provided: qualifyCssName(Key.provided),
  rejected: qualifyCssName(Key.rejected),
  resolved: qualifyCssName(Key.resolved),
  stale: qualifyCssName(Key.stale),
};

export const CssClass = {
  disabled: qualifyCssName(Key.disabled),
  pending: Event.pending,
  rejected: Event.rejected,
  resolved: Event.resolved,
  stale: Event.stale,
};

export default {
  qualifyCssName,
  qualifyDatasetName,
  CssClass,
  Event,
  Stage,
  namespace,
};
