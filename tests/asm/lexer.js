const fs = require('fs');
const {assemble} = require('../../asm');

const source = fs.readFileSync(
  require.resolve('./test2.txt'), 
  {encoding: 'utf-8'}
);

console.log(assemble(source, 'test'));
debugger;