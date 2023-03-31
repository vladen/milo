import { createTag, getConfig, getLocale, loadStyle, loadScript } from '../../utils/utils.js';

const config = getConfig();
console.info('Config:', config);
const params = new URLSearchParams(window.location.search);
const referrer = params.get('referrer');
const owner = params.get('owner');
const repo = params.get('repo');

export default async function init(el) {
  el.append(createTag('div', { class: 'ost' }));

  if (!window.ost) {
    const baseUrl = 'https://www.stage.adobe.com/special/tacocat/ost';
    await loadScript(`${baseUrl}/index.js`);
    loadStyle(`${baseUrl}/index.css`);
  }

  const ostLanguage = 'en';
  const ostCountry = 'US';
  try {
    const res = await fetch(`https://admin.hlx.page/status/${owner}/${repo}/main?editUrl=${referrer}`);
    const json = await res.json();
    console.info('Locale:', getLocale(config.locales, new URL(json.preview.url)));
  } catch {
    // ignore
  }

  // TODO: integrate with IMS
  const ostAosAccessToken = sessionStorage.getItem('AOS_ACCESS_TOKEN') || localStorage.getItem('AOS_ACCESS_TOKEN');
  // TODO: get price/checkout contexts from metadata.json and pass to OST
  window.ost.openOfferSelectorTool({
    ostCountry,
    ostLanguage,
    ostEnvironment: 'STAGE',
    ostWcsApiKey: 'wcms-commerce-ims-ro-user-cc',
    ostAosApiKey: 'dexter-commerce-offers',
    ostAosAccessToken,
    checkoutClientId: 'creative',
    searchParameters: new URL(window.location).searchParams,
  });
}
