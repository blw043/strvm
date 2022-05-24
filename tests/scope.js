const Scope = require('../asm/scope');
const assert = require('assert');

function testlca() {
  var n0 = {id:0};
  var n1 = {id:1, parent: n0};
  var n2 = {id:2, parent: n0};
  var n3 = {id:3, parent: n1};
  var n4 = {id:4, parent: n3};
  var n5 = {id:5};

  assert.ok(Scope.lca(n3, n2) === n0);
  assert.ok(Scope.lca(n3, n4) === n3);
  assert.ok(Scope.lca(n4, n4) === n4);
  assert.ok(Scope.lca(n0, n5) == null);
}

testlca();