import path from 'path';

import {
  ExecutorContext,
  FileData,
  ProjectGraph,
  readCachedProjectGraph,
  writeJsonFile,
} from '@nrwl/devkit';
import { createPackageJson } from '@nrwl/js';
import { ensureDir } from 'fs-extra';
import partition from 'lodash/partition';
import minimatch from 'minimatch';

import { CreatePackageJsonExecutorSchema } from './schema';

export default async function (
  options: CreatePackageJsonExecutorSchema,
  context: ExecutorContext
) {
  ensureDir(options.outputPath);
  if (!context.projectName)
    throw new Error('This executor should execute on a project');
  const projectRoot =
    context.workspace?.projects[context.projectName].sourceRoot;
  if (!projectRoot) throw new Error('Projectroot should exist');

  const depGraph = readCachedProjectGraph();
  if ((options.excludedFilesGlobs ?? []).length > 0) {
    filterDependenciesByExcludedFilesGlobs(
      depGraph,
      context.projectName,
      projectRoot,
      options.excludedFilesGlobs ?? []
    );
  }

  const packageJson = createPackageJson(context.projectName, depGraph, {
    root: context.root,
  });
  writeJsonFile(`${options.outputPath}/package.json`, packageJson);

  return { success: true };
}

function filterDependenciesByExcludedFilesGlobs(
  depGraph: ProjectGraph,
  projectName: string,
  projectRoot: string,
  excludedFilesGlobs: string[]
) {
  const projectNode = depGraph.nodes[projectName];
  const [excludedFiles, includedFiles] = partition(
    projectNode.data.files,
    fileShouldBeExcluded
  );
  const possibleDepsToRemove = collectDepsFromFilesAndDedupe(excludedFiles);
  const depsToRemove = possibleDepsToRemove.filter((dep) =>
    depNotUsedInOtherFiles(includedFiles, dep)
  );
  depGraph.dependencies[projectName] = depGraph.dependencies[
    projectName
  ].filter((dep) => !depsToRemove.includes(dep.target));

  /** A file should be excluded if it matches any of the globs */
  function fileShouldBeExcluded(f: FileData): boolean {
    return excludedFilesGlobs.some((glob) =>
      minimatch(f.file, path.join(projectRoot, glob))
    );
  }
}

function depNotUsedInOtherFiles(
  includedFiles: FileData[],
  dep: string
): unknown {
  return !includedFiles.some((file) => (file.deps ?? []).includes(dep));
}

function collectDepsFromFilesAndDedupe(excludedFiles: FileData[]) {
  const allDeps = excludedFiles.reduce((acc, curr) => {
    (curr.dependencies ?? []).forEach((dep) => acc.add(dep.target));
    return acc;
  }, new Set<string>());
  const dedupedDeps = Array.from(allDeps);
  return dedupedDeps;
}
