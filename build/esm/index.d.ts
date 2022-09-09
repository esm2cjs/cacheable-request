/// <reference types="node" />
/// <reference types="node" />
import EventEmitter from 'node:events';
declare const CacheableRequest: {
    (request: Function, cacheAdapter?: any): (options: any, cb?: ((response: Record<string, unknown>) => void) | undefined) => EventEmitter;
    addHook(name: string, fn: Function): void;
    removeHook(name: string): boolean;
    getHook(name: string): any;
    runHook(name: string, response: any): Promise<any>;
    RequestError: {
        new (error: any): {
            name: string;
            message: string;
            stack?: string | undefined;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
    CacheError: {
        new (error: any): {
            name: string;
            message: string;
            stack?: string | undefined;
        };
        captureStackTrace(targetObject: object, constructorOpt?: Function | undefined): void;
        prepareStackTrace?: ((err: Error, stackTraces: NodeJS.CallSite[]) => any) | undefined;
        stackTraceLimit: number;
    };
};
export default CacheableRequest;
//# sourceMappingURL=index.d.ts.map