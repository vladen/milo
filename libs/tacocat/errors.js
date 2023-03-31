import { assignContext } from './context.js';

class TacocatError extends Error {}

/**
 * @template T
 * @param {T} context
 * @returns {Tacocat.Rejection<T>}
 */
// eslint-disable-next-line import/prefer-default-export
export const NotProvidedError = (context) => assignContext(
  new TacocatError('Not provided'),
  context,
);
