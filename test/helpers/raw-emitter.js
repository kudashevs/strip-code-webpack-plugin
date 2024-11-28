import path from 'path';

/**
 * This loader creates a raw copy of a processed file.
 * The raw copy will be transformed without compilation.
 */
export default function RawEmitLoader(source) {
  const filename = path.basename(this.resourcePath);
  const assetInfo = {sourceFilename: filename};

  this.emitFile(filename, source, null, assetInfo);

  return JSON.stringify(source)
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}
