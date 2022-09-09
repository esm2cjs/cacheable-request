# @esm2cjs/cacheable-request

This is a fork of https://github.com/jaredwray/cacheable-request, but automatically patched to support ESM **and** CommonJS, unlike the original repository.

## Install

You can use an npm alias to install this package under the original name:

```
npm i cacheable-request@npm:@esm2cjs/cacheable-request
```

```jsonc
// package.json
"dependencies": {
    "cacheable-request": "npm:@esm2cjs/cacheable-request"
}
```

but `npm` might dedupe this incorrectly when other packages depend on the replaced package. If you can, prefer using the scoped package directly:

```
npm i @esm2cjs/cacheable-request
```

```jsonc
// package.json
"dependencies": {
    "@esm2cjs/cacheable-request": "^ver.si.on"
}
```

## Usage

```js
// Using ESM import syntax
import CacheableRequest from "@esm2cjs/cacheable-request";

// Using CommonJS require()
const CacheableRequest = require("@esm2cjs/cacheable-request").default;
```

> **Note:**
> Because the original module uses `export default`, you need to append `.default` to the `require()` call.

For more details, please see the original [repository](https://github.com/jaredwray/cacheable-request).

## Sponsoring

To support my efforts in maintaining the ESM/CommonJS hybrid, please sponsor [here](https://github.com/sponsors/AlCalzone).

To support the original author of the module, please sponsor [here](https://github.com/jaredwray/cacheable-request).
