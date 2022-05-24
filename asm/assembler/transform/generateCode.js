const {lookupInstr} = require("../instructions");
const emitListing = require("../listing");
const {intTypes} = require("../types");
const createVisitor = require("./transformer");

const generateCode = createVisitor(defVisitor => ({
  Program(node, visit) {
    this.locals.output = '';
    defVisitor.Program.call(this, node, visit);
    return this.locals.output;
  },
  Directive(node) {
    switch(node.op) {
      case '.ds': {
        const size = node.args[0].value;
        for(let i = 0; i < size; i++) {
          this.locals.output += '\u0000';
        }
      }
      case '.dw': 
        this.locals.output += dw(node.addr, node.args.map(n => n.value));
        break;
      case '.dl':
        this.locals.output += dl(node.addr, node.args.map(n => n.value));
        break;
    }
  },
  Instruction(node) {
    var argValues = node.args.map(n => n.value);
    this.locals.output += emitInstr(node.addr, node.op, argValues);
  }
}));

function dw(pc, values) {
  var out = '';
  values.forEach(v => {
    if(typeof v === 'string') {
      out += v;
    } else if(typeof v === 'number') {
      out += String.fromCharCode(v);
    }
  });
  // emitListing(pc, out);
  return out;
}

function dl(pc, values) {
  var out = '';
  values.forEach(v => {
    out += String.fromCharCode(v >>> 16);
    out += String.fromCharCode(v);
  });
  // emitListing(pc, out);
  return out;
}

function emitInstr(pc, opname, operands) {
  var instr = lookupInstr(opname, operands);
  var result = [instr.opcode];
  for(var i = 0; i < instr.args.length; i++) {
    var value = operands[i];
    switch(instr.args[i]) {
      case 'i8':
      case 'u8':
        value &= intTypes.u8.max;
        result[0] |= value;
        break;
      case 'i12':
      case 'u12':
        value &= intTypes.u12.max;
        result[0] |= value;
        break;
      case 'r12':
        value = (value - pc - instr.size) & intTypes.u12.max;
        result[0] |= value;
        break;
      case 'i16':
      case 'u16':
        result.push(value & intTypes.u16.max);
        break;
      case 'i32':
        result.push((value >> 16) & 0xffff);
        result.push(value & 0xffff);
        break;
      case 'u32':
      case 'a32':
        result.push((value >>> 16) & 0xffff);
        result.push(value & 0xffff);
        break;
    }
  }
  var out = String.fromCharCode.apply(null, result);
  // emitListing(pc, out);
  return out;
}

module.exports = generateCode;