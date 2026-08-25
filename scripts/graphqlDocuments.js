/**
 * 从 src/graphql/operations 的 .ts 源码中提取 GraphQL document。
 * document 内的 ${FRAGMENT} 会用同目录树下定义的模板字符串常量展开，
 * 因此拆分 selection set 片段后仍能被静态校验。
 */
const fs = require('fs');
const path = require('path');

const collectFiles = (target, acc = []) => {
  const stat = fs.statSync(target);
  if (stat.isFile()) {
    if (target.endsWith('.ts')) acc.push(target);
    return acc;
  }
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.name === 'example') continue;
    collectFiles(path.join(target, entry.name), acc);
  }
  return acc;
};

/** 收集非 gql 的模板字符串常量，供 document 内 ${NAME} 插值还原 */
const collectFragments = (files) => {
  const fragments = {};
  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/const\s+([A-Z0-9_]+)\s*=\s*`([\s\S]*?)`;/g)) {
      fragments[match[1]] = match[2];
    }
  }
  return fragments;
};

const resolveInterpolations = (doc, fragments) => {
  let resolved = doc;
  for (let depth = 0; depth < 10 && resolved.includes('${'); depth += 1) {
    resolved = resolved.replace(/\$\{(\w+)\}/g, (placeholder, name) => {
      if (!(name in fragments)) {
        throw new Error(`未找到片段常量 ${name}`);
      }
      return fragments[name];
    });
  }
  return resolved;
};

/** 返回 [{ file, document }]，document 已展开插值 */
const loadDocuments = (targets) => {
  const files = [];
  for (const target of targets) {
    collectFiles(path.resolve(target), files);
  }
  files.sort();

  const fragments = collectFragments(files);
  const documents = [];

  for (const file of files) {
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(/gql`([\s\S]*?)`/g)) {
      documents.push({
        file: path.relative(process.cwd(), file),
        document: resolveInterpolations(match[1], fragments),
      });
    }
  }

  return documents;
};

module.exports = { loadDocuments };
