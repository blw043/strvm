const Lexer = require('../../asm/parser/lexer.js');
const assert = require('assert');
const fs = require('fs');
const {TokenType} = require('../../asm/parser/token');
const Parser = require('../../asm/parser/parser.js');
const {assemble} = require('../../asm');

const source = fs.readFileSync(
  require.resolve('./test1.txt'), 
  {encoding: 'utf-8'}
);
// console.log(source);

console.log(assemble(source, 'test'));
debugger;