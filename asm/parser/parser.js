const ast = require('./ast');
const {resolveInstructionKeyword} = require('./keywords');
const {TokenType} = require('./token');

class Parser {
  constructor(lex) {
    this.tokens = lex;
    this.hasError = false;
  }

  expect(type, context, message) {
    var t = this.tokens.next();
    if(t.type !== type) {
      this.syntaxError(context, t, message);
    }
    return t;
  }

  syntaxError(context, token, message) {
    if(!message) message = `invalid token: ${token.text}`;
    console.error(
      'ERR [%s:%d] %s',
      this.tokens.input.name,
      token.line,
      message
    );
    this.hasError = true;
    this.panic(context);
    return ast.Error(context, token, message);
  }

  panic(context) {
    while(true) {
      var token = this.tokens.next();
      if(token.type === TokenType.EOF) break;
      if(token.type === TokenType.EOL) break;
      switch(context) {
        case 'Term':
        case 'Expression': switch(token.type) {
          case TokenType.COMMA:
          case TokenType.RPAREN:
          case TokenType.OPERATOR:
            break;
        }
      }
    }
    this.tokens.pushBack(token);
  }

  parseProgram() {
    var statements = [];
    while(true) {
      var t = this.tokens.next();
      if(t.type === TokenType.EOF) break;
      if(t.type === TokenType.EOL) continue;
      this.tokens.pushBack(t);
      statements.push(this.parseStatement());
    }
    return ast.Program(...statements);
  }
  
  parseStatement() {
    var t = this.tokens.next();
    switch(t.type) {
      case TokenType.WORD:
        var t2 = this.tokens.next();
        switch(t2.type) {
          case TokenType.COLON:
            return ast.NamedLabel(t);
          case TokenType.OPERATOR:
            if(t2.text === '=') {
              return this.parseAssignment(t);
            }
        }
        this.tokens.pushBack(t2);
        resolveInstructionKeyword(t);
        switch(t.type) {
          case TokenType.INSTRUCTION:
            return this.parseInstruction(t);
          case TokenType.WORD:
            return ast.NamedLabel(t);
        }
      case TokenType.COLON:
        return ast.AnonLabel(t);
      default:
        return this.syntaxError('Statement', t, 'expected instruction or label');
    }
  }

  parseAssignment(token) {
    var expr = this.parseExpression(0);
    var result = ast.Assignment(token, expr);
    var token = this.tokens.peek();
    switch(token.type) {
      case TokenType.EOL:
      case TokenType.EOF:
      case TokenType.COMMA:
        this.tokens.next();
        break;
      default:
        this.syntaxError('Statement', token);
    }
    return result;
  }

  parseInstruction(token) {
    var operands = this.parseOperandList();
    var result = ast.Instruction(token, ...operands);
    
    if(token.text.startsWith('.')) {
      result.type = 'Directive';
    }

    if(!this.tokens.match(TokenType.EOF)) {
      this.expect(TokenType.EOL, 'Instruction', 'expected end of line');
    }
    return result;
  }

  parseOperandList() {
    var operands = [];
    var hasEos = false;
    while(!hasEos) {
      var t = this.tokens.peek();
      switch(t.type) {
        case TokenType.EOF:
        case TokenType.EOL:
          hasEos = true;
          break;
        // case TokenType.STRING:
        //   operands.push(ast.StrLiteral(t));
        //   break;
        default:
          operands.push(this.parseExpression(0));
          if(!this.tokens.match(TokenType.COMMA))
            hasEos = true;
          break;
      }
    }
    return operands;
  }

  parseExpression(prec) {
    var node = this.parseTerm();
    do {
      var op = this.tokens.next();
      if(op && op.type === TokenType.OPERATOR) {
        if(!infixTable[op.text]) {
          this.syntaxError('Expression', op, 'unknown operator: ' + op.text);
        }
        var opPrec = infixTable[op.text].prec;
        var relPrec = opPrec - prec;
        if(relPrec > 0) {
          // x + y * z -> x + (y * z)
          node = ast.BinaryExpr(op, node, this.parseExpression(opPrec));
        } else if(relPrec < 0) {
          // x * y + z -> (x * y) + z
          this.tokens.pushBack(op);
          break;
        } else {
          // x - y - z -> (x - y) - z
          if(infixTable[op.text].rassoc) {
            // a == b == c == d -> a == (b == (c == d))
            node = ast.BinaryExpr(op, node, this.parseExpression(prec));
          } else {
            // x + y + z -> (x + y) + z
            node = ast.BinaryExpr(op, node, this.parseTerm());
          }
        }
      } else {
        this.tokens.pushBack(op);
        break;
      }
    } while(op);
    return node;
  }

  parseTerm() {
    var token = this.tokens.next();
    switch(token.type) {
      case TokenType.LPAREN: {
        var result = this.parseExpression(0);
        this.expect(TokenType.RPAREN, 'Term', '")" expected');
        result = this.parsePostOp(result);
        return result;
      }
      case TokenType.COLON: {
        token = this.tokens.next();
        if(token.type === TokenType.WORD) {
          return ast.NameRef(token);
        } else {
          this.tokens.pushBack(token);
          this.syntaxError('Term', token, 'expected named or anonymous label ref');
        }
      }
      case TokenType.OPERATOR:
        if(isPrefixOperator(token))
          return ast.PrefixExpr(token, this.parseTerm());
        return this.syntaxError('Term', token);
      case TokenType.ANON_REF:
        return this.parsePostOp(ast.AnonLabelRef(token));
      case TokenType.WORD:
        if(token.text === '.') {
          return this.parsePostOp(ast.PCRef(token));
        } else {
          return this.parsePostOp(ast.NameRef(token));
        }
      case TokenType.NUMBER:
        return this.parsePostOp(ast.NumLiteral(token));
      case TokenType.STRING:
        return this.parsePostOp(ast.StrLiteral(token));
      default:
        return this.syntaxError('Term', token);
    }
  }

  parsePostOp(child) {
    return child;
    // while(true) {
    //   var token = this.tokens.peek();
    //   switch(token.type) {
        
    //   }
    // }
  }
}

function isPrefixOperator(token) {
  return prefixOps.indexOf(token.text) >= 0;
}
const prefixOps = [
  '-',
  '+',
  '!',
  '~'
];

const infixTable = {
  '||': {prec: 10},
  '&&': {prec: 10},
  '==': {prec: 20, rassoc: true},
  '!=': {prec: 20},
  '<':  {prec: 30},
  '<=': {prec: 30},
  '>':  {prec: 30},
  '>=': {prec: 30},
  '|':  {prec: 40},
  '&':  {prec: 50},
  '^':  {prec: 60},
  '+':  {prec: 70},
  '-':  {prec: 70},
  '>>': {prec: 80},
  '<<': {prec: 80},
  '>>>':{prec: 80},
  '*':  {prec: 90},
  '/':  {prec: 90},
  '%':  {prec: 90}
};

module.exports = Parser;