export const namespace = 'tacocat';

export const ErrorMessage = { notProvided: 'Not provided' };

export const Stage = {
  /** @type {Tacocat.Pending} */
  pending: 'pending',
  /** @type {Tacocat.Rejected} */
  rejected: 'rejected',
  /** @type {Tacocat.Resolved} */
  resolved: 'resolved',
};

export default { namespace, Stage };
