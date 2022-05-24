const scanAndResolveSymbols = require('./scanAndResolveSymbols');
const evaluateAndCalcAddrs = require('./evaluate');
const generateCode = require('./generateCode');

function visit(visitor, ast, context) {
  try {
    var result = visitor(ast, context);
  } catch(e) {
    context.hasError = true;
    if(e instanceof Error) {
      console.error(e);
    }
  }
  if(context.hasError) throw 'abort';
  return result;
}

function transform(ast, context) {
  try {
    // -  Process named labels
    // -  Process anonymous labels
    //    Process variables
    //    Resolve symbol references in expressions
    visit(scanAndResolveSymbols, ast, context);
    // -  Evaluate expressions
    //    Calculate label addresses
    visit(evaluateAndCalcAddrs, ast, context);
    //    Generate code
    return visit(generateCode, ast, context);
  } catch(e) {
    console.log('Assembly aborted due to errors.');
    return null;
  }
}

module.exports = transform;