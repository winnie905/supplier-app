/**
 * 用 BFF 的 introspection 结果校验本地 GraphQL document 与线上 schema 是否一致。
 *
 * 用法：
 *   node scripts/validateGraphqlOperations.js [--schema=introspection.json] [目标目录...]
 * 未指定 --schema 时实时拉取 GRAPHQL_URL 的 schema；未指定目录时校验 src/graphql/operations。
 */
const fs = require('fs');

const { buildClientSchema, getIntrospectionQuery, parse, validate } = require('graphql');

const { loadDocuments } = require('./graphqlDocuments');

const DEFAULT_TARGET = 'src/graphql/operations';
const GRAPHQL_URL = process.env.GRAPHQL_URL ?? 'https://dev.api.apex-bff.dnjapex.com/graphql';

const loadIntrospection = async (schemaPath) => {
  if (schemaPath) return JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: getIntrospectionQuery() }),
  });
  return response.json();
};

const main = async () => {
  const args = process.argv.slice(2);
  const schemaArg = args.find((arg) => arg.startsWith('--schema='));
  const targets = args.filter((arg) => !arg.startsWith('--'));

  const introspection = await loadIntrospection(schemaArg?.slice('--schema='.length));
  const schema = buildClientSchema(introspection.data);

  const failures = [];
  let checked = 0;

  for (const { file, document } of loadDocuments(targets.length > 0 ? targets : [DEFAULT_TARGET])) {
    checked += 1;
    const errors = validate(schema, parse(document));
    if (errors.length > 0) {
      failures.push({ file, errors });
    }
  }

  for (const { file, errors } of failures) {
    console.error(`\n✗ ${file}`);
    for (const error of errors) console.error(`  - ${error.message}`);
  }

  if (failures.length > 0) {
    console.error(`\n${failures.length} document(s) failed validation.`);
    process.exit(1);
  }
  console.log(`All ${checked} GraphQL documents match the schema.`);
};

void main();
