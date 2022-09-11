import EventEmitter from 'node:events';
import { RequestOptions, ServerResponse } from 'node:http';
import { Options as CacheSemanticsOptions } from 'http-cache-semantics';
import Response from '@esm2cjs/responselike';
import { RequestFn, StorageAdapter, Options } from './types.js';
declare type Func = (...args: any[]) => any;
declare class CacheableRequest {
    cache: StorageAdapter;
    request: RequestFn;
    hooks: Map<string, Func>;
    constructor(request: RequestFn, cacheAdapter?: StorageAdapter | string);
    createCacheableRequest: () => (options: (Options & RequestOptions & CacheSemanticsOptions) | string | URL, cb?: ((response: ServerResponse | Response) => void) | undefined) => EventEmitter;
    addHook: (name: string, fn: Func) => void;
    removeHook: (name: string) => boolean;
    getHook: (name: string) => Func | undefined;
    runHook: (name: string, response: any) => Promise<any>;
}
export default CacheableRequest;
//# sourceMappingURL=index.d.ts.map