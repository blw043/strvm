
function emitListing(pc, assembled, source) {
  var colAddr = pc.toString(16);
  while(colAddr.length < 8) colAddr = ' ' + colAddr;
  var colHex = fmtHex(assembled);
  while(colHex.length < 32) colHex += ' ';
  console.log(colAddr + ' ' + colHex);
}

function fmtHex(assembled) {
  var out = '';
  for(var i = 0; i < assembled.length; i++) {
    var hex = assembled.charCodeAt(i).toString(16);
    while(hex.length < 4) hex = '0' + hex;
    out += hex + ' '; 
  }
  return out;
}

module.exports = emitListing;