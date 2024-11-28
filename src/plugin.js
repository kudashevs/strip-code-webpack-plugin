// @ts-check
'use strict';

import StripCode from 'strip-code';
import {isEmptyArray, isNotSet} from './utils';

const EXCLUDE_MODES = ['development'];
const DEFAULT_NAME = 'dev';
const DEFAULT_SEPARATOR = '-';
const DEFAULT_TAG_PREFIX = '/*';
const DEFAULT_TAG_SUFFIX = '*/';

export default class StripCodeWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  apply(compiler) {
    const pluginName = 'StripCodeWebpackPlugin';

    compiler.hooks.thisCompilation.tap(pluginName, compilation => {
      if (this.shouldSkipProcessing(compiler.options.mode || process.env.NODE_ENV)) {
        return;
      }

      const {webpack} = compiler;
      const {Compilation} = webpack;
      const {RawSource} = webpack.sources;

      // prettier-ignore
      compilation.hooks.processAssets.tap({
        name: pluginName,
        stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
      }, assets => {
        try {
          this.processAssets(compilation, assets, RawSource);
        } catch (err) {
          throw new Error(`Compilation failed with ${err.message}`);
        }
      });
    });
  }

  processAssets(compilation, assets, RawSource) {
    compilation.getAssets().forEach(({name, source}) => {
      const modified = this.strip(source.source(), this.options);

      compilation.updateAsset(name, new RawSource(modified));
    });
  }

  /**
   * @param {string} mode
   * @return {boolean}
   */
  shouldSkipProcessing(mode) {
    return EXCLUDE_MODES.includes(mode);
  }

  strip(content, options) {
    if (this.shouldUseDefaults(options)) {
      options.blocks = [this.generateDefaultBlock()];
    }

    return StripCode(content, options);
  }

  /**
   * @param {Object} options
   * @param {Array<string|Object>|undefined} [options.blocks]
   * @returns {boolean}
   */
  shouldUseDefaults(options) {
    return isNotSet(options.blocks) || isEmptyArray(options.blocks);
  }

  /**
   * @param {string} [name=DEFAULT_NAME]
   * @return {{name:string, prefix: string, suffix: string}}
   */
  generateDefaultBlock(name = DEFAULT_NAME) {
    return {
      start: `${name}${DEFAULT_SEPARATOR}start`,
      end: `${name}${DEFAULT_SEPARATOR}end`,
      prefix: DEFAULT_TAG_PREFIX,
      suffix: DEFAULT_TAG_SUFFIX
    };
  }
}
