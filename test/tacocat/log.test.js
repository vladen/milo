import { expect, spy } from './tool.js';
import Log from '../../libs/tacocat/log.js';

describe.skip('function "Log"', () => {
  describe('returned object', () => {
    describe('property "id"', () => {
      it('returns namespace concatenated with index of this Log instance', () => {
        expect(Log('foo').namespace).to.contain('foo-1');
        expect(Log('foo').namespace).to.contain('foo-2');
        expect(Log('bar').namespace).to.contain('bar-1');
      });
    });

    describe('method "module"', () => {
      it('returns new Log instance with module name added to namespace', () => {
        expect(Log('test').module('module').namespace).to.contain('module');
      });
    });

    describe('property "namespace"', () => {
      it('returns namespace assigned to the Log instance', () => {
        expect(Log('test').namespace).to.contain('test');
      });
    });
  });

  describe('static method "use"', () => {
    it('registers log filter module', () => {
      const filter = spy();
      Log.use({ filter });
      Log.common.error('Test');
      expect(filter.firstCall.firstArg).to.contain({
        level: Log.level.error,
        message: 'Test',
      });
    });

    it.only('registers log writer module', () => {
      const write = spy();
      Log.use({ writer: write });
      Log.common.error('Test');
      expect(write.firstCall.firstArg).to.contain({
        level: Log.level.error,
        message: 'Test',
      });
    });
  });
});
