const ops = {};
const OP_STR    = ops.STR     = 0x1000;
const OP_BRA    = ops.BRA     = 0x2000;
const OP_BZ     = ops.BZ      = 0x3000;
const OP_BNZ    = ops.BNZ     = 0x4000;
const OP_CALLR  = ops.CALLR   = 0x5000;
const OP_INT12  = ops.INT12   = 0x7000;
                
const OP_PSTR   = ops.PSTR    = 0x0100;
const OP_PNUM   = ops.PNUM    = 0x0200;
const OP_DUPN   = ops.DUPN    = 0x0300;
const OP_DUPNI  = ops.DUPNI   = 0x0400;
const OP_PUTNI  = ops.PUTNI   = 0x0500;
const OP_POPN   = ops.POPN    = 0x0600;
const OP_LCATN  = ops.LCATN   = 0x0700;
const OP_RCATN  = ops.RCATN   = 0x0800;
const OP_DUPI   = ops.DUPI    = 0x0900;
const OP_PUTI   = ops.PUTI    = 0x0A00;
const OP_DUPFP  = ops.DUPFP   = 0x0B00;
const OP_PUTFP  = ops.PUTFP   = 0x0C00;
const OP_SWAPI  = ops.SWAPI   = 0x0D00;
const OP_GETVR  = ops.GETVR   = 0x0E00;
const OP_PUTVR  = ops.PUTVR   = 0x0F00;
                
const OP_INT16  = ops.INT16   = 0x0020;
const OP_INT32  = ops.INT32   = 0x0021;
const OP_JMP    = ops.JMP     = 0x0022;
const OP_RET    = ops.RET     = 0x0023;
const OP_CALL   = ops.CALL    = 0x0024;
const OP_CALLI  = ops.CALLI   = 0x0025;

const OP_LDFP   = ops.LDFP    = 0x0028;
const OP_STFP   = ops.STFP    = 0x0029;
const OP_UPFP   = ops.UPFP    = 0x002A;
const OP_ADD    = ops.ADD     = 0x002B;
const OP_SUB    = ops.SUB     = 0x002C;
const OP_MUL    = ops.MUL     = 0x002D;
const OP_DIV    = ops.DIV     = 0x002E;
const OP_MOD    = ops.MOD     = 0x002F;
const OP_AND    = ops.AND     = 0x0030;
const OP_OR     = ops.OR      = 0x0031;
const OP_XOR    = ops.XOR     = 0x0032;
const OP_NEG    = ops.NEG     = 0x0033;
const OP_NOT    = ops.NOT     = 0x0034;
const OP_CPL    = ops.CPL     = 0x0035;
const OP_LAND   = ops.LAND    = 0x0039;
const OP_LOR    = ops.LOR     = 0x003A;
const OP_SHL    = ops.SHL     = 0x003C;
const OP_SHR    = ops.SHR     = 0x003D;
const OP_ASR    = ops.ASR     = 0x003E;
const OP_SHLV   = ops.SHLV    = 0x003F;
const OP_SHRV   = ops.SHRV    = 0x0040;
const OP_ASRV   = ops.ASRV    = 0x0041;
const OP_LT     = ops.LT      = 0x0042;
const OP_GT     = ops.GT      = 0x0043;
const OP_LE     = ops.LE      = 0x0044;
const OP_GE     = ops.GE      = 0x0045;
const OP_EQ     = ops.EQ      = 0x0046;
const OP_NE     = ops.NE      = 0x0047;
const OP_TOSTR  = ops.TOSTR   = 0x0048;
const OP_TONUM  = ops.TONUM   = 0x0049;
const OP_TOINT  = ops.TOINT   = 0x004A;
const OP_ISNUM  = ops.ISNUM   = 0x004B;
const OP_ISSTR  = ops.ISSTR   = 0x004C;
const OP_NEWFP  = ops.NEWFP   = 0x004D;
const OP_LDPC   = ops.LDPC    = 0x004E;
const OP_PLURAL = ops.PLURAL  = 0x004F;
const OP_INC    = ops.INC     = 0x0050;
const OP_DEC    = ops.DEC     = 0x0051;
const OP_RETV   = ops.RETV    = 0x0052;
// memory load/store ops when RAM is implemented
// const OP_LDMB   = ops.LDMB    = 0x0054;
// const OP_LDMW   = ops.LDMW    = 0x0055;
// const OP_LDMD   = ops.LDMD    = 0x0056;
// const OP_STMB   = ops.STMB    = 0x0057;
// const OP_STMW   = ops.STMW    = 0x0058;
// const OP_STMD   = ops.STMD    = 0x0059;
const OP_SCHR   = ops.SCHR    = 0x005A;
const OP_CHAR   = ops.CHAR    = 0x005B;

