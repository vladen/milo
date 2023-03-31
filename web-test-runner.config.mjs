// eslint-disable-next-line import/no-extraneous-dependencies
import { importMapsPlugin } from '@web/dev-server-import-maps';

/** @type {import('@web/test-runner').TestRunnerConfig} */
export default {
  coverageConfig: {
    exclude: [
      '**/mocks/**',
      '**/node_modules/**',
      '**/test/**',
      '**/deps/**',
      '**/imslib/imslib.min.js',
      // TODO: folders below need to have tests written for 100% coverage
      '**/ui/controls/**',
      '**/blocks/library-config/**',
      '**/hooks/**',
      '**/special/tacocat/**',
    ],
  },
  plugins: [importMapsPlugin({})],
};
