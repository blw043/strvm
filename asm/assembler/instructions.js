const {ops} = require('../../strvm');
const {intTypes} = require('./types');

const instrTable = [
  {op:'str',    opcode: 0x1000, args: ['a32', 'u12']},
  {op:'br',     opcode: 0x2000, args: ['r12']},
  {op:'bz',     opcode: 0x3000, args: ['r12']},
  {op:'bnz',    opcode: 0x4000, args: ['r12']},
  {op:'callr',  opcode: 0x5000, args: ['r12']},
  {op:'int12',  opcode: 0x7000, args: ['i12']},
  
  {op:'pstr',   opcode: 0x0100, args: ['u8']},
  {op:'pnum',   opcode: 0x0200, args: ['u8']},
  {op:'dupn',   opcode: 0x0300, args: ['u8']},
  {op:'dupni',  opcode: 0x0400, args: ['u8', 'u16']},
  {op:'putni',  opcode: 0x0500, args: ['u8', 'u16']},
  {op:'popn',   opcode: 0x0600, args: ['u8']},
  {op:'lcatn',  opcode: 0x0700, args: ['u8']},
  {op:'rcatn',  opcode: 0x0800, args: ['u8']},
  {op:'dupi',   opcode: 0x0900, args: ['u8']},
  {op:'puti',   opcode: 0x0A00, args: ['u8']},
  {op:'dupfp',  opcode: 0x0B00, args: ['u8']},
  {op:'putfp',  opcode: 0x0C00, args: ['u8']},
  {op:'swapi',  opcode: 0x0D00, args: ['u8']},
  {op:'getvr',  opcode: 0x0E00, args: ['u8']},
  {op:'putvr',  opcode: 0x0F00, args: ['u8']},

  {op:'int16',  opcode: 0x0020, args: ['i16']},
  {op:'int32',  opcode: 0x0021, args: ['i32']},
  {op:'jmp',    opcode: 0x0022, args: ['u32']},
  {op:'ret',    opcode: 0x0023, args: []},
  {op:'call',   opcode: 0x0024, args: ['u32']},
  {op:'calli',  opcode: 0x0025, args: []},

  {op:'ldfp',   opcode: 0x0028, args: []},
  {op:'stfp',   opcode: 0x0029, args: []},
  {op:'upfp',   opcode: 0x002a, args: []},
  {op:'add',    opcode: 0x002b, args: []},
  {op:'sub',    opcode: 0x002c, args: []},
  {op:'mul',    opcode: 0x002d, args: []},
  {op:'div',    opcode: 0x002e, args: []},
  {op:'mod',    opcode: 0x002f, args: []},

  {op:'and',    opcode: 0x0030, args: []},
  {op:'or',     opcode: 0x0031, args: []},
  {op:'xor',    opcode: 0x0032, args: []},
  {op:'neg',    opcode: 0x0033, args: []},
  {op:'not',    opcode: 0x0034, args: []},
  {op:'cpl',    opcode: 0x0035, args: []},
  {op:'land',   opcode: 0x0039, args: []},
  {op:'lor',    opcode: 0x003a, args: []},
  {op:'shl',    opcode: 0x003c, args: []},
  {op:'shr',    opcode: 0x003d, args: []},
  {op:'asr',    opcode: 0x003e, args: []},
  {op:'shlv',   opcode: 0x003f, args: ['i16']},

  {op:'shrv',   opcode: 0x0040, args: ['i16']},
  {op:'asrv',   opcode: 0x0041, args: ['i16']},
  {op:'lt',     opcode: 0x0042, args: []},
  {op:'gt',     opcode: 0x0043, args: []},
  {op:'le',     opcode: 0x0044, args: []},
  {op:'ge',     opcode: 0x0045, args: []},
  {op:'eq',     opcode: 0x0046, args: []},
  {op:'ne',     opcode: 0x0047, args: []},
  {op:'tostr',  opcode: 0x0048, args: []},
  {op:'tonum',  opcode: 0x0049, args: []},
  {op:'toint',  opcode: 0x004a, args: []},
  {op:'isnum',  opcode: 0x004b, args: []},
  {op:'isstr',  opcode: 0x004c, args: []},
  {op:'newfp',  opcode: 0x004d, args: []},
  {op:'ldpc',   opcode: 0x004e, args: []},
  {op:'plural', opcode: 0x004f, args: []},

  {op:'inc',    opcode: 0x0050, args: []},
  {op:'dec',    opcode: 0x0051, args: []},
  {op:'retv',   opcode: 0x0052, args: []},

  {op:'schr',   opcode: 0x005a, args: []},
  {op:'char',   opcode: 0x005b, args: []},
  {op:'halt',   opcode: 0x00fe, args: []},
  {op:'nop',    opcode: 0x00ff, args: []},
]

var instrMap = {};
(function() {
  for(var i = 0; i < instrTable.length; i++) {
    var entry = instrTable[i];
    var nargs = entry.args.length;
    if(!instrMap[entry.op])
      instrMap[entry.op] = {};
    instrMap[entry.op][nargs] = entry;

    entry.size = getInstrLength(entry);
  }
})();

function lookupInstr(opname, operands) {
  opname = opname.toLowerCase();
  var nargs = operands.length;
  if(!instrMap[opname])
    throw new Error(`unknown instruction "${opname}"`);
  if(!instrMap[opname][nargs])
    throw new Error(`invalid number of operands (${nargs}) for "${opcode}"`);
  return instrMap[opname][nargs];
}

/** Returns the machine code size in words of an instruction */
function getInstrLength(instrSpec) {
  var argTypes = instrSpec.args;
  var len = 1;  // start with one word for the opcode
  for(var i = 0; i < argTypes.length; i++) {
    len += intTypes[argTypes[i]].size;
  }
  return len;
}

module.exports = {
  instrTable,
  instrMap,
  lookupInstr,
  getInstrLength,
};