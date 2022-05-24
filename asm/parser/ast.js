function Program(...statements) {
  return {type: 'Program', statements};
}

function NamedLabel(token) {
  var {line, text:name} = token;
  return {type: 'Label', line, name};
}

function AnonLabel(token) {
  var {line} = token;
  return {type: 'Label', line};
}

function Instruction(instr, ...args) {
  var {line, text:op} = instr;
  return {type: 'Instruction', line, op, args};
}

function Assignment(lhs, rhs) {
  var {line, text:name} = lhs;
  return {type: 'Assignment', line, name, rhs};
}

function BinaryExpr(opTok, left, right) {
  var {line, text:op} = opTok;
  return {type: 'BinaryExpr', line, op, left, right};
}

function PrefixExpr(opTok, child) {
  var {line, text:op} = opTok;
  return {type: 'PrefixExpr', line, op, child};
}

function NumLiteral(token) {
  var {line, text} = token;
  var value;
  if(text.startsWith('$')) {
    value = parseInt(text.substring(1), 16);
  } else {
    value = parseInt(text, 10);
  }
  return {type: 'NumLiteral', line, text,
    valueType: 'num', 
    value
  };
}

function StrLiteral(token) {
  var {line, text, value} = token;
  return {type: 'StrLiteral', line, text, 
    valueType: 'str',
    value
  };
}

function AnonLabelRef(token) {
  var {line, text} = token;
  var offset = text.substring(1);
  if(offset === '+' || offset === '-')
    offset += '1';
  offset = parseInt(offset);
  // negative offsets 
  if(offset < 0) offset += 1;
  return {type: 'Ref', line, text, name: null, offset};
}

function NameRef(token) {
  var {line, text:name} = token;
  return {type: 'Ref', line, name};
}

function PCRef(token) {
  var {line, text} = token;
  return {type: 'PCRef', line, text};
}

function $Error(context, token, message) {
  return {type: 'Error', context, token, message};
}

module.exports = {
  Program,
  Instruction,
  NamedLabel,
  AnonLabel,
  Assignment,
  BinaryExpr,
  PrefixExpr,
  NumLiteral,
  StrLiteral,
  AnonLabelRef,
  NameRef,
  PCRef,
  Error: $Error
};