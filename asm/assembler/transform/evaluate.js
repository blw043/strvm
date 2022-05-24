const {lookupInstr} = require("../instructions");
const createVisitor = require("./transformer");

const evaluateAndCalcAddrs = createVisitor(defVisit => ({
  Program(node, visit) {
    var passes = 0;
    do {
      this.pc = 0;
      this.hasPendingEvals = false;
      defVisit.Program.call(this, node, visit);
      if(passes++ === 8) {
        throw new Error('exceeded maximum evaluation passes!');
      }
    } while(!this.hasError && this.hasPendingEvals);
  },
  Label(node) {
    if(node.addr !== this.pc) {
      node.addr = this.pc;
      this.hasPendingEvals = true;
      if(node.name != null) {
        // console.log('label ' + node.name + ' addr ' + node.addr);
        this.assignSymbol(node.name, node.addr);
      } else {
        // console.log('label :' + node.index + ' addr ' + node.addr);
        this.getAnonLabel(node.index).value = node.addr;
      }
    }
  },
  Assignment(node) {
    if(node.name === '.') {
      if(node.rhs.value != null && typeof node.rhs.value !== 'number') {
        this.error(node.line, "can't set PC to a non-number");
        return;
      }
      this.setPC(node.rhs.value);
    } else {
      this.assignSymbol(node.name, evalExpression(node.rhs, this));
    }
  },
  Instruction(node) {
    try {
      node.args.forEach(arg => {
        var result = evalExpression(arg, this);
        if(result != null && typeof result !== 'number') {
          throw new Error('instruction operands can only be numbers');
        }
      });
      var instr = lookupInstr(node.op, node.args);
      node.addr = this.pc;
      this.pc += instr.size;
    } catch(err) {
      this.error(node.line, err.message);
    }
  },
  Directive(node) {
    switch(node.op) {
      case '.ds': {
        if(node.args.length !== 1) {
          return this.error(node.line, 
            '.ds requires 1 argument, got ' + node.args.length);
        }
        
        const arg0 = node.args[0];
        evalExpression(arg0, this);
        if(arg0.value != null && typeof arg0.value !== 'number') {
          return this.error(node.line,
            '.ds requires a number argument'
          );
        }
        this.pc += arg0.value;
        break;
      }
      case '.dw':
        if(node.addr !== this.pc) {
          node.addr = this.pc;
          this.hasPendingEvals = true;
        }
        node.args.forEach((arg) => {
          evalExpression(arg, this);
          switch(typeof arg.value) {
            case 'string':
              this.pc += arg.value.length;
              break;
            default:
              this.pc += 1;
              break;
          }
        });
        break;
      case '.dl':
        if(node.addr !== this.pc) {
          node.addr = this.pc;
          this.hasPendingEvals = true;
        }
        node.args.forEach((arg) => {
          evalExpression(arg, this);
          this.pc += 2;
        });
        break;
    }
  },
}));

function evalExpression(node, context) {
  try {
    var result = evalExpressionVisitor(node, context);
    if(result == null)
      context.hasPendingEvals = true;
    return result;
  } catch(err) {
    context.error(node.line, err.message);
  }
}

const evalExpressionVisitor = createVisitor({
  BinaryExpr(node, visit) {
    if(node.value == null)
      node.value = binaryOps[node.op](
        visit(node.left),
        visit(node.right)
      );
    return node.value;
  },
  PrefixExpr(node, visit) {
    if(node.value == null) 
      node.value = prefixOps[node.op](
        visit(node.child)
      );
    return node.value;
  },
  StrLiteral(node) {return node.value;},
  NumLiteral(node) {return node.value;},
  PCRef(node) {return node.value = this.pc;},
  Ref(node) {return node.value = node.ref.value;}
});

const binaryOps = {
  '-': numOp((l, r) => l - r),
  '+': plusOp,
  '*': numOp((l, r) => l * r),
  '/': numOp((l, r) => l % r),
  '%': numOp((l, r) => l % r),
  '&': numOp((l, r) => l % r),
  '|': numOp((l, r) => l | r),
  '^': numOp((l, r) => l ^ r),
  '<<': numOp((l, r) => l << r),
  '>>': numOp((l, r) => l >> r),
  '>>>': numOp((l, r) => l >>> r),
  '&&': numOp((l, r) => Number(l && r)),
  '||': numOp((l, r) => Number(l || r)),
  '==': numOp((l, r) => Number(l == r)),
  '!=': numOp((l, r) => Number(l != r)),
  '<': numOp((l, r) => Number(l < r)),
  '>': numOp((l, r) => Number(l > r)),
  '<=': numOp((l, r) => Number(l <= r)),
  '>=': numOp((l, r) => Number(l >= r)),
};

const prefixOps = {
  '-': numOp1(c => -c),
  '+': numOp1(c => +c),
  '~': numOp1(c => ~c),
  '!': numOp1(c => Number(!c)),
};

function checkNum(v) {
  if(typeof v !== 'number') {
    throw new Error('invalid type: expected number');
  }
}

function numOp1(f) {
  return c => {
    if(c == null || isNaN(c)) return null;
    checkNum(c);
    return f(c);
  }
}

function numOp(f) {
  return (l, r) => {
    if(l == null) return null;
    if(r == null) return null;
    checkNum(l); checkNum(r);
    return f(l, r);
  }
}

function plusOp(l, r) {
  if(l == null) return null;
  if(r == null) return null;
  return l + r;
}

module.exports = evaluateAndCalcAddrs;