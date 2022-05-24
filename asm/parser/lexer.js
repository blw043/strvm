const CharStream = require("./charstream");
const {TokenType} = require("./token");

function isDigit(c) {
  return c >= '0' && c <= '9';
}

function isHexDigit(c) {
  return (c >= '0' && c <= '9')
      || (c >= 'A' && c <= 'F')
      || (c >= 'a' && c <= 'f');
}

function isWordStart(c) {
  return c === '.' || c === '_' || c === '@'
      || (c >= 'A' && c <= 'Z')
      || (c >= 'a' && c <= 'z');
}

function isWordChar(c) {
  return isWordStart(c) || isDigit(c);
}

function isOperatorChar(c) {
  return "~!%^&*-+=|<>/".indexOf(c) >= 0;
}

function consumeSpace(lex) {
  return lex.input.matchRep(' \t');
}

function consumeComment(lex) {
  lex.input.matchRepNot('\r\n');
  lex.skip();
}

function consumeEOL(lex) {
  lex.input.matchRep('\r');
  return lex.input.match('\n');
}

function nextWord(lex) {
  lex.input.matchWhile(isWordChar);
  var token = lex.token(TokenType.WORD);
  //token.type = resolveKeyword(token.text, lex.getMode());
  return token;
}

function nextEOL(lex) {
  if(consumeEOL(lex))
    return lex.token(TokenType.EOL);
}

function nextString(lex, quote) {
  var input = lex.input;
  var strbuf = '';
  while(true) {
    var c = input.peek();
    if(c === quote) {
      input.next();
      return lex.token(TokenType.STRING, strbuf);
    } else if(c === '' || c === '\r' || c === '\n') {
      lex.syntaxError('unterminated string literal');
      return lex.token(TokenType.STRING, strbuf);
    } else if(c === '\\') {
      input.next();
      strbuf += nextStringEscape(lex);
    } else {
      strbuf += input.next();
    }
  }
}

function nextStringEscape(lex) {
  var input = lex.input;
  switch(input.peek()) {
    case 'x': {
      input.next();
      let code =  input.matchIf(isHexDigit);
          code += input.matchIf(isHexDigit);
      return String.fromCharCode(parseInt(code, 16));
    }
    case 'u': {
      input.next();
      let code =  input.matchIf(isHexDigit);
          code += input.matchIf(isHexDigit);
          code += input.matchIf(isHexDigit);
          code += input.matchIf(isHexDigit);
      return String.fromCharCode(parseInt(code, 16));
    }
    case '\r':
    case '\n':
      consumeEOL(lex);
      consumeSpace(lex);
      return '';
    case 'r': input.next(); return '\r';
    case 'n': input.next(); return '\n';
    case 'b': input.next(); return '\b';
    case 'f': input.next(); return '\f';
    case 't': input.next(); return '\t';
    default:
      return input.next();
  }
}

function nextNumber(lex) {
  lex.input.matchWhile(isDigit);
  return lex.token(TokenType.NUMBER);
}

function nextHexNumber(lex) {
  lex.input.matchWhile(isHexDigit);
  return lex.token(TokenType.NUMBER);
}

function nextOperator(lex) {
  var input = lex.input;
  var buf = '';
  var c;
  while(isOperatorChar(c = input.peek())) {
    input.next();
    if(operators.indexOf(buf + c) < 0) {
      input.unget();
      break;
    }
    buf += c;
  }
  return lex.token(TokenType.OPERATOR);
}

class Lexer {
  constructor(srcName, srcText) {
    this.input = new CharStream(srcName, srcText);

    this.start = 0;

    this.pushbackList = [];
    this.modeStack = [0];
  }

  logError(message) {
    var input = this.input;
    var nameAndLine = input.fmtNameAndLineNo(input.pos);
    console.error('SYNTAX ERROR [%s] %s', nameAndLine, message);
  }

  getMode() {
    return this.modeStack[this.modeStack.length - 1];
  }
  setMode(mode) {
    this.modeStack[this.modeStack.length - 1] = mode;
  }
  pushMode(mode) {
    this.modeStack.push(mode);
  }
  popMode() {
    this.modeStack.pop();
  }

  token(type, value) {
    return {
      type: type,
      text: this.input.substring(this.start),
      start: this.start,
      end: this.input.pos,
      line: this.input.getLineNumberForPos(this.start),
      value: value
    };
  }

  skip() {
    this.start = this.input.pos;
  }

  match(...types) {
    var token = this.next();
    if(types.indexOf(token.type) >= 0) {
      return token;
    }
    this.pushBack(token);
  }

  peek() {
    var t = this.next();
    this.pushBack(t);
    return t;
  }

  next() {
    if(this.pushbackList.length > 0) {
      return this.pushbackList.pop();
    }
    
    var input = this.input;

    while(true) {
      consumeSpace(this);
      this.skip();
      var c = input.next();
      if(!c) {
        return this.token(TokenType.EOF);
      } else if(c === ';') {
        consumeComment(this);
        continue;
      } else if(c === '\r' || c === '\n') {
        return nextEOL(this);
      } else if(c === ':') {
        if(input.match('+-')) {
          input.matchWhile(isDigit);
          return this.token(TokenType.ANON_REF);
        } else {
          return this.token(TokenType.COLON);
        }
      } else if(c === '"' || c === "'") {
        return nextString(this, c);
      } else if(isWordStart(c)) {
        return nextWord(this);
      } else if(isDigit(c)) {
        return nextNumber(this);
      } else if(c === '$') {
        return nextHexNumber(this);
      } else if(c === '+' || c === '-') {
        if(input.match(':')) {
          return this.token(TokenType.ANON_LABEL);
        } else {
          return this.token(TokenType.OPERATOR);
        }
      } else if(c === ',') {
        return this.token(TokenType.COMMA);
      } else if(c === '(') {
        return this.token(TokenType.LPAREN);
      } else if(c === ')') {
        return this.token(TokenType.RPAREN);
      } else if(isOperatorChar(c)) {
        input.unget();
        return nextOperator(this);
      } else if(c === '\\') {
        consumeEOL(this);
        continue;
      } else {
        this.syntaxError(c);
        return this.token(TokenType.ERROR);
      }
    }
  }

  syntaxError(c) {
    this.logError('invalid sequence: ' + this.input.substring());
    while(true) {
      if(isWordChar(c) || isOperatorChar(c) || isDigit(c)) return;
      switch(c) {
        case '':
        case '\r':
        case '\n':
        case ' ':
        case '\t':
        case '\'':
        case '"':
          return;
      }
      c = this.input.next();
    }
  }

  pushBack(...tokens) {
    this.pushbackList.push(...tokens);
  }
}

var operators = [
  '>>>',
  '>>',
  '>=',
  '>',
  '<<',
  '<=',
  '<',
  '+',
  '-',
  '*',
  '/',
  '%',
  '!=',
  '!',
  '~',
  '^',
  '==',
  '=',
  '&&',
  '&',
  '||',
  '|',
];

module.exports = Lexer;