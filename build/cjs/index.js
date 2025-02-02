var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var esm_exports = {};
__export(esm_exports, {
  default: () => esm_default,
  onResponse: () => onResponse
});
module.exports = __toCommonJS(esm_exports);
var import_node_events = __toESM(require("node:events"));
var import_node_url = __toESM(require("node:url"));
var import_node_crypto = __toESM(require("node:crypto"));
var import_node_stream = __toESM(require("node:stream"));
var import_normalize_url = __toESM(require("@esm2cjs/normalize-url"));
var import_get_stream = __toESM(require("get-stream"));
var import_http_cache_semantics = __toESM(require("http-cache-semantics"));
var import_responselike = __toESM(require("@esm2cjs/responselike"));
var import_keyv = __toESM(require("keyv"));
var import_mimic_response = __toESM(require("@esm2cjs/mimic-response"));
var import_types = require("./types.js");
__reExport(esm_exports, require("./types.js"), module.exports);
class CacheableRequest {
  constructor(cacheRequest, cacheAdapter) {
    this.hooks = /* @__PURE__ */ new Map();
    this.request = () => (options, cb) => {
      var _a;
      let url;
      if (typeof options === "string") {
        url = normalizeUrlObject(import_node_url.default.parse(options));
        options = {};
      } else if (options instanceof import_node_url.default.URL) {
        url = normalizeUrlObject(import_node_url.default.parse(options.toString()));
        options = {};
      } else {
        const [pathname, ...searchParts] = ((_a = options.path) != null ? _a : "").split("?");
        const search = searchParts.length > 0 ? `?${searchParts.join("?")}` : "";
        url = normalizeUrlObject({ ...options, pathname, search });
      }
      options = {
        headers: {},
        method: "GET",
        cache: true,
        strictTtl: false,
        automaticFailover: false,
        ...options,
        ...urlObjectToRequestOptions(url)
      };
      options.headers = Object.fromEntries(entries(options.headers).map(([key2, value]) => [key2.toLowerCase(), value]));
      const ee = new import_node_events.default();
      const normalizedUrlString = (0, import_normalize_url.default)(import_node_url.default.format(url), {
        stripWWW: false,
        removeTrailingSlash: false,
        stripAuthentication: false
      });
      let key = `${options.method}:${normalizedUrlString}`;
      if (options.body && options.method !== void 0 && ["POST", "PATCH", "PUT"].includes(options.method)) {
        if (options.body instanceof import_node_stream.default.Readable) {
          options.cache = false;
        } else {
          key += `:${import_node_crypto.default.createHash("md5").update(options.body).digest("hex")}`;
        }
      }
      let revalidate = false;
      let madeRequest = false;
      const makeRequest = (options_) => {
        madeRequest = true;
        let requestErrored = false;
        let requestErrorCallback = () => {
        };
        const requestErrorPromise = new Promise((resolve) => {
          requestErrorCallback = () => {
            if (!requestErrored) {
              requestErrored = true;
              resolve();
            }
          };
        });
        const handler = async (response) => {
          if (revalidate) {
            response.status = response.statusCode;
            const revalidatedPolicy = import_http_cache_semantics.default.fromObject(revalidate.cachePolicy).revalidatedPolicy(options_, response);
            if (!revalidatedPolicy.modified) {
              response.resume();
              await new Promise((resolve) => {
                response.once("end", resolve);
              });
              const headers = convertHeaders(revalidatedPolicy.policy.responseHeaders());
              response = new import_responselike.default({ statusCode: revalidate.statusCode, headers, body: revalidate.body, url: revalidate.url });
              response.cachePolicy = revalidatedPolicy.policy;
              response.fromCache = true;
            }
          }
          if (!response.fromCache) {
            response.cachePolicy = new import_http_cache_semantics.default(options_, response, options_);
            response.fromCache = false;
          }
          let clonedResponse;
          if (options_.cache && response.cachePolicy.storable()) {
            clonedResponse = cloneResponse(response);
            (async () => {
              try {
                const bodyPromise = import_get_stream.default.buffer(response);
                await Promise.race([
                  requestErrorPromise,
                  new Promise((resolve) => response.once("end", resolve)),
                  new Promise((resolve) => response.once("close", resolve))
                ]);
                const body = await bodyPromise;
                let value = {
                  url: response.url,
                  statusCode: response.fromCache ? revalidate.statusCode : response.statusCode,
                  body,
                  cachePolicy: response.cachePolicy.toObject()
                };
                let ttl = options_.strictTtl ? response.cachePolicy.timeToLive() : void 0;
                if (options_.maxTtl) {
                  ttl = ttl ? Math.min(ttl, options_.maxTtl) : options_.maxTtl;
                }
                if (this.hooks.size > 0) {
                  for (const key_ of this.hooks.keys()) {
                    value = await this.runHook(key_, value, response);
                  }
                }
                await this.cache.set(key, value, ttl);
              } catch (error) {
                ee.emit("error", new import_types.CacheError(error));
              }
            })();
          } else if (options_.cache && revalidate) {
            (async () => {
              try {
                await this.cache.delete(key);
              } catch (error) {
                ee.emit("error", new import_types.CacheError(error));
              }
            })();
          }
          ee.emit("response", clonedResponse != null ? clonedResponse : response);
          if (typeof cb === "function") {
            cb(clonedResponse != null ? clonedResponse : response);
          }
        };
        try {
          const request_ = this.cacheRequest(options_, handler);
          request_.once("error", requestErrorCallback);
          request_.once("abort", requestErrorCallback);
          request_.once("destroy", requestErrorCallback);
          ee.emit("request", request_);
        } catch (error) {
          ee.emit("error", new import_types.RequestError(error));
        }
      };
      (async () => {
        const get = async (options_) => {
          await Promise.resolve();
          const cacheEntry = options_.cache ? await this.cache.get(key) : void 0;
          if (cacheEntry === void 0 && !options_.forceRefresh) {
            makeRequest(options_);
            return;
          }
          const policy = import_http_cache_semantics.default.fromObject(cacheEntry.cachePolicy);
          if (policy.satisfiesWithoutRevalidation(options_) && !options_.forceRefresh) {
            const headers = convertHeaders(policy.responseHeaders());
            const response = new import_responselike.default({ statusCode: cacheEntry.statusCode, headers, body: cacheEntry.body, url: cacheEntry.url });
            response.cachePolicy = policy;
            response.fromCache = true;
            ee.emit("response", response);
            if (typeof cb === "function") {
              cb(response);
            }
          } else if (policy.satisfiesWithoutRevalidation(options_) && Date.now() >= policy.timeToLive() && options_.forceRefresh) {
            await this.cache.delete(key);
            options_.headers = policy.revalidationHeaders(options_);
            makeRequest(options_);
          } else {
            revalidate = cacheEntry;
            options_.headers = policy.revalidationHeaders(options_);
            makeRequest(options_);
          }
        };
        const errorHandler = (error) => ee.emit("error", new import_types.CacheError(error));
        if (this.cache instanceof import_keyv.default) {
          const cachek = this.cache;
          cachek.once("error", errorHandler);
          ee.on("error", () => cachek.removeListener("error", errorHandler));
          ee.on("response", () => cachek.removeListener("error", errorHandler));
        }
        try {
          await get(options);
        } catch (error) {
          if (options.automaticFailover && !madeRequest) {
            makeRequest(options);
          }
          ee.emit("error", new import_types.CacheError(error));
        }
      })();
      return ee;
    };
    this.addHook = (name, fn) => {
      if (!this.hooks.has(name)) {
        this.hooks.set(name, fn);
      }
    };
    this.removeHook = (name) => this.hooks.delete(name);
    this.getHook = (name) => this.hooks.get(name);
    this.runHook = async (name, ...args) => {
      var _a;
      return (_a = this.hooks.get(name)) == null ? void 0 : _a(...args);
    };
    if (cacheAdapter instanceof import_keyv.default) {
      this.cache = cacheAdapter;
    } else if (typeof cacheAdapter === "string") {
      this.cache = new import_keyv.default({
        uri: cacheAdapter,
        namespace: "cacheable-request"
      });
    } else {
      this.cache = new import_keyv.default({
        store: cacheAdapter,
        namespace: "cacheable-request"
      });
    }
    this.request = this.request.bind(this);
    this.cacheRequest = cacheRequest;
  }
}
const entries = Object.entries;
const cloneResponse = (response) => {
  const clone = new import_node_stream.PassThrough({ autoDestroy: false });
  (0, import_mimic_response.default)(response, clone);
  return response.pipe(clone);
};
const urlObjectToRequestOptions = (url) => {
  const options = { ...url };
  options.path = `${url.pathname || "/"}${url.search || ""}`;
  delete options.pathname;
  delete options.search;
  return options;
};
const normalizeUrlObject = (url) => ({
  protocol: url.protocol,
  auth: url.auth,
  hostname: url.hostname || url.host || "localhost",
  port: url.port,
  pathname: url.pathname,
  search: url.search
});
const convertHeaders = (headers) => {
  const result = [];
  for (const name of Object.keys(headers)) {
    result[name.toLowerCase()] = headers[name];
  }
  return result;
};
var esm_default = CacheableRequest;
const onResponse = "onResponse";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  onResponse
});
//# sourceMappingURL=index.js.map
