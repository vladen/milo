/**
 * @template T
 * @param {T} context
 * @param {string} country
 * @param {string} language
 * @returns {Promise<T & Tacocat.Wcs.LocaleContext>}
 */
// eslint-disable-next-line import/prefer-default-export
export const setLocale = (context, country = 'US', language = 'en') => Promise.resolve({
  ...context,
  country,
  language,
});
