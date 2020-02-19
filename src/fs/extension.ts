import { parse, join } from 'path';

import { Function } from '../line/transform';

import { PathFull, FileModificationOptions } from './types';
import { mapPath } from './map-file';


export function _dropExt(path: string) {
  const { dir, name } = parse(path);
  return join(dir, name);
}


export function dropExt<T extends PathFull>(options?: FileModificationOptions): Function<PathFull, PathFull>;
export function dropExt(): Function<string, string>;
export function dropExt<T extends PathFull>(options?: FileModificationOptions): 
  Function<string, string> | Function<T, T> {
  function _(f: T): T;
  function _(f: string): string;
  function _(f: string | T) {
    if (typeof f === 'string') return _dropExt(f);
    else return mapPath<T>(_dropExt, options)(f);
  }

  return _;
}


export type ExtensionMapper = (ext: string, path: string, 
                                root: string, content: string) => string | Promise<string>;

export function mapExt<T extends PathFull>(map: ExtensionMapper, options?: FileModificationOptions): Function<T, T>;
export function mapExt<T extends PathFull>(
  map: ExtensionMapper, 
  options?: FileModificationOptions
) {
  async function _(f: T): Promise<T>;
  async function _(f: string): Promise<string>;
  async function _(f: string | T) {
    const corrected = (ext: string) => ext.startsWith('.') ? ext : '.' + ext;
    const ext = (path: string) => { const { ext } = parse(path); return ext; };

    if (typeof f === 'string') return _dropExt(f) + corrected(await map(ext(f), f, '', ''));
    else return mapPath(
      async (path, root, content) => _dropExt(path) + corrected(await map(ext(path), path, root, content)),
      options
    )(f);
  }

  return _;
}
