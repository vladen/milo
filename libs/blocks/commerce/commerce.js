import { createTag } from '../../utils/utils.js';

export default async function init(el) {
  el.append(createTag('div', { class: 'container' }, 'OST will be hosted here'));
}
