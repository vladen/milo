/// <reference path="../../libs/tacocat/types.d.ts" />
/// <reference path="../../libs/tacocat/wcs/types.d.ts" />
import { readFile } from '@web/test-runner-commands';
import WcsMock, { CssClass, CssSelector } from './mocks/wcs.js';
import { expect } from './tool.js';
import Tacocat from '../../libs/tacocat/index.js';
import Wcs from '../../libs/tacocat/wcs/index.js';

/*
- tiggering by events
  - updates placeholders when event is dispatched
  - event data can be used in extractor
  - stops after abort
- tiggering by mutations
  - updates placeholders when their attribute mutates
  - stops after abort
- resilience
  - does not throw if extractor/provider/presenter throw
*/

describe('module "Tacocat"', () => {
  /** @type {AbortController} */
  let controller;
  let observation;

  afterEach(() => {
    controller?.abort();
    document.body.innerHTML = '';
    Tacocat.Log.reset();
  });

  beforeEach(() => {
    // Tacocat.Log.reset('dev');
    controller = new AbortController();
    observation = { signal: controller?.signal };
  });

  it('listens to scope events and updates placeholder on event', async () => {
    document.body.innerHTML = (
      await readFile({ path: './mocks/trigger.html' })
    ).replaceAll(
      // eslint-disable-next-line no-template-curly-in-string
      '${ostBaseUrl}',
      Wcs.Constant.ostBaseUrl,
    );

    const cards = document.querySelectorAll(CssSelector.card);

    function clickCard(index) {
      cards.forEach((card) => {
        card.classList.remove(CssClass.selected);
      });
      cards[index].classList.add(CssClass.selected);
      cards[index].click();
    }

    cards.forEach((card, index) => {
      card.addEventListener('click', () => {
        clickCard(index);
      });
    });

    const { price, priceDynamic, run } = WcsMock({
      data: JSON.parse(
        await readFile({ path: './mocks/offers.json' }),
      ),
    });

    const pipeline1 = price().observe(observation);
    const pipeline2 = priceDynamic().observe(observation);
    await run(pipeline1, pipeline2);

    clickCard(1);
    await run(pipeline1, pipeline2);
    expect(document.body).dom.to.equalSnapshot();
  });
});
