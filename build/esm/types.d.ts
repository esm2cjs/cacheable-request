/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
/// <reference types="node" />
import { request, RequestOptions, ClientRequest, ServerResponse } from 'node:http';
import { URL } from 'node:url';
import { EventEmitter } from 'node:events';
import { Buffer } from 'node:buffer';
import { Store } from 'keyv';
import ResponseLike from '@esm2cjs/responselike';
export declare type RequestFn = typeof request;
export declare type RequestFunction = typeof request;
export declare type CacheableRequestFunction = (options: CacheableOptions, cb?: (response: ServerResponse | typeof ResponseLike) => void) => Emitter;
export declare type CacheableOptions = Options & RequestOptions | string | URL;
export declare type StorageAdapter = Store<any>;
export interface Options {
    /**
             * If the cache should be used. Setting this to `false` will completely bypass the cache for the current request.
             * @default true
             */
    cache?: boolean | undefined;
    /**
             * If set to `true` once a cached resource has expired it is deleted and will have to be re-requested.
             *
             * If set to `false`, after a cached resource's TTL expires it is kept in the cache and will be revalidated
             * on the next request with `If-None-Match`/`If-Modified-Since` headers.
             * @default false
             */
    strictTtl?: boolean | undefined;
    /**
             * Limits TTL. The `number` represents milliseconds.
             * @default undefined
             */
    maxTtl?: number | undefined;
    /**
             * When set to `true`, if the DB connection fails we will automatically fallback to a network request.
             * DB errors will still be emitted to notify you of the problem even though the request callback may succeed.
             * @default false
             */
    automaticFailover?: boolean | undefined;
    /**
 * Forces refreshing the cache. If the response could be retrieved from the cache, it will perform a
 * new request and override the cache instead.
 * @default false
 */
    forceRefresh?: boolean | undefined;
    url?: string | undefined;
    headers?: Record<string, string | string[] | undefined>;
    body?: Buffer;
}
export interface Emitter extends EventEmitter {
    addListener(event: 'request', listener: (request: ClientRequest) => void): this;
    addListener(event: 'response', listener: (response: ServerResponse | typeof ResponseLike) => void): this;
    addListener(event: 'error', listener: (error: RequestError | CacheError) => void): this;
    on(event: 'request', listener: (request: ClientRequest) => void): this;
    on(event: 'response', listener: (response: ServerResponse | typeof ResponseLike) => void): this;
    on(event: 'error', listener: (error: RequestError | CacheError) => void): this;
    once(event: 'request', listener: (request: ClientRequest) => void): this;
    once(event: 'response', listener: (response: ServerResponse | typeof ResponseLike) => void): this;
    once(event: 'error', listener: (error: RequestError | CacheError) => void): this;
    prependListener(event: 'request', listener: (request: ClientRequest) => void): this;
    prependListener(event: 'response', listener: (response: ServerResponse | typeof ResponseLike) => void): this;
    prependListener(event: 'error', listener: (error: RequestError | CacheError) => void): this;
    prependOnceListener(event: 'request', listener: (request: ClientRequest) => void): this;
    prependOnceListener(event: 'response', listener: (response: ServerResponse | typeof ResponseLike) => void): this;
    prependOnceListener(event: 'error', listener: (error: RequestError | CacheError) => void): this;
    removeListener(event: 'request', listener: (request: ClientRequest) => void): this;
    removeListener(event: 'response', listener: (response: ServerResponse | typeof ResponseLike) => void): this;
    removeListener(event: 'error', listener: (error: RequestError | CacheError) => void): this;
    off(event: 'request', listener: (request: ClientRequest) => void): this;
    off(event: 'response', listener: (response: ServerResponse | typeof ResponseLike) => void): this;
    off(event: 'error', listener: (error: RequestError | CacheError) => void): this;
    removeAllListeners(event?: 'request' | 'response' | 'error'): this;
    listeners(event: 'request'): Array<(request: ClientRequest) => void>;
    listeners(event: 'response'): Array<(response: ServerResponse | typeof ResponseLike) => void>;
    listeners(event: 'error'): Array<(error: RequestError | CacheError) => void>;
    rawListeners(event: 'request'): Array<(request: ClientRequest) => void>;
    rawListeners(event: 'response'): Array<(response: ServerResponse | typeof ResponseLike) => void>;
    rawListeners(event: 'error'): Array<(error: RequestError | CacheError) => void>;
    emit(event: 'request', request: ClientRequest): boolean;
    emit(event: 'response', response: ServerResponse | typeof ResponseLike): boolean;
    emit(event: 'error', error: RequestError | CacheError): boolean;
    eventNames(): Array<'request' | 'response' | 'error'>;
    listenerCount(type: 'request' | 'response' | 'error'): number;
}
export declare class RequestError extends Error {
    constructor(error: Error);
}
export declare class CacheError extends Error {
    constructor(error: Error);
}
export interface UrlOption {
    path: string;
    pathname?: string;
    search?: string;
}
//# sourceMappingURL=types.d.ts.map