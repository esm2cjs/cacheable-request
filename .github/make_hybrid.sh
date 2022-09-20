#!/bin/bash

set -e

# un-ignore build folder
sed -i 's#^/build$##' .gitignore
sed -i 's#^build/$##' .gitignore

TSCONFIG=$(cat tsconfig.build.json | jq '
	.compilerOptions.outDir = "build/esm"
	| .compilerOptions.target = "ES2020"
	| .compilerOptions.module = "ES2020"
')
echo "$TSCONFIG" > tsconfig.build.json

sed -i 's#"moduleResolution": "Node16"#"moduleResolution": "Node"#g' tsconfig.json

# Replace module imports in all ts files
readarray -d '' files < <(find src \( -name "*.js" -o -name "*.ts" \) -print0)
function replace_imports () {
	from=$1
	to="${2:-@esm2cjs/$from}"
	for file in "${files[@]}" ; do
		sed -i "s#'$from'#'$to'#g" "$file"
	done
}
# replace_imports "FROM" "@esm2cjs/TO"
replace_imports "mimic-response"
replace_imports "normalize-url"
replace_imports "responselike"

PJSON=$(cat package.json | jq --tab '
	del(.type)
	| .description = .description + ". This is a fork of " + .repository + ", but with CommonJS support."
	| .repository = "esm2cjs/" + .name
	| .name |= "@esm2cjs/" + .
	| .author = { "name": "Dominic Griesel", "email": "d.griesel@gmx.net" }
	| .publishConfig = { "access": "public" }
	| .funding = "https://github.com/sponsors/AlCalzone"
	| .main = "build/cjs/index.js"
	| .module = "build/esm/index.js"
	| .files = ["build/"]
	| .exports = {}
	| .exports["."].import = "./build/esm/index.js"
	| .exports["."].require = "./build/cjs/index.js"
	| .exports["./package.json"] = "./package.json"
	| .types = "build/esm/index.d.ts"
	| .typesVersions = {}
	| .typesVersions["*"] = {}
	| .typesVersions["*"]["build/esm/index.d.ts"] = ["build/esm/index.d.ts"]
	| .typesVersions["*"]["build/cjs/index.d.ts"] = ["build/esm/index.d.ts"]
	| .typesVersions["*"]["*"] = ["build/esm/*"]

	| .dependencies["@esm2cjs/mimic-response"] = .dependencies["mimic-response"]
	| del(.dependencies["mimic-response"])
	| .dependencies["@esm2cjs/normalize-url"] = .dependencies["normalize-url"]
	| del(.dependencies["normalize-url"])
	| .dependencies["@esm2cjs/responselike"] = .dependencies["responselike"]
	| del(.dependencies["responselike"])

	| del(.devDependencies["@types/responselike"])
	| del(.devDependencies["@types/delay"])
	| del(.devDependencies["@types/get-stream"])

	| .scripts["to-cjs"] = "esm2cjs --in build/esm --out build/cjs -t node12"
	| del(.scripts.prepare)
	| .xo.ignores = ["build", "test", "**/*.test-d.ts", "**/*.d.ts"]
	| .xo.rules["@typescript-eslint/no-redundant-type-constituents"] = "off"
')
# Placeholder for custom deps:
	# | .dependencies["@esm2cjs/DEP"] = .dependencies["DEP"]
	# | del(.dependencies["DEP"])

echo "$PJSON" > package.json

# Update package.json -> version if upstream forgot to update it
if [[ ! -z "${TAG}" ]] ; then
	VERSION=$(echo "${TAG/v/}")
	PJSON=$(cat package.json | jq --tab --arg VERSION "$VERSION" '.version = $VERSION')
	echo "$PJSON" > package.json
fi

npm i
npm run build

npm i -D @alcalzone/esm2cjs
npm run to-cjs
npm uninstall -D @alcalzone/esm2cjs

PJSON=$(cat package.json | jq --tab 'del(.scripts["to-cjs"])')
echo "$PJSON" > package.json

# Tests are broken due to an incompatibility of pem with OpenSSL 3.0
# npm test