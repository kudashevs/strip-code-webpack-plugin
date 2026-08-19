// @ts-check
'use strict';

// @ts-expect-error - strip-code lacks definitions
import StripCode from 'strip-code';
import {mapDefaults} from "./mapper.js";

const PLUGIN_NAME = 'StripCodeWebpackPlugin';
const EXCLUDE_MODES = ['development'];
const FALLBACK_MODE = 'production';

export default class StripCodeWebpackPlugin {
  constructor(options = {}) {
    this.options = options;
  }

  /**
   * @param {Object.<string, any>} compiler
   *
   * @throws {Error} It throws an Error when options do not match the schema.
   */
  apply(compiler) {
    compiler.hooks.thisCompilation.tap(PLUGIN_NAME, compilation => {
      if (this.#shouldSkipProcessing(compiler.options?.mode || process.env.NODE_ENV || FALLBACK_MODE)) {
        return;
      }

      const {webpack} = compiler;
      const {Compilation} = webpack;
      const {RawSource} = webpack.sources;

      // prettier-ignore
      compilation.hooks.processAssets.tap({
        name: PLUGIN_NAME,
        stage: Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE,
      }, assets => {
        try {
          this.#processAssets(compilation, assets, RawSource);
        } catch (err) {
          throw new Error(`Compilation failed with ${err.message}`);
        }
      });
    });
  }

  #processAssets(compilation, assets, RawSource) {
    compilation.getAssets().forEach(({name, source}) => {
      const modified = this.#strip(source.source(), this.options);

      compilation.updateAsset(name, new RawSource(modified));
    });
  }

  /**
   * @param {string} mode
   * @return {boolean}
   */
  #shouldSkipProcessing(mode) {
    return EXCLUDE_MODES.includes(mode);
  }

  /**
   * @param {string} content
   * @param {Object} options
   * @param {Array<string|{start: string, end: string, prefix: string, suffix: string}>|undefined} [options.blocks]
   * @return {string}
   *
   * @throws {Error} It throws an Error when options do not match the schema.
   */
  #strip(content, options) {
    if (this.#shouldUseDefaults(options)) {
      options.blocks = [mapDefaults()];
    }

    return StripCode(content, options);
  }

  /**
   * @param {Object} options
   * @param {Array<string|Object>|undefined} [options.blocks]
   * @return {boolean}
   */
  #shouldUseDefaults(options) {
    return this.#isNotSet(options?.blocks) || this.#isEmptyArray(options?.blocks);
  }

  /**
   * @param {Array<*>|undefined} v
   * @return {boolean}
   */
  #isNotSet(v) {
    return v === undefined || v === null;
  }

  /**
   * @param {Array<*>|undefined} v
   * @return {boolean}
   */
  #isEmptyArray(v) {
    return Array.isArray(v) && v.length === 0;
  }
}
