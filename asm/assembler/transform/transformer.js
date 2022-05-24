const defaultVisitor = {
  Program(node, visit) {node.statements.forEach(visit);},
  Instruction(node, visit) {node.args.forEach(visit);},
  Directive(node, visit) {node.args.forEach(visit);},
  Assignment(node, visit) {visit(node.rhs);},
  BinaryExpr(node, visit) {
    visit(node.left);
    visit(node.right);
  },
  PrefixExpr(node, visit) {
    visit(node.child);
  }
}

function createVisitor(visitor, inherits = defaultVisitor) {
  visitor = Object.assign(
    Object.create(inherits), 
    typeof visitor === 'function' ? visitor(inherits) : visitor
  );
  return function transform(ast, context) {
    function visit(node) {
      if(visitor[node.type]) 
        return visitor[node.type].call(context, node, visit);
    }

    return visit(ast);
  }
}

module.exports = createVisitor;