#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const babel = require('@babel/core');

const t = require('@babel/types');
const exists = require('exists-case');

let errors = [];

const filenames = process.argv.slice(2);

//  读取修改的文件
//  检查import是否有大小写不匹配的
filenames.forEach((filename) => {
  const code = fs.readFileSync(filename, 'utf-8');
  const result = babel.parseSync(code);
  if (!result) {
    return;
  }
  const { body } = result.program;
  if (!Array.isArray(body)) {
    return;
  }
  let errorForFile = null;
  body.forEach((item) => {
    if (t.isImportDeclaration(item)) {
      const sourceValue = item.source.value;
      if (!sourceValue.startsWith('.')) {
        return;
      }
      const absPath = path.resolve(path.dirname(filename), `${sourceValue}.js`);
      const ext = path.extname(absPath);
      if (ext && !['.js', '.jsx', '.ts', '.tsx'].includes(ext)) {
        return;
      }
      const isExisted = exists.sync(absPath);
      if (isExisted) {
        return;
      }
      if (errorForFile === null) {
        errorForFile = {
          name: filename,
          list: [],
        };
      }
      console.log(item.loc.start.line);
      errorForFile.list.push({ line: item.loc.start.line, source: absPath });
    }
  });
  if (errorForFile) {
    errors.push(errorForFile);
  }
});

if (errors.length > 0) {
  // console.log(errors, '---- errors');
  errors.forEach(({ name, list }) => {
    console.log(chalk.underline.red(name));
    list.forEach((item) => {
      const { line, source } = item;
      console.log(
        'Line: ' +
          chalk.yellow(line) +
          ' source not found: ' +
          chalk.yellowBright(source) +
          '\n'
      );
    });
  });
  process.exit(1);
}

process.exit();
