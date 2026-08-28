import {describe, expect, it} from 'vitest';
import converter from '../helpers/converter.js';
import {createWebpack} from '../helpers/compiler';
import WebpackPlugin from '../../src';

describe('README example test suite', () => {
  const fixture ='integration.js';

  it('can skip an acceptance fixture in development', async () => {
    const webpack = createWebpack(
      fixture,
      {},
      {
        mode: 'development',
        plugins: [
          new WebpackPlugin({
            blocks: [
              'debug',
              {
                name: 'development',
                separator: '_',
                prefix: '//',
                suffix: '',
              },
              {
                start: 'devteam2:open',
                end: 'devteam2:close',
                prefix: '//',
                suffix: '',
              },
            ],
          }),
        ],
      },
    );

    const output = (await webpack.compile(fixture)).getCompiledOutput();

    expect(converter(output)).toContain('debug-start');
    expect(converter(output)).toContain('console.log');
  });

  it('can process an acceptance fixture', async () => {
    const webpack = createWebpack(
      fixture,
      {},
      {
        plugins: [
          new WebpackPlugin({
            blocks: [
              'debug',
              {
                name: 'development',
                separator: '_',
                prefix: '//',
                suffix: '',
              },
              {
                start: 'devteam2:open',
                end: 'devteam2:close',
                prefix: '//',
                suffix: '',
              },
            ],
          }),
        ],
      },
    );

    const output = (await webpack.compile(fixture)).getCompiledOutput();

    expect(converter(output)).not.toContain('debug-start');
    expect(converter(output)).not.toContain('console.log');
  });
});
