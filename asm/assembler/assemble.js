const Lexer = require("../parser/lexer");
const Parser = require("../parser/parser");
const {AsmContext} = require("./context");
const transform = require("./transform");

function assemble(text, name = '') {
  var lexer = new Lexer(name, text);
  var parser = new Parser(lexer);
  var ast = parser.parseProgram();
  if(!parser.hasError) {
    var context = new AsmContext(lexer.input, console);
    var transformResult = transform(ast, context);
  }
  return transformResult;
}

module.exports = {assemble};