import { expect } from './tool.js';
import { Util } from '../../libs/tacocat/index.js';

describe.skip('module "Util"', () => {
  describe('function "mergeReactions"', () => {
    it('merges several mutation observer settings into one object', () => {
      const trigger1 = () => { };
      const trigger2 = () => { };
      expect(Util.mergeReactions([
        {
          events: ['test1'],
          mutations: { attributes: true, attributeFilter: ['class'] },
        },
        {
          mutations: { attributeFilter: ['id', 'type'], childList: true },
          trigger: trigger1,
        },
        {
          events: ['test1', 'test2'],
          mutations: { subtree: true },
          trigger: trigger2,
        },
      ])).to.deep.equal({
        events: ['test1', 'test2'],
        mutations: {
          attributeFilter: ['class', 'id', 'type'],
          attributes: true,
          characterData: false,
          childList: true,
          subtree: true,
        },
        triggers: [trigger1, trigger2],
      });
    });
  });
});
