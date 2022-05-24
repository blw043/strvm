const TokenType = {
  EOF: 0,
  EOL: 1,
  WORD: 2,
  NUMBER: 3,
  STRING: 4,
  INSTRUCTION: 5,
  COMMAND: 6,
  ANON_REF: 7,
  ANON_LABEL: 9,
  COLON: 12,
  COMMA: 13,
  OPERATOR: 14,
  LPAREN: 18,
  RPAREN: 19,
  EQUALS: 20,
};

module.exports = {TokenType};