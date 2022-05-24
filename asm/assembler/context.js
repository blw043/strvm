class AsmContext {
  constructor(input) {
    this.input = input;
    this.pc = 0;
    this.symtab = {};
    this.anonLabels = [];
    this.pcStack = [];
    this.hasError = false;

    // Local variables used by AST visitors to pass params to their children
    // Uses JS prototype for delegation
    this.locals = Object.create(null);
  }

  /* Emits an assembler warning. */
  warn(line, message) {
    console.warn("WARN [%s:%d] %s", this.input.name, line, message);
  }

  /* Emits an assembler error. */
  error(line, message) {
    console.error('ERR [%s:%d] %s', this.input.name, line, message);
    this.hasError = true;
  }

  /* Push a new empty set of assembler local variables.
  Used by the AST visitors to store variables local to a single pass of a 
  subtree. */
  pushLocals() {
    this.locals = Object.create(this.locals);
  }

  /* Pop the current assembler local variables. */
  popLocals() {
    this.locals = Object.getPrototypeOf(this.locals);
  }

  /* Sets the current PC address. */
  setPC(pc) {this.pc = pc;}
  /* Adds the specified offset to the PC. */
  addPC(offs) {this.pc += offs;}
  /* Save the current PC on the PC stack */
  pushPC() {this.pcStack.push(this.pc);}
  /* Restore the current PC from the PC stack */
  popPC() {
    if(this.pcStack.length === 0) {
      throw new Error("can't pop PC - stack is empty");
    }
    this.pc = this.pcStack.pop();
  }

  /* Defines a new anonymous label. */
  defineAnonLabel(value) {
    this.anonLabels.push(value);
  }

  /* Gets the i'th anonymous label. */
  getAnonLabel(i) {
    return this.anonLabels[i];
  }

  /* Returns the symbol table containing the current visible definition
  for a symbol. 
  
  Local scopes and modules are not implemented yet. When they are, the
  resolution logic will be added here. */
  findSymbol(name) {
    return this.symtab;
  }

  /* Add an entry to the symbol table specifying its type.
  Optionally a value can be assigned at the same time. */
  defineSymbol(name, type, value = null) {
    if(this.symtab[name]) {
      throw new Error('already defined: ' + name);
    }
    return this.symtab[name] = {type, value};
  }

  /* Tests if a symbol has been defined. */
  isSymbolDefined(name) {
    var symtab = this.findSymbol(name);
    return symtab != null
        && symtab[name] != null;
  }

  /* Tests if a symbol has been defined and assigned a value. */
  isSymbolAssigned(name) {
    var symtab = this.findSymbol(name);
    return symtab != null
        && symtab[name] != null
        && this.symtab[name].value != null;
  }

  /* Assigns a value to an already defined symbol. */
  assignSymbol(name, value) {
    this.getSymbol(name).value = value;
  }

  
  /* Lookup the value of a symbol that is expected to have been previously
  defined. */
  lookupSymbol(name) {
    var symtab = this.findSymbol(name);
    if(!symtab) return undefined;
    return symtab[name];
  }

  /* Lookup the value of a symbol that is expected to have been previously
  defined. */
  getSymbol(name) {
    var symtab = this.findSymbol(name);
    if(!symtab[name]) {
      throw new Error('undefined symbol: ' + name);
    }
    return symtab[name];
  }
}

module.exports = {
  AsmContext
};