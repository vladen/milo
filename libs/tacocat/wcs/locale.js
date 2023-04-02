/**
 * @param {string} country
 * @param {string} language
 * @returns {Promise<Tacocat.Wcs.LocaleContext>}
 */
// eslint-disable-next-line import/prefer-default-export
export const getLocale = (country = 'US', language = 'en') => Promise.resolve({
  // TODO: use Milo config
  country,
  language,
});
