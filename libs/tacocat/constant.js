export const namespace = 'taco';

/**
 * @param {string[]} names
 */
export const qualifyCssName = (...names) => [namespace, ...names]
  .filter((name) => name)
  .map((name) => name.replace(
    /\p{Ll}(\p{Lu}|\p{N})/g,
    (_, prev, next) => `${prev}-${next[0].toLowerCase()}`,
  ))
  .join('-');
export const qualifyDatasetAttribute = (...names) => `data-${qualifyCssName(...names)}`;
export const qualifyDatasetName = (...names) => qualifyCssName(...names).replace(
  /(\w)-(\w)/g,
  (_, prev, next) => `${prev}${next.toUpperCase()}`,
);

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

export const Event = {
  extracted: qualifyCssName(Key.extracted),
  mounted: qualifyCssName(Key.mounted),
  observed: qualifyCssName(Key.observed),
  pending: qualifyCssName(Key.pending),
  presented: qualifyCssName(Key.presented),
  provided: qualifyCssName(Key.provided),
  rejected: qualifyCssName(Key.rejected),
  resolved: qualifyCssName(Key.resolved),
};

export const CssClass = {
  disabled: qualifyCssName(Key.disabled),
  mounted: Event.mounted,
  pending: Event.pending,
  rejected: Event.rejected,
  resolved: Event.resolved,
};

export default {
  qualifyCssName,
  qualifyDatasetAttribute,
  qualifyDatasetName,
  CssClass,
  Event,
  Stage,
  namespace,
};
