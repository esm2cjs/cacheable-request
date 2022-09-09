"use strict";
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var esm_exports = {};
__export(esm_exports, {
  default: () => esm_default
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
const hooks = /* @__PURE__ */ new Map();
const CacheableRequest = function(request, cacheAdapter) {
  let cache = {};
  if (cacheAdapter instanceof import_keyv.default) {
    cache = cacheAdapter;
  } else {
    cache = new import_keyv.default({
      uri: typeof cacheAdapter === "string" && cacheAdapter || "",
      store: typeof cacheAdapter !== "string" && cacheAdapter,
      namespace: "cacheable-request"
    });
  }
  return createCacheableRequest(request, cache);
};
function createCacheableRequest(request, cache) {
  return (options, cb) => {
    let url;
    if (typeof options === "string") {
      url = normalizeUrlObject(import_node_url.default.parse(options));
      options = {};
    } else if (options instanceof import_node_url.default.URL) {
      url = normalizeUrlObject(import_node_url.default.parse(options.toString()));
      options = {};
    } else {
      const [pathname, ...searchParts] = (options.path || "").split("?");
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
    options.headers = Object.fromEntries(Object.entries(options.headers).map(([key2, value]) => [key2.toLowerCase(), value]));
    const ee = new import_node_events.default();
    const normalizedUrlString = (0, import_normalize_url.default)(import_node_url.default.format(url), {
      stripWWW: false,
      removeTrailingSlash: false,
      stripAuthentication: false
    });
    let key = `${options.method}:${normalizedUrlString}`;
    if (options.body && ["POST", "PATCH", "PUT"].includes(options.method)) {
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
      let requestErrorCallback;
      const requestErrorPromise = new Promise((resolve) => {
        requestErrorCallback = () => {
          if (!requestErrored) {
            requestErrored = true;
            resolve();
          }
        };
      });
      const handler = (response) => {
        if (revalidate) {
          response.status = response.statusCode;
          const revalidatedPolicy = import_http_cache_semantics.default.fromObject(revalidate.cachePolicy).revalidatedPolicy(options_, response);
          if (!revalidatedPolicy.modified) {
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
                new Promise((resolve) => response.once("end", resolve))
              ]);
              const body = await bodyPromise;
              const value = {
                cachePolicy: response.cachePolicy.toObject(),
                url: response.url,
                statusCode: response.fromCache ? revalidate.statusCode : response.statusCode,
                body
              };
              let ttl = options_.strictTtl ? response.cachePolicy.timeToLive() : void 0;
              if (options_.maxTtl) {
                ttl = ttl ? Math.min(ttl, options_.maxTtl) : options_.maxTtl;
              }
              if (hooks.size > 0) {
                for (const key_ of hooks.keys()) {
                  value.body = await CacheableRequest.runHook(key_, value.body);
                }
              }
              await cache.set(key, value, ttl);
            } catch (error) {
              ee.emit("error", new CacheableRequest.CacheError(error));
            }
          })();
        } else if (options_.cache && revalidate) {
          (async () => {
            try {
              await cache.delete(key);
            } catch (error) {
              ee.emit("error", new CacheableRequest.CacheError(error));
            }
          })();
        }
        ee.emit("response", clonedResponse || response);
        if (typeof cb === "function") {
          cb(clonedResponse || response);
        }
      };
      try {
        const request_ = request(options_, handler);
        request_.once("error", requestErrorCallback);
        request_.once("abort", requestErrorCallback);
        ee.emit("request", request_);
      } catch (error) {
        ee.emit("error", new CacheableRequest.RequestError(error));
      }
    };
    (async () => {
      const get = async (options_) => {
        await Promise.resolve();
        const cacheEntry = options_.cache ? await cache.get(key) : void 0;
        if (typeof cacheEntry === "undefined" && !options_.forceRefresh) {
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
          await cache.delete(key);
          options_.headers = policy.revalidationHeaders(options_);
          makeRequest(options_);
        } else {
          revalidate = cacheEntry;
          options_.headers = policy.revalidationHeaders(options_);
          makeRequest(options_);
        }
      };
      const errorHandler = (error) => ee.emit("error", new CacheableRequest.CacheError(error));
      cache.once("error", errorHandler);
      ee.on("response", () => cache.removeListener("error", errorHandler));
      try {
        await get(options);
      } catch (error) {
        if (options.automaticFailover && !madeRequest) {
          makeRequest(options);
        }
        ee.emit("error", new CacheableRequest.CacheError(error));
      }
    })();
    return ee;
  };
}
CacheableRequest.addHook = (name, fn) => {
  if (!hooks.has(name)) {
    hooks.set(name, fn);
  }
};
CacheableRequest.removeHook = (name) => hooks.delete(name);
CacheableRequest.getHook = (name) => hooks.get(name);
CacheableRequest.runHook = async (name, response) => {
  if (!response) {
    return new CacheableRequest.CacheError(new Error("runHooks requires response argument"));
  }
  return hooks.get(name)(response);
};
function cloneResponse(response) {
  const clone = new import_node_stream.PassThrough({ autoDestroy: false });
  (0, import_mimic_response.default)(response, clone);
  return response.pipe(clone);
}
function urlObjectToRequestOptions(url) {
  const options = { ...url };
  options.path = `${url.pathname || "/"}${url.search || ""}`;
  delete options.pathname;
  delete options.search;
  return options;
}
function normalizeUrlObject(url) {
  return {
    protocol: url.protocol,
    auth: url.auth,
    hostname: url.hostname || url.host || "localhost",
    port: url.port,
    pathname: url.pathname,
    search: url.search
  };
}
function convertHeaders(headers) {
  const result = {};
  for (const name of Object.keys(headers)) {
    result[name.toLowerCase()] = headers[name];
  }
  return result;
}
CacheableRequest.RequestError = class extends Error {
  constructor(error) {
    super(error.message);
    this.name = "RequestError";
    Object.assign(this, error);
  }
};
CacheableRequest.CacheError = class extends Error {
  constructor(error) {
    super(error.message);
    this.name = "CacheError";
    Object.assign(this, error);
  }
};
var esm_default = CacheableRequest;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
//# sourceMappingURL=index.js.map
