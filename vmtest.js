// debugger;
const strvm = require('./strvm');
const op = strvm.ops;
const fs = require('fs');
const {assemble} = require('./asm');

const source = fs.readFileSync(
  require.resolve('./tests/asm/test1.txt'), 
  {encoding: 'utf-8'}
);

var prg = assemble(source);
console.log(prg);

var vm = new strvm();
for(var j = 0; j < 1; j++) {
  console.time('vm');
  try {
    for(var i = 0; i < 4; i++) {
      vm.reset(prg, ['foo', i % 3]);
      vm.run();
      console.log(vm.result);
    }
  } catch(e) {
    console.error(e);
  }
  console.timeEnd('vm');
}

