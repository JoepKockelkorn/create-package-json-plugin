# CreatePackageJsonPlugin

This workspace serves one single purpose: to show showcase a custom nx plugin to generate a package.json dynamically by using the nx dependency graph.

Run `npx nx build my-app` for an example output in `apps/my-app/dist/package.json`.

## Features

- Collect dynamic dependencies from source code. In `apps/my-app/src/index.ts` lodash is imported, which ends up under dependencies in the resulting package.json.
- Collect hard dependencies from package.json. In `apps/my-app/package.json`, `@swc/helpers` is imported with a placeholder value. Notice the resulting package.json has the version of the root package.json for this import.
- Ignore certain dependencies using a minimatch glob (see `apps/my-app/project.json` 'excludedFilesGlobs' config option). Ignore any code used only in development (i.e. a serve command). `dev-helpers/index.ts` imports code from prettier, but does not end up in package.json.
