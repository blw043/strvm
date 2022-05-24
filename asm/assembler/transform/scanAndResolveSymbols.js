const {lookupInstr} = require("../instructions");
const createVisitor = require("./transformer");

/* - Process named labels */
const scanLabels = createVisitor({
  Label(node) {
    if(node.name != null) {
      this.defineSymbol(node.name, 'label');
    } else {
      this.defineAnonLabel({type: 'label', value: null});
    }
  }
})

/* - Resolve variables
   - Process anonymous labels
   - Resolve symbol references in expressions
*/
const scanVarsAndResolveRefs = createVisitor(defaultVisitor => ({
  Program(node, visit) {
    try {
      this.pushLocals();
      this.locals.anonLabelIndex = -1;
      defaultVisitor.Program.call(this, node, visit);
    } finally {
      this.popLocals();
    }
  },
  Assignment(node, visit) {
    defaultVisitor.Assignment(node, visit);
    var target = this.lookupSymbol(node.name);
    if(target) {
      if(target.type !== 'var') {
        this.error(node.line, 
          "can't reassign '" + node.name + "', not a variable");
      }
    } else {
      this.defineSymbol(node.name, 'var');
    }
  },
  Label(node) {
    if(node.name == null) {
      this.locals.anonLabelIndex += 1;
      node.index = this.locals.anonLabelIndex;
    }
  },
  Ref(node) {
    try {
      if(node.name != null) {
        var refsym = this.getSymbol(node.name);
        node.ref = refsym;
      } else {
        node.ref = this.getAnonLabel(this.locals.anonLabelIndex + node.offset);
        if(!node.ref) {
          throw new Error("can't resolve anonymous label ref with offset " + node.offset);
        }
      }
    } catch(err) {
      this.error(node.line, err.message);
    }
  }
}));

function scanAndResolveSymbols(ast, context) {
  scanLabels(ast, context);
  scanVarsAndResolveRefs(ast, context);
}

module.exports = scanAndResolveSymbols;