/**
 * eslint rule that ensures every require()'d and imported package is declared
 * in package.json. It is based on import/no-extraneous-dependencies.
 */

const path = require('path');
const readPkgUp = require('read-pkg-up');
const minimatch = require('minimatch');

const importType = require('eslint-plugin-import/lib/core/importType').default;
const isStaticRequire = require('eslint-plugin-import/lib/core/staticRequire').default;

function getDependencies(context) {
  try {
    const pkg = readPkgUp.sync({cwd: context.getFilename(), normalize: false});
    if (!pkg || !pkg.pkg) {
      return null;
    }
    const packageContent = pkg.pkg;
    return {
      dependencies: packageContent.dependencies || {},
      devDependencies: packageContent.devDependencies || {},
      optionalDependencies: packageContent.optionalDependencies || {},
      peerDependencies: packageContent.peerDependencies || {},
    };
  } catch (e) {
    return null;
  }
}

function reportIfMissing(context, deps, depsOptions, node, name) {
  if (importType(name, context) !== 'external') {
    return;
  }
  const splitName = name.split('/');
  const packageName = splitName[0][0] === '@'
    ? splitName.slice(0, 2).join('/')
    : splitName[0];
  const isInDeps = deps.dependencies[packageName] !== undefined;
  const isInDevDeps = deps.devDependencies[packageName] !== undefined;
  const isInOptDeps = deps.optionalDependencies[packageName] !== undefined;
  const isInPeerDeps = deps.peerDependencies[packageName] !== undefined;

  if (isInDeps ||
    (depsOptions.allowDevDeps && isInDevDeps) ||
    (depsOptions.allowPeerDeps && isInPeerDeps) ||
    (depsOptions.allowOptDeps && isInOptDeps)
  ) {
    return;
  }

  if (isInDevDeps && !depsOptions.allowDevDeps) {
    context.report({
      node,
      message:
        `'${packageName}' should be listed in the project's dependencies, ` +
        `not devDependencies.`,
    });
    return;
  }

  if (isInOptDeps && !depsOptions.allowOptDeps) {
    context.report({
      node,
      message:
        `'${packageName}' should be listed in the project's dependencies, ` +
        `not optionalDependencies.`,
    });
    return;
  }

  context.report({
    node,
    message: `'${packageName}' should be listed in the project's dependencies.`,
  });
}

function testConfig(config, filename) {
  // Simplest configuration first, either a boolean or nothing.
  if (typeof config === 'boolean' || typeof config === 'undefined') {
    return config;
  }
  // Array of globs.
  return config.some(c => (
    minimatch(filename, c) ||
    minimatch(filename, path.join(process.cwd(), c))
  ));
}

module.exports = {
  meta: {
    docs: {},

    schema: [
      {
        'type': 'object',
        'properties': {
          'devDependencies': { 'type': ['boolean', 'array'] },
          'optionalDependencies': { 'type': ['boolean', 'array'] },
          'peerDependencies': { 'type': ['boolean', 'array'] },
        },
        'additionalProperties': false,
      },
    ],
  },

  create(context) {
    const options = context.options[0] || {};
    const filename = context.getFilename();
    const deps = getDependencies(context);

    if (!deps) {
      return {};
    }

    const depsOptions = {
      allowDevDeps: testConfig(options.devDependencies, filename) !== false,
      allowOptDeps: testConfig(options.optionalDependencies, filename) !== false,
      allowPeerDeps: testConfig(options.peerDependencies, filename) !== false,
    };

    // todo: use module visitor from module-utils core
    return {
      ImportDeclaration: function (node) {
        reportIfMissing(context, deps, depsOptions, node, node.source.value);
      },
      CallExpression: function handleRequires(node) {
        if (isStaticRequire(node)) {
          reportIfMissing(context, deps, depsOptions, node, node.arguments[0].value);
        }
      },
    };
  },
};
