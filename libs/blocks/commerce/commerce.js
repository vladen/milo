import { createTag, loadScript } from '../../utils/utils.js';

export default async function init(el) {
  el.append(createTag('div', { class: 'ost' }));

  if (!window.ost) {
    await loadScript('https://www.stage.adobe.com/special/tacocat/ost/offer-selector-tool.js');
  }

  const ostCountry = 'US';
  const ostLanguage = 'en';
  const ostEnvironment = 'STAGE';
  const ostWcsApiKey = 'wcms-commerce-ims-ro-user-cc';
  const ostAosApiKey = 'dexter-commerce-offers';
  const checkoutClientId = 'creative';
  const ostAosAccessToken = sessionStorage.getItem('AOS_ACCESS_TOKEN') || localStorage.getItem('AOS_ACCESS_TOKEN');
  const url = new URL(window.location);
  const searchParameters = url.searchParams;
  window.ost.openOfferSelectorTool({
    ostCountry,
    ostLanguage,
    ostEnvironment,
    ostWcsApiKey,
    ostAosApiKey,
    ostAosAccessToken,
    checkoutClientId,
    searchParameters,
  });
}
