import { expect } from './tools.js';
import { createSelectorMatcher, mergeMutations } from '../../libs/tacocat/utilities.js';

describe('function "createSelectorMatcher"', () => {
  it('returns a function', () => {
    expect(createSelectorMatcher()).to.be.instanceOf(Function);
  });
});

describe('function "mergeMutations"', () => {
  it('merges several mutation observer settings into one object', () => {
    expect(mergeMutations([
      { attributes: true, attributeFilter: ['class'] },
      { attributeFilter: ['id', 'type'], childList: true },
      { subtree: true },
    ])).to.deep.equal({
      attributeFilter: ['class', 'id', 'type'],
      attributes: true,
      characterData: false,
      childList: true,
      subtree: true,
    });
  });
});
