const EOF = '';
const FAIL = null;

class CharStream {
  constructor(name, text) {
    this.name = name;
    this.text = text;
    // Array maps line number to character offset of first char in line.
    // Not super efficient, but we don't need line number info except 
    // for logging, so trading off time for space here.
    this.lineMap = [];

    // The current position
    this.pos = 0;
    // The highest position that has been scanned so far
    // Ensures we don't corrupt the line numbers when backtracking
    this.head = 0;
  }

  isEOF() {
    return this.pos >= this.text.length;
  }
  
  peek() {
    return this.text.charAt(this.pos);
  }

  peekCode() {
    return this.text.charCodeAt(this.pos);
  }

  next() {
    var c = this.text.charAt(this.pos++);
    if(c && this.pos > this.head) {
      this.head = this.pos;
      if(c === '\n')
        this.lineMap.push(this.pos);
    }
    return c;
  }

  unget() {
    if(this.pos > 0) this.pos--;
  }

  nextCode() {
    var c = this.text.charCodeAt(this.pos++);
    if(c !== c) return -1;
    if(this.pos > this.head) {
      this.head = this.pos;
      if(c === 0x0A)
        this.lineMap.push(this.pos);
    }
    return c;
  }

  try(...alts) {
    var savedPos = this.pos;
    var result;
    for(var i = 0; i < alts.length; i++) {
      if(result = alts[i](this)) break;
    }
    if(!result) this.pos = savedPos;
    return result;
  }

  matchRx(rx) {
    var result = rx.exec(this.lookahead());
    if(result != null) {
      this.pos += result[0].length;
    }
    return result;
  }

  matchIf(pred) {
    var c = this.peek();
    if(pred(c)) {
      this.next();
      return c;
    }
    return '';
  }

  matchIfNot(pred) {
    var c = this.peek();
    if(!pred(c)) {
      this.next();
      return c;
    }
    return '';
  }

  match(chars) {
    var c = this.peek();
    if(c && chars.indexOf(c) >= 0) {
      this.next();
      return c;
    }
    return '';
  }

  matchNot(chars) {
    var c = this.peek();
    if(c && chars.indexOf(c) < 0) {
      this.next();
      return c;
    }
    return '';
  }

  matchRep(chars) {
    var buf = '', c;
    while(c = this.match(chars)) {
      buf += c;
    }
    return buf;
  }

  matchWhile(pred) {
    var buf = '', c;
    while(c = this.matchIf(pred)) {
      buf += c;
    }
    return buf;
  }

  matchRepNot(chars) {
    var buf = '', c;
    while(c = this.matchNot(chars)) {
      buf += c;
    }
    return buf;
  }

  matchWhileNot(pred) {
    var buf = '', c;
    while(c = this.matchIfNot(pred)) {
      buf += c;
    }
    return buf;
  }

  substring(start, end = this.pos) {
    return this.text.substring(start, end);
  }

  lookahead() {
    return this.text.substring(this.pos);
  }

  getLineNumberForPos(pos) {
    var start = 0, end = this.lineMap.length, mid;
    while(end > start) {
      mid = start + ((end - start) >>> 1);
      if(pos >= this.lineMap[mid])
        start = mid + 1;
      else
        end = mid;
    }
    return start + 1;
  }

  fmtNameAndLineNo(pos) {
    return this.name + ':' + this.getLineNumberForPos(pos);
  }
}
CharStream.EOF = EOF;
CharStream.FAIL = FAIL;

module.exports = CharStream;