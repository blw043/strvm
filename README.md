# strvm

A toy virtual machine interpreter and assembler implemented in Node.js with no dependencies.

The assembler language supports comments; named and anonymous labels; assignable variables; and expression evaluation. The code is compiled to characters in a JS string, which is then executed by a stack machine.

This is a one-off toy project, intended as a self-teaching exercise in compiler implementation. It is not actively maintained; it is not suitable as is for consumption as a library, nor generally for any serious use in production applications. No one would implement a production VM runtime in Javascript, ever.
