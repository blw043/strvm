
const I8_MIN  = -0x80;
const I8_MAX  =  0x7f;
const I12_MIN = -0x800;
const I12_MAX =  0x7ff;
const I16_MIN = -0x8000;
const I16_MAX =  0x7fff;
const I32_MIN = -0x80000000;
const I32_MAX =  0x7fffffff;

const U8_MIN  =  0;
const U8_MAX  =  0xff;
const U12_MIN =  0;
const U12_MAX =  0xfff;
const U16_MIN =  0;
const U16_MAX =  0xffff;
const U32_MIN =  0;
const U32_MAX =  0xffffffff;

var intTypes = {
  'i8': {size: 0, min: I8_MIN, max: I8_MAX},
  'u8': {size: 0, min: U8_MIN, max: U8_MAX},
  'i12': {size: 0, min: I12_MIN, max: I12_MAX},
  'u12': {size: 0, min: U12_MIN, max: U12_MAX},
  'r12': {size: 0, min: U12_MIN, max: U12_MAX},
  'i16': {size: 1, min: I16_MIN, max: I16_MAX},
  'u16': {size: 1, min: U16_MIN, max: U16_MAX},
  'i32': {size: 2, min: I32_MIN, max: I32_MAX},
  'u32': {size: 2, min: U32_MIN, max: U32_MAX},
  'a32': {size: 2, min: U32_MIN, max: U32_MAX},
};

module.exports = {intTypes};