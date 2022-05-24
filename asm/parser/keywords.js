const {instrMap} = require("../assembler/instructions");
const {TokenType} = require("./token");

const directiveKeywords = [
  '.dw',
  '.dl'
]

function resolveInstructionKeyword(token) {
  if(instrMap[token.text.toLowerCase()])
    token.type = TokenType.INSTRUCTION;
  else if(directiveKeywords.indexOf(token.text.toLowerCase()) >= 0)
    token.type = TokenType.INSTRUCTION;
}

module.exports = {resolveInstructionKeyword};