import { promises as fs } from 'fs';
import path from 'path';
import {fileURLToPath} from 'node:url';

const __dirname = import.meta.dirname ?? path.dirname(fileURLToPath(import.meta.url));

const DEFAULT_ENTRY_PATH = '../temp/';
const DEFAULT_ENTRY_FILE = 'fixture.tmp';

class Entry {
  file;
  fd;

  /**
   * The constructor does not create any files because of the symmetry principle.
   * The open operation should be explicit and symmetrical to the close operation.
   */
  constructor() {}

  async open(file = DEFAULT_ENTRY_FILE) {
    const fullPath = path.join(__dirname, DEFAULT_ENTRY_PATH, file);

    try {
      this.fd = await fs.open(fullPath, 'w');
    } catch (err) {
      throw new Error(`Cannot create a file ${fullPath} because ${err.message}`);
    }

    this.file = fullPath;
  }

  async write(data) {
    try {
      await fs.writeFile(this.file, data, {encoding: 'utf-8', flag: 'w'});
    } catch (err) {
      throw new Error(`Cannot write to file ${this.file} because ${err.message}`);
    }
  }

  async read() {
    try {
      return await fs.readFile(this.file, {encoding: 'utf-8'});
    } catch (err) {
      throw new Error(`Cannot read file ${this.file} because ${err.message}`);
    }
  }

  path() {
    return this.file;
  }

  async exists() {
    try {
      return await fs.access(File.file, fs.constants.OK);
    } catch (err) {
      return false;
    }
  }

  async close() {
    await this.fd.close();
    await fs.unlink(this.file);
  }
}

export default Entry;