const OP_HALT   = ops.HALT    = 0x00FE;

class StrVM {
  constructor() {
    this.stack = [];
    this.local = [];
  }

  reset(program, params) {
    this.program = program;
    this.pc = 0;
    this.fp = 0;
    this.sp = 0;
    this.stack.length = 0;
    this.params = params;
    this.done = false;
    this.result = null;
  }
  
  readInt16() {
    return this.program.charCodeAt(this.pc++);
  }
  
  readInt32() {
    // var program = this.program;
    var tmp = this.program.charCodeAt(this.pc++);
    tmp = (tmp << 16) | this.program.charCodeAt(this.pc++);
    return tmp;
  }
  
  error(msg, instr) {
    this.done = true;
    throw new Error(msg + ' instr=' + instr.toString(16) + ' pc=' + this.pc.toString(16));
  }
  
  run() {
    while(!this.done) {
      this.step();
    }
    return this.result;
  }
  
  step() {
    // var {program, params, stack} = this;
    var stack = this.stack, sp = stack.length;
    var instr = this.readInt16();
    var opnd, opnd2, tmp;
    if(instr >= 0x1000) {
      opnd = instr << 20 >> 20;
      switch(instr & 0xF000) {
        case OP_STR: {
          opnd2 = this.readInt32();
          stack.push(this.program.substr(opnd2, opnd & 0xFFF));
          break;
        }
        case OP_BRA: {
          this.pc += opnd;
          break;
        }
        case OP_BZ: {
          if(!stack.pop())
            this.pc += opnd;
          break;
        }
        case OP_BNZ: {
          if(stack.pop())
            this.pc += opnd;
          break;
        }
        case OP_CALLR: {
          stack.push(this.pc);
          this.pc += opnd;
          break;
        }
        case OP_INT12: {
          stack.push(opnd);
          break;
        }
        default:
          this.error('illegal instruction', instr, pc);
      }
    } else if(instr >= 0x0100) {
      var opnd = instr & 0xFF;
      switch(instr & 0x0F00) {
        case OP_PSTR:
          stack.push(String(this.params[opnd]));
          break;
        case OP_PNUM:
          stack.push(Number(this.params[opnd]));
          break;
        case OP_DUPN: {
          for(var i = 0; i < opnd; i++) {
            stack.push(stack[sp + ~opnd]);
          }
          break;
        }
        case OP_DUPNI: {
          opnd2 = this.readInt16();
          for(var i = 0; i < opnd; i++) {
            stack.push(stack[sp + ~opnd2]);
          }
          break;
        }
        case OP_PUTNI: {
          opnd2 = this.readInt16();
          for(var i = 0; i < opnd; i++) {
            stack[sp+ ~opnd2] = stack.pop();
          }
          break;
        }
          
        case OP_POPN:
          stack.length -= opnd;
          break;
        case OP_LCATN: {
          var tmp = '';
          for(var i = 0; i < opnd; i++) {
            tmp = stack[--sp] + tmp;
          }
          stack.length = sp;
          stack.push(tmp);
          break;
        }
        case OP_RCATN: {
          var tmp = '';
          for(var i = 0; i < opnd; i++) {
            tmp = tmp + stack[--sp];
          }
          stack.length = sp;
          stack.push(tmp);
          break;
        }
        case OP_DUPI:
          stack.push(stack[sp + ~opnd]);
          break;
        case OP_PUTI:
          stack[stack.length + ~opnd] = stack.pop();
          break;
        case OP_DUPFP:
          stack.push(stack[this.fp + opnd]);
          break;
        case OP_PUTFP:
          stack[this.fp + opnd] = stack.pop();
          break;
        case OP_SWAPI:
          tmp = stack[sp + ~opnd];
          stack[sp + ~opnd] = stack[sp - 1];
          stack[sp - 1] = tmp;
          break;
        case OP_GETVR:
          stack.push(this.local[opnd]);
          break;
        case OP_PUTVR:
          this.local[opnd] = stack.pop();
          break;
        default: 
          this.error('illegal instruction', instr, pc);
      }
    } else {
      switch(instr) {
        case OP_INT16:
          stack.push(this.readInt16());
          break;
        case OP_INT32:
          stack.push(this.readInt32());
          break;
        case OP_JMP:
          this.pc = this.readInt32();
          break;
        case OP_RET:
          this.pc = stack.pop();
          break;
        case OP_RETV:
          tmp = stack.pop();
          this.pc = stack.pop();
          stack.push(tmp);
          break;
        case OP_CALL:
          stack.push(this.pc);
          this.pc = this.readInt32();
          break;
        case OP_CALLI:
          tmp = stack.pop();
          stack.push(this.pc);
          this.pc = tmp;
          break;
        case OP_ADD:
          stack.push(stack.pop() + stack.pop());
          break;
        case OP_SUB:
          stack.push(stack.pop() - stack.pop());
          break;
        case OP_NEG:
          stack.push(-stack.pop());
          break;
        case OP_CPL:
          stack.push(~stack.pop());
          break;
        case OP_NOT:
          stack.push(Number(!stack.pop()));
          break;
        case OP_MUL:
          stack.push(stack.pop() * stack.pop());
          break;
        case OP_DIV:
          stack.push(stack.pop() / stack.pop());
          break;
        case OP_MOD:
          stack.push(stack.pop() % stack.pop());
          break;
        case OP_AND:
          stack.push(stack.pop() & stack.pop());
          break;
        case OP_OR:
          stack.push(stack.pop() | stack.pop());
          break;
        case OP_XOR:
          stack.push(stack.pop() ^ stack.pop());
          break;
        case OP_LAND:
          stack.push(Number(stack.pop() && stack.pop()));
          break;
        case OP_LOR:
          stack.push(Number(stack.pop() || stack.pop()));
          break;
        case OP_SHL:
          stack.push(stack.pop() << this.readInt16());
          break;
        case OP_SHR:
          stack.push(stack.pop() >>> this.readInt16());
          break;
        case OP_ASR:
          stack.push(stack.pop() >> this.readInt16());
          break;
        case OP_SHLV:
          stack.push(stack.pop() << stack.pop());
          break;
        case OP_SHRV:
          stack.push(stack.pop() >>> stack.pop());
          break;
        case OP_ASRV:
          stack.push(stack.pop() >> stack.pop());
          break;
        case OP_GT:
          stack.push(Number(stack.pop() > stack.pop()));
          break;
        case OP_LT:
          stack.push(Number(stack.pop() < stack.pop()));
          break;
        case OP_GE:
          stack.push(Number(stack.pop() >= stack.pop()));
          break;
        case OP_LE:
          stack.push(Number(stack.pop() <= stack.pop()));
          break;
        case OP_EQ:
          stack.push(Number(stack.pop() === stack.pop()));
          break;
        case OP_NE:
          stack.push(Number(stack.pop() !== stack.pop()));
          break;
        case OP_TOSTR:
          stack.push(String(stack.pop()));
          break;
        case OP_TONUM:
          stack.push(Number(stack.pop()));
          break;
        case OP_TOINT:
          stack.push(Math.trunc(Number(stack.pop())));
          break;
        case OP_ISNUM:
          stack.push(Number(typeof stack.pop() === 'number'));
          break;
        case OP_ISSTR:
          stack.push(Number(typeof stack.pop() === 'string'));
          break;
        case OP_HALT:
          this.done = true;
          this.result = stack.pop();
          break;
        case OP_NEWFP:
          this.fp = stack.length - 1;
          break;
        case OP_STFP:
          this.fp = stack.pop();
          break;
        case OP_LDFP:
          stack.push(this.fp);
          break;
        case OP_UPFP:
          this.fp = stack[this.fp];
          break;
        case OP_PLURAL:
          switch(Number(stack.pop())) {
            case 0: stack.push(0); break;
            case 1: stack.push(1); break;
            case 2: stack.push(2); break;
            case 3: stack.push(3); break;
            default: stack.push(-1); break;
          }
          break;
        case OP_LDPC:
          stack.push(this.pc - 1);
          break;
        case OP_INC:
          stack[sp-1]++;
          break;
        case OP_DEC:
          stack[sp-1]--;
          break;
        case OP_SCHR:
          stack[sp-1] = String(stack[sp-2]).charCodeAt(stack[sp-1]);
          break;
        case OP_CHAR:
          stack[sp-1] = String.fromCharCode(stack[sp-1]);
          break;
        default:
          this.error('illegal instruction', instr, this.pc);
      }
    }
  }
}
StrVM.ops = ops;

module.exports = StrVM;