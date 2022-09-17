import { ServerResponse } from 'node:http';
import Response from '@esm2cjs/responselike';
import { RequestFn, StorageAdapter, CacheableOptions, Emitter } from './types.js';
declare type Func = (...args: any[]) => any;
declare class CacheableRequest {
    cache: StorageAdapter;
    cacheRequest: RequestFn;
    hooks: Map<string, Func>;
    constructor(cacheRequest: RequestFn, cacheAdapter?: StorageAdapter | string);
    request: () => (options: CacheableOptions, cb?: ((response: ServerResponse | typeof Response) => void) | undefined) => Emitter;
    addHook: (name: string, fn: Func) => void;
    removeHook: (name: string) => boolean;
    getHook: (name: string) => Func | undefined;
    runHook: (name: string, response: any) => Promise<any>;
}
export default CacheableRequest;
export * from './types.js';
//# sourceMappingURL=index.d.ts.map