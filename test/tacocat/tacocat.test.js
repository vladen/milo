/// <reference path="../../libs/tacocat/types.d.ts" />
/// <reference path="../../libs/tacocat/wcs/types.d.ts" />
import { readFile } from '@web/test-runner-commands';
import WcsMock from './mocks/wcs.js';
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
    controller.abort();
    document.body.innerHTML = '';
    Tacocat.Log.reset();
  });
  beforeEach(() => {
    // Tacocat.Log.reset('dev');
    controller = new AbortController();
    observation = { signal: controller.signal };
  });

  describe('OST pipeline', () => {
    it('processes placeholders', async () => {
      document.body.innerHTML = (await readFile({ path: './mocks/links.html' })).replaceAll(
        // eslint-disable-next-line no-template-curly-in-string
        '${ostBaseUrl}',
        Wcs.Constant.ostBaseUrl,
      );

      const {
        checkoutOstLink, checkoutPlaceholder,
        priceOstLink, pricePlaceholder,
        run,
      } = WcsMock(
        JSON.parse(await readFile({ path: './mocks/offers.json' })),
      );

      await run(
        checkoutOstLink.observe(observation),
        checkoutPlaceholder.observe(observation),
        priceOstLink.observe(observation),
        pricePlaceholder.observe(observation),
      );

      expect(document.body).dom.to.equalSnapshot();
    });
  });
});
