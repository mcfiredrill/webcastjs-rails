// libshine.js - port of libshine to JavaScript using emscripten
// by Romain Beauxis <toots@rastageeks.org> from code by
// Andreas Krennmair <ak@synflood.at>
var Shine = (function() {
  var Module;
  var context = {};
  return (function() {
// Note: For maximum-speed code, see "Optimizing Code" on the Emscripten wiki, https://github.com/kripken/emscripten/wiki/Optimizing-Code
// Note: Some Emscripten settings may limit the speed of the generated code.
// The Module object: Our interface to the outside world. We import
// and export values on it, and do the work to get that through
// closure compiler if necessary. There are various ways Module can be used:
// 1. Not defined. We create it here
// 2. A function parameter, function(Module) { ..generated code.. }
// 3. pre-run appended it, var Module = {}; ..generated code..
// 4. External script tag defines var Module.
// We need to do an eval in order to handle the closure compiler
// case, where this code here is minified but Module was defined
// elsewhere (e.g. case 4 above). We also need to check if Module
// already exists (e.g. case 3 above).
// Note that if you want to run closure, and also to use Module
// after the generated code, you will need to define   var Module = {};
// before the code. Then that object will be used in the code, and you
// can continue to use Module afterwards as well.
var Module;
if (!Module) Module = eval('(function() { try { return Module || {} } catch(e) { return {} } })()');
// Sometimes an existing Module object exists with properties
// meant to overwrite the default module functionality. Here
// we collect those properties and reapply _after_ we configure
// the current environment's defaults to avoid having to be so
// defensive during initialization.
var moduleOverrides = {};
for (var key in Module) {
  if (Module.hasOwnProperty(key)) {
    moduleOverrides[key] = Module[key];
  }
}
// The environment setup code below is customized to use Module.
// *** Environment setup code ***
var ENVIRONMENT_IS_NODE = typeof process === 'object' && typeof require === 'function';
var ENVIRONMENT_IS_WEB = typeof window === 'object';
var ENVIRONMENT_IS_WORKER = typeof importScripts === 'function';
var ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
if (ENVIRONMENT_IS_NODE) {
  // Expose functionality in the same simple way that the shells work
  // Note that we pollute the global namespace here, otherwise we break in node
  Module['print'] = function(x) {
    process['stdout'].write(x + '\n');
  };
  Module['printErr'] = function(x) {
    process['stderr'].write(x + '\n');
  };
  var nodeFS = require('fs');
  var nodePath = require('path');
  Module['read'] = function(filename, binary) {
    filename = nodePath['normalize'](filename);
    var ret = nodeFS['readFileSync'](filename);
    // The path is absolute if the normalized version is the same as the resolved.
    if (!ret && filename != nodePath['resolve'](filename)) {
      filename = path.join(__dirname, '..', 'src', filename);
      ret = nodeFS['readFileSync'](filename);
    }
    if (ret && !binary) ret = ret.toString();
    return ret;
  };
  Module['readBinary'] = function(filename) { return Module['read'](filename, true) };
  Module['load'] = function(f) {
    globalEval(read(f));
  };
  Module['arguments'] = process['argv'].slice(2);
  module.exports = Module;
}
else if (ENVIRONMENT_IS_SHELL) {
  Module['print'] = print;
  if (typeof printErr != 'undefined') Module['printErr'] = printErr; // not present in v8 or older sm
  Module['read'] = read;
  Module['readBinary'] = function(f) {
    return read(f, 'binary');
  };
  if (typeof scriptArgs != 'undefined') {
    Module['arguments'] = scriptArgs;
  } else if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  this['Module'] = Module;
}
else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
  Module['read'] = function(url) {
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    return xhr.responseText;
  };
  if (typeof arguments != 'undefined') {
    Module['arguments'] = arguments;
  }
  if (ENVIRONMENT_IS_WEB) {
    Module['print'] = function(x) {
      console.log(x);
    };
    Module['printErr'] = function(x) {
      console.log(x);
    };
    this['Module'] = Module;
  } else if (ENVIRONMENT_IS_WORKER) {
    // We can do very little here...
    var TRY_USE_DUMP = false;
    Module['print'] = (TRY_USE_DUMP && (typeof(dump) !== "undefined") ? (function(x) {
      dump(x);
    }) : (function(x) {
      // self.postMessage(x); // enable this if you want stdout to be sent as messages
    }));
    Module['load'] = importScripts;
  }
}
else {
  // Unreachable because SHELL is dependant on the others
  throw 'Unknown runtime environment. Where are we?';
}
function globalEval(x) {
  eval.call(null, x);
}
if (!Module['load'] == 'undefined' && Module['read']) {
  Module['load'] = function(f) {
    globalEval(Module['read'](f));
  };
}
if (!Module['print']) {
  Module['print'] = function(){};
}
if (!Module['printErr']) {
  Module['printErr'] = Module['print'];
}
if (!Module['arguments']) {
  Module['arguments'] = [];
}
// *** Environment setup code ***
// Closure helpers
Module.print = Module['print'];
Module.printErr = Module['printErr'];
// Callbacks
Module['preRun'] = [];
Module['postRun'] = [];
// Merge back in the overrides
for (var key in moduleOverrides) {
  if (moduleOverrides.hasOwnProperty(key)) {
    Module[key] = moduleOverrides[key];
  }
}
// === Auto-generated preamble library stuff ===
//========================================
// Runtime code shared with compiler
//========================================
var Runtime = {
  stackSave: function () {
    return STACKTOP;
  },
  stackRestore: function (stackTop) {
    STACKTOP = stackTop;
  },
  forceAlign: function (target, quantum) {
    quantum = quantum || 4;
    if (quantum == 1) return target;
    if (isNumber(target) && isNumber(quantum)) {
      return Math.ceil(target/quantum)*quantum;
    } else if (isNumber(quantum) && isPowerOfTwo(quantum)) {
      var logg = log2(quantum);
      return '((((' +target + ')+' + (quantum-1) + ')>>' + logg + ')<<' + logg + ')';
    }
    return 'Math.ceil((' + target + ')/' + quantum + ')*' + quantum;
  },
  isNumberType: function (type) {
    return type in Runtime.INT_TYPES || type in Runtime.FLOAT_TYPES;
  },
  isPointerType: function isPointerType(type) {
  return type[type.length-1] == '*';
},
  isStructType: function isStructType(type) {
  if (isPointerType(type)) return false;
  if (isArrayType(type)) return true;
  if (/<?{ ?[^}]* ?}>?/.test(type)) return true; // { i32, i8 } etc. - anonymous struct types
  // See comment in isStructPointerType()
  return type[0] == '%';
},
  INT_TYPES: {"i1":0,"i8":0,"i16":0,"i32":0,"i64":0},
  FLOAT_TYPES: {"float":0,"double":0},
  or64: function (x, y) {
    var l = (x | 0) | (y | 0);
    var h = (Math.round(x / 4294967296) | Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  and64: function (x, y) {
    var l = (x | 0) & (y | 0);
    var h = (Math.round(x / 4294967296) & Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  xor64: function (x, y) {
    var l = (x | 0) ^ (y | 0);
    var h = (Math.round(x / 4294967296) ^ Math.round(y / 4294967296)) * 4294967296;
    return l + h;
  },
  getNativeTypeSize: function (type, quantumSize) {
    if (Runtime.QUANTUM_SIZE == 1) return 1;
    var size = {
      '%i1': 1,
      '%i8': 1,
      '%i16': 2,
      '%i32': 4,
      '%i64': 8,
      "%float": 4,
      "%double": 8
    }['%'+type]; // add '%' since float and double confuse Closure compiler as keys, and also spidermonkey as a compiler will remove 's from '_i8' etc
    if (!size) {
      if (type.charAt(type.length-1) == '*') {
        size = Runtime.QUANTUM_SIZE; // A pointer
      } else if (type[0] == 'i') {
        var bits = parseInt(type.substr(1));
        assert(bits % 8 == 0);
        size = bits/8;
      }
    }
    return size;
  },
  getNativeFieldSize: function (type) {
    return Math.max(Runtime.getNativeTypeSize(type), Runtime.QUANTUM_SIZE);
  },
  dedup: function dedup(items, ident) {
  var seen = {};
  if (ident) {
    return items.filter(function(item) {
      if (seen[item[ident]]) return false;
      seen[item[ident]] = true;
      return true;
    });
  } else {
    return items.filter(function(item) {
      if (seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }
},
  set: function set() {
  var args = typeof arguments[0] === 'object' ? arguments[0] : arguments;
  var ret = {};
  for (var i = 0; i < args.length; i++) {
    ret[args[i]] = 0;
  }
  return ret;
},
  STACK_ALIGN: 8,
  getAlignSize: function (type, size, vararg) {
    // we align i64s and doubles on 64-bit boundaries, unlike x86
    if (type == 'i64' || type == 'double' || vararg) return 8;
    if (!type) return Math.min(size, 8); // align structures internally to 64 bits
    return Math.min(size || (type ? Runtime.getNativeFieldSize(type) : 0), Runtime.QUANTUM_SIZE);
  },
  calculateStructAlignment: function calculateStructAlignment(type) {
    type.flatSize = 0;
    type.alignSize = 0;
    var diffs = [];
    var prev = -1;
    var index = 0;
    type.flatIndexes = type.fields.map(function(field) {
      index++;
      var size, alignSize;
      if (Runtime.isNumberType(field) || Runtime.isPointerType(field)) {
        size = Runtime.getNativeTypeSize(field); // pack char; char; in structs, also char[X]s.
        alignSize = Runtime.getAlignSize(field, size);
      } else if (Runtime.isStructType(field)) {
        if (field[1] === '0') {
          // this is [0 x something]. When inside another structure like here, it must be at the end,
          // and it adds no size
          // XXX this happens in java-nbody for example... assert(index === type.fields.length, 'zero-length in the middle!');
          size = 0;
          alignSize = type.alignSize || QUANTUM_SIZE;
        } else {
          size = Types.types[field].flatSize;
          alignSize = Runtime.getAlignSize(null, Types.types[field].alignSize);
        }
      } else if (field[0] == 'b') {
        // bN, large number field, like a [N x i8]
        size = field.substr(1)|0;
        alignSize = 1;
      } else {
        throw 'Unclear type in struct: ' + field + ', in ' + type.name_ + ' :: ' + dump(Types.types[type.name_]);
      }
      if (type.packed) alignSize = 1;
      type.alignSize = Math.max(type.alignSize, alignSize);
      var curr = Runtime.alignMemory(type.flatSize, alignSize); // if necessary, place this on aligned memory
      type.flatSize = curr + size;
      if (prev >= 0) {
        diffs.push(curr-prev);
      }
      prev = curr;
      return curr;
    });
    type.flatSize = Runtime.alignMemory(type.flatSize, type.alignSize);
    if (diffs.length == 0) {
      type.flatFactor = type.flatSize;
    } else if (Runtime.dedup(diffs).length == 1) {
      type.flatFactor = diffs[0];
    }
    type.needsFlattening = (type.flatFactor != 1);
    return type.flatIndexes;
  },
  generateStructInfo: function (struct, typeName, offset) {
    var type, alignment;
    if (typeName) {
      offset = offset || 0;
      type = (typeof Types === 'undefined' ? Runtime.typeInfo : Types.types)[typeName];
      if (!type) return null;
      if (type.fields.length != struct.length) {
        printErr('Number of named fields must match the type for ' + typeName + ': possibly duplicate struct names. Cannot return structInfo');
        return null;
      }
      alignment = type.flatIndexes;
    } else {
      var type = { fields: struct.map(function(item) { return item[0] }) };
      alignment = Runtime.calculateStructAlignment(type);
    }
    var ret = {
      __size__: type.flatSize
    };
    if (typeName) {
      struct.forEach(function(item, i) {
        if (typeof item === 'string') {
          ret[item] = alignment[i] + offset;
        } else {
          // embedded struct
          var key;
          for (var k in item) key = k;
          ret[key] = Runtime.generateStructInfo(item[key], type.fields[i], alignment[i]);
        }
      });
    } else {
      struct.forEach(function(item, i) {
        ret[item[1]] = alignment[i];
      });
    }
    return ret;
  },
  dynCall: function (sig, ptr, args) {
    if (args && args.length) {
      if (!args.splice) args = Array.prototype.slice.call(args);
      args.splice(0, 0, ptr);
      return Module['dynCall_' + sig].apply(null, args);
    } else {
      return Module['dynCall_' + sig].call(null, ptr);
    }
  },
  functionPointers: [],
  addFunction: function (func) {
    for (var i = 0; i < Runtime.functionPointers.length; i++) {
      if (!Runtime.functionPointers[i]) {
        Runtime.functionPointers[i] = func;
        return 2 + 2*i;
      }
    }
    throw 'Finished up all reserved function pointers. Use a higher value for RESERVED_FUNCTION_POINTERS.';
  },
  removeFunction: function (index) {
    Runtime.functionPointers[(index-2)/2] = null;
  },
  warnOnce: function (text) {
    if (!Runtime.warnOnce.shown) Runtime.warnOnce.shown = {};
    if (!Runtime.warnOnce.shown[text]) {
      Runtime.warnOnce.shown[text] = 1;
      Module.printErr(text);
    }
  },
  funcWrappers: {},
  getFuncWrapper: function (func, sig) {
    assert(sig);
    if (!Runtime.funcWrappers[func]) {
      Runtime.funcWrappers[func] = function() {
        return Runtime.dynCall(sig, func, arguments);
      };
    }
    return Runtime.funcWrappers[func];
  },
  UTF8Processor: function () {
    var buffer = [];
    var needed = 0;
    this.processCChar = function (code) {
      code = code & 0xff;
      if (needed) {
        buffer.push(code);
        needed--;
      }
      if (buffer.length == 0) {
        if (code < 128) return String.fromCharCode(code);
        buffer.push(code);
        if (code > 191 && code < 224) {
          needed = 1;
        } else {
          needed = 2;
        }
        return '';
      }
      if (needed > 0) return '';
      var c1 = buffer[0];
      var c2 = buffer[1];
      var c3 = buffer[2];
      var ret;
      if (c1 > 191 && c1 < 224) {
        ret = String.fromCharCode(((c1 & 31) << 6) | (c2 & 63));
      } else {
        ret = String.fromCharCode(((c1 & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
      }
      buffer.length = 0;
      return ret;
    }
    this.processJSString = function(string) {
      string = unescape(encodeURIComponent(string));
      var ret = [];
      for (var i = 0; i < string.length; i++) {
        ret.push(string.charCodeAt(i));
      }
      return ret;
    }
  },
  stackAlloc: function (size) { var ret = STACKTOP;STACKTOP = (STACKTOP + size)|0;STACKTOP = ((((STACKTOP)+7)>>3)<<3); return ret; },
  staticAlloc: function (size) { var ret = STATICTOP;STATICTOP = (STATICTOP + size)|0;STATICTOP = ((((STATICTOP)+7)>>3)<<3); return ret; },
  dynamicAlloc: function (size) { var ret = DYNAMICTOP;DYNAMICTOP = (DYNAMICTOP + size)|0;DYNAMICTOP = ((((DYNAMICTOP)+7)>>3)<<3); if (DYNAMICTOP >= TOTAL_MEMORY) enlargeMemory();; return ret; },
  alignMemory: function (size,quantum) { var ret = size = Math.ceil((size)/(quantum ? quantum : 8))*(quantum ? quantum : 8); return ret; },
  makeBigInt: function (low,high,unsigned) { var ret = (unsigned ? ((+(((low)>>>(0))))+((+(((high)>>>(0))))*(+(4294967296)))) : ((+(((low)>>>(0))))+((+(((high)|(0))))*(+(4294967296))))); return ret; },
  GLOBAL_BASE: 8,
  QUANTUM_SIZE: 4,
  __dummy__: 0
}
//========================================
// Runtime essentials
//========================================
var __THREW__ = 0; // Used in checking for thrown exceptions.
var ABORT = false; // whether we are quitting the application. no code should run after this. set in exit() and abort()
var undef = 0;
// tempInt is used for 32-bit signed values or smaller. tempBigInt is used
// for 32-bit unsigned values or more than 32 bits. TODO: audit all uses of tempInt
var tempValue, tempInt, tempBigInt, tempInt2, tempBigInt2, tempPair, tempBigIntI, tempBigIntR, tempBigIntS, tempBigIntP, tempBigIntD;
var tempI64, tempI64b;
var tempRet0, tempRet1, tempRet2, tempRet3, tempRet4, tempRet5, tempRet6, tempRet7, tempRet8, tempRet9;
function assert(condition, text) {
  if (!condition) {
    abort('Assertion failed: ' + text);
  }
}
var globalScope = this;
// C calling interface. A convenient way to call C functions (in C files, or
// defined with extern "C").
//
// Note: LLVM optimizations can inline and remove functions, after which you will not be
//       able to call them. Closure can also do so. To avoid that, add your function to
//       the exports using something like
//
//         -s EXPORTED_FUNCTIONS='["_main", "_myfunc"]'
//
// @param ident      The name of the C function (note that C++ functions will be name-mangled - use extern "C")
// @param returnType The return type of the function, one of the JS types 'number', 'string' or 'array' (use 'number' for any C pointer, and
//                   'array' for JavaScript arrays and typed arrays; note that arrays are 8-bit).
// @param argTypes   An array of the types of arguments for the function (if there are no arguments, this can be ommitted). Types are as in returnType,
//                   except that 'array' is not possible (there is no way for us to know the length of the array)
// @param args       An array of the arguments to the function, as native JS values (as in returnType)
//                   Note that string arguments will be stored on the stack (the JS string will become a C string on the stack).
// @return           The return value, as a native JS value (as in returnType)
function ccall(ident, returnType, argTypes, args) {
  return ccallFunc(getCFunc(ident), returnType, argTypes, args);
}
Module["ccall"] = ccall;
// Returns the C function with a specified identifier (for C++, you need to do manual name mangling)
function getCFunc(ident) {
  try {
    var func = Module['_' + ident]; // closure exported function
    if (!func) func = eval('_' + ident); // explicit lookup
  } catch(e) {
  }
  assert(func, 'Cannot call unknown function ' + ident + ' (perhaps LLVM optimizations or closure removed it?)');
  return func;
}
// Internal function that does a C call using a function, not an identifier
function ccallFunc(func, returnType, argTypes, args) {
  var stack = 0;
  function toC(value, type) {
    if (type == 'string') {
      if (value === null || value === undefined || value === 0) return 0; // null string
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length+1);
      writeStringToMemory(value, ret);
      return ret;
    } else if (type == 'array') {
      if (!stack) stack = Runtime.stackSave();
      var ret = Runtime.stackAlloc(value.length);
      writeArrayToMemory(value, ret);
      return ret;
    }
    return value;
  }
  function fromC(value, type) {
    if (type == 'string') {
      return Pointer_stringify(value);
    }
    assert(type != 'array');
    return value;
  }
  var i = 0;
  var cArgs = args ? args.map(function(arg) {
    return toC(arg, argTypes[i++]);
  }) : [];
  var ret = fromC(func.apply(null, cArgs), returnType);
  if (stack) Runtime.stackRestore(stack);
  return ret;
}
// Returns a native JS wrapper for a C function. This is similar to ccall, but
// returns a function you can call repeatedly in a normal way. For example:
//
//   var my_function = cwrap('my_c_function', 'number', ['number', 'number']);
//   alert(my_function(5, 22));
//   alert(my_function(99, 12));
//
function cwrap(ident, returnType, argTypes) {
  var func = getCFunc(ident);
  return function() {
    return ccallFunc(func, returnType, argTypes, Array.prototype.slice.call(arguments));
  }
}
Module["cwrap"] = cwrap;
// Sets a value in memory in a dynamic way at run-time. Uses the
// type data. This is the same as makeSetValue, except that
// makeSetValue is done at compile-time and generates the needed
// code then, whereas this function picks the right code at
// run-time.
// Note that setValue and getValue only do *aligned* writes and reads!
// Note that ccall uses JS types as for defining types, while setValue and
// getValue need LLVM types ('i8', 'i32') - this is a lower-level operation
function setValue(ptr, value, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': HEAP8[(ptr)]=value; break;
      case 'i8': HEAP8[(ptr)]=value; break;
      case 'i16': HEAP16[((ptr)>>1)]=value; break;
      case 'i32': HEAP32[((ptr)>>2)]=value; break;
      case 'i64': (tempI64 = [value>>>0,((Math.min((+(Math.floor((value)/(+(4294967296))))), (+(4294967295))))|0)>>>0],HEAP32[((ptr)>>2)]=tempI64[0],HEAP32[(((ptr)+(4))>>2)]=tempI64[1]); break;
      case 'float': HEAPF32[((ptr)>>2)]=value; break;
      case 'double': HEAPF64[((ptr)>>3)]=value; break;
      default: abort('invalid type for setValue: ' + type);
    }
}
Module['setValue'] = setValue;
// Parallel to setValue.
function getValue(ptr, type, noSafe) {
  type = type || 'i8';
  if (type.charAt(type.length-1) === '*') type = 'i32'; // pointers are 32-bit
    switch(type) {
      case 'i1': return HEAP8[(ptr)];
      case 'i8': return HEAP8[(ptr)];
      case 'i16': return HEAP16[((ptr)>>1)];
      case 'i32': return HEAP32[((ptr)>>2)];
      case 'i64': return HEAP32[((ptr)>>2)];
      case 'float': return HEAPF32[((ptr)>>2)];
      case 'double': return HEAPF64[((ptr)>>3)];
      default: abort('invalid type for setValue: ' + type);
    }
  return null;
}
Module['getValue'] = getValue;
var ALLOC_NORMAL = 0; // Tries to use _malloc()
var ALLOC_STACK = 1; // Lives for the duration of the current function call
var ALLOC_STATIC = 2; // Cannot be freed
var ALLOC_DYNAMIC = 3; // Cannot be freed except through sbrk
var ALLOC_NONE = 4; // Do not allocate
Module['ALLOC_NORMAL'] = ALLOC_NORMAL;
Module['ALLOC_STACK'] = ALLOC_STACK;
Module['ALLOC_STATIC'] = ALLOC_STATIC;
Module['ALLOC_DYNAMIC'] = ALLOC_DYNAMIC;
Module['ALLOC_NONE'] = ALLOC_NONE;
// allocate(): This is for internal use. You can use it yourself as well, but the interface
//             is a little tricky (see docs right below). The reason is that it is optimized
//             for multiple syntaxes to save space in generated code. So you should
//             normally not use allocate(), and instead allocate memory using _malloc(),
//             initialize it with setValue(), and so forth.
// @slab: An array of data, or a number. If a number, then the size of the block to allocate,
//        in *bytes* (note that this is sometimes confusing: the next parameter does not
//        affect this!)
// @types: Either an array of types, one for each byte (or 0 if no type at that position),
//         or a single type which is used for the entire block. This only matters if there
//         is initial data - if @slab is a number, then this does not matter at all and is
//         ignored.
// @allocator: How to allocate memory, see ALLOC_*
function allocate(slab, types, allocator, ptr) {
  var zeroinit, size;
  if (typeof slab === 'number') {
    zeroinit = true;
    size = slab;
  } else {
    zeroinit = false;
    size = slab.length;
  }
  var singleType = typeof types === 'string' ? types : null;
  var ret;
  if (allocator == ALLOC_NONE) {
    ret = ptr;
  } else {
    ret = [_malloc, Runtime.stackAlloc, Runtime.staticAlloc, Runtime.dynamicAlloc][allocator === undefined ? ALLOC_STATIC : allocator](Math.max(size, singleType ? 1 : types.length));
  }
  if (zeroinit) {
    var ptr = ret, stop;
    assert((ret & 3) == 0);
    stop = ret + (size & ~3);
    for (; ptr < stop; ptr += 4) {
      HEAP32[((ptr)>>2)]=0;
    }
    stop = ret + size;
    while (ptr < stop) {
      HEAP8[((ptr++)|0)]=0;
    }
    return ret;
  }
  if (singleType === 'i8') {
    if (slab.subarray || slab.slice) {
      HEAPU8.set(slab, ret);
    } else {
      HEAPU8.set(new Uint8Array(slab), ret);
    }
    return ret;
  }
  var i = 0, type, typeSize, previousType;
  while (i < size) {
    var curr = slab[i];
    if (typeof curr === 'function') {
      curr = Runtime.getFunctionIndex(curr);
    }
    type = singleType || types[i];
    if (type === 0) {
      i++;
      continue;
    }
    if (type == 'i64') type = 'i32'; // special case: we have one i32 here, and one i32 later
    setValue(ret+i, curr, type);
    // no need to look up size unless type changes, so cache it
    if (previousType !== type) {
      typeSize = Runtime.getNativeTypeSize(type);
      previousType = type;
    }
    i += typeSize;
  }
  return ret;
}
Module['allocate'] = allocate;
function Pointer_stringify(ptr, /* optional */ length) {
  // Find the length, and check for UTF while doing so
  var hasUtf = false;
  var t;
  var i = 0;
  while (1) {
    t = HEAPU8[(((ptr)+(i))|0)];
    if (t >= 128) hasUtf = true;
    else if (t == 0 && !length) break;
    i++;
    if (length && i == length) break;
  }
  if (!length) length = i;
  var ret = '';
  if (!hasUtf) {
    var MAX_CHUNK = 1024; // split up into chunks, because .apply on a huge string can overflow the stack
    var curr;
    while (length > 0) {
      curr = String.fromCharCode.apply(String, HEAPU8.subarray(ptr, ptr + Math.min(length, MAX_CHUNK)));
      ret = ret ? ret + curr : curr;
      ptr += MAX_CHUNK;
      length -= MAX_CHUNK;
    }
    return ret;
  }
  var utf8 = new Runtime.UTF8Processor();
  for (i = 0; i < length; i++) {
    t = HEAPU8[(((ptr)+(i))|0)];
    ret += utf8.processCChar(t);
  }
  return ret;
}
Module['Pointer_stringify'] = Pointer_stringify;
// Memory management
var PAGE_SIZE = 4096;
function alignMemoryPage(x) {
  return ((x+4095)>>12)<<12;
}
var HEAP;
var HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
var STATIC_BASE = 0, STATICTOP = 0, staticSealed = false; // static area
var STACK_BASE = 0, STACKTOP = 0, STACK_MAX = 0; // stack area
var DYNAMIC_BASE = 0, DYNAMICTOP = 0; // dynamic area handled by sbrk
function enlargeMemory() {
  abort('Cannot enlarge memory arrays in asm.js. Either (1) compile with -s TOTAL_MEMORY=X with X higher than the current value, or (2) set Module.TOTAL_MEMORY before the program runs.');
}
var TOTAL_STACK = Module['TOTAL_STACK'] || 5242880;
var TOTAL_MEMORY = Module['TOTAL_MEMORY'] || 16777216;
var FAST_MEMORY = Module['FAST_MEMORY'] || 2097152;
// Initialize the runtime's memory
// check for full engine support (use string 'subarray' to avoid closure compiler confusion)
assert(!!Int32Array && !!Float64Array && !!(new Int32Array(1)['subarray']) && !!(new Int32Array(1)['set']),
       'Cannot fallback to non-typed array case: Code is too specialized');
var buffer = new ArrayBuffer(TOTAL_MEMORY);
HEAP8 = new Int8Array(buffer);
HEAP16 = new Int16Array(buffer);
HEAP32 = new Int32Array(buffer);
HEAPU8 = new Uint8Array(buffer);
HEAPU16 = new Uint16Array(buffer);
HEAPU32 = new Uint32Array(buffer);
HEAPF32 = new Float32Array(buffer);
HEAPF64 = new Float64Array(buffer);
// Endianness check (note: assumes compiler arch was little-endian)
HEAP32[0] = 255;
assert(HEAPU8[0] === 255 && HEAPU8[3] === 0, 'Typed arrays 2 must be run on a little-endian system');
Module['HEAP'] = HEAP;
Module['HEAP8'] = HEAP8;
Module['HEAP16'] = HEAP16;
Module['HEAP32'] = HEAP32;
Module['HEAPU8'] = HEAPU8;
Module['HEAPU16'] = HEAPU16;
Module['HEAPU32'] = HEAPU32;
Module['HEAPF32'] = HEAPF32;
Module['HEAPF64'] = HEAPF64;
function callRuntimeCallbacks(callbacks) {
  while(callbacks.length > 0) {
    var callback = callbacks.shift();
    if (typeof callback == 'function') {
      callback();
      continue;
    }
    var func = callback.func;
    if (typeof func === 'number') {
      if (callback.arg === undefined) {
        Runtime.dynCall('v', func);
      } else {
        Runtime.dynCall('vi', func, [callback.arg]);
      }
    } else {
      func(callback.arg === undefined ? null : callback.arg);
    }
  }
}
var __ATPRERUN__  = []; // functions called before the runtime is initialized
var __ATINIT__    = []; // functions called during startup
var __ATMAIN__    = []; // functions called when main() is to be run
var __ATEXIT__    = []; // functions called during shutdown
var __ATPOSTRUN__ = []; // functions called after the runtime has exited
var runtimeInitialized = false;
function preRun() {
  // compatibility - merge in anything from Module['preRun'] at this time
  if (Module['preRun']) {
    if (typeof Module['preRun'] == 'function') Module['preRun'] = [Module['preRun']];
    while (Module['preRun'].length) {
      addOnPreRun(Module['preRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPRERUN__);
}
function ensureInitRuntime() {
  if (runtimeInitialized) return;
  runtimeInitialized = true;
  callRuntimeCallbacks(__ATINIT__);
}
function preMain() {
  callRuntimeCallbacks(__ATMAIN__);
}
function exitRuntime() {
  callRuntimeCallbacks(__ATEXIT__);
}
function postRun() {
  // compatibility - merge in anything from Module['postRun'] at this time
  if (Module['postRun']) {
    if (typeof Module['postRun'] == 'function') Module['postRun'] = [Module['postRun']];
    while (Module['postRun'].length) {
      addOnPostRun(Module['postRun'].shift());
    }
  }
  callRuntimeCallbacks(__ATPOSTRUN__);
}
function addOnPreRun(cb) {
  __ATPRERUN__.unshift(cb);
}
Module['addOnPreRun'] = Module.addOnPreRun = addOnPreRun;
function addOnInit(cb) {
  __ATINIT__.unshift(cb);
}
Module['addOnInit'] = Module.addOnInit = addOnInit;
function addOnPreMain(cb) {
  __ATMAIN__.unshift(cb);
}
Module['addOnPreMain'] = Module.addOnPreMain = addOnPreMain;
function addOnExit(cb) {
  __ATEXIT__.unshift(cb);
}
Module['addOnExit'] = Module.addOnExit = addOnExit;
function addOnPostRun(cb) {
  __ATPOSTRUN__.unshift(cb);
}
Module['addOnPostRun'] = Module.addOnPostRun = addOnPostRun;
// Tools
// This processes a JS string into a C-line array of numbers, 0-terminated.
// For LLVM-originating strings, see parser.js:parseLLVMString function
function intArrayFromString(stringy, dontAddNull, length /* optional */) {
  var ret = (new Runtime.UTF8Processor()).processJSString(stringy);
  if (length) {
    ret.length = length;
  }
  if (!dontAddNull) {
    ret.push(0);
  }
  return ret;
}
Module['intArrayFromString'] = intArrayFromString;
function intArrayToString(array) {
  var ret = [];
  for (var i = 0; i < array.length; i++) {
    var chr = array[i];
    if (chr > 0xFF) {
      chr &= 0xFF;
    }
    ret.push(String.fromCharCode(chr));
  }
  return ret.join('');
}
Module['intArrayToString'] = intArrayToString;
// Write a Javascript array to somewhere in the heap
function writeStringToMemory(string, buffer, dontAddNull) {
  var array = intArrayFromString(string, dontAddNull);
  var i = 0;
  while (i < array.length) {
    var chr = array[i];
    HEAP8[(((buffer)+(i))|0)]=chr
    i = i + 1;
  }
}
Module['writeStringToMemory'] = writeStringToMemory;
function writeArrayToMemory(array, buffer) {
  for (var i = 0; i < array.length; i++) {
    HEAP8[(((buffer)+(i))|0)]=array[i];
  }
}
Module['writeArrayToMemory'] = writeArrayToMemory;
function unSign(value, bits, ignore, sig) {
  if (value >= 0) {
    return value;
  }
  return bits <= 32 ? 2*Math.abs(1 << (bits-1)) + value // Need some trickery, since if bits == 32, we are right at the limit of the bits JS uses in bitshifts
                    : Math.pow(2, bits)         + value;
}
function reSign(value, bits, ignore, sig) {
  if (value <= 0) {
    return value;
  }
  var half = bits <= 32 ? Math.abs(1 << (bits-1)) // abs is needed if bits == 32
                        : Math.pow(2, bits-1);
  if (value >= half && (bits <= 32 || value > half)) { // for huge values, we can hit the precision limit and always get true here. so don't do that
                                                       // but, in general there is no perfect solution here. With 64-bit ints, we get rounding and errors
                                                       // TODO: In i64 mode 1, resign the two parts separately and safely
    value = -2*half + value; // Cannot bitshift half, as it may be at the limit of the bits JS uses in bitshifts
  }
  return value;
}
if (!Math['imul']) Math['imul'] = function(a, b) {
  var ah  = a >>> 16;
  var al = a & 0xffff;
  var bh  = b >>> 16;
  var bl = b & 0xffff;
  return (al*bl + ((ah*bl + al*bh) << 16))|0;
};
Math.imul = Math['imul'];
// A counter of dependencies for calling run(). If we need to
// do asynchronous work before running, increment this and
// decrement it. Incrementing must happen in a place like
// PRE_RUN_ADDITIONS (used by emcc to add file preloading).
// Note that you can add dependencies in preRun, even though
// it happens right before run - run will be postponed until
// the dependencies are met.
var runDependencies = 0;
var runDependencyTracking = {};
var calledInit = false, calledRun = false;
var runDependencyWatcher = null;
function addRunDependency(id) {
  runDependencies++;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(!runDependencyTracking[id]);
    runDependencyTracking[id] = 1;
  } else {
    Module.printErr('warning: run dependency added without ID');
  }
}
Module['addRunDependency'] = addRunDependency;
function removeRunDependency(id) {
  runDependencies--;
  if (Module['monitorRunDependencies']) {
    Module['monitorRunDependencies'](runDependencies);
  }
  if (id) {
    assert(runDependencyTracking[id]);
    delete runDependencyTracking[id];
  } else {
    Module.printErr('warning: run dependency removed without ID');
  }
  if (runDependencies == 0) {
    if (runDependencyWatcher !== null) {
      clearInterval(runDependencyWatcher);
      runDependencyWatcher = null;
    } 
    // If run has never been called, and we should call run (INVOKE_RUN is true, and Module.noInitialRun is not false)
    if (!calledRun && shouldRunNow) run();
  }
}
Module['removeRunDependency'] = removeRunDependency;
Module["preloadedImages"] = {}; // maps url to image data
Module["preloadedAudios"] = {}; // maps url to audio data
function loadMemoryInitializer(filename) {
  function applyData(data) {
    HEAPU8.set(data, STATIC_BASE);
  }
  // always do this asynchronously, to keep shell and web as similar as possible
  addOnPreRun(function() {
    if (ENVIRONMENT_IS_NODE || ENVIRONMENT_IS_SHELL) {
      applyData(Module['readBinary'](filename));
    } else {
      Browser.asyncLoad(filename, function(data) {
        applyData(data);
      }, function(data) {
        throw 'could not load memory initializer ' + filename;
      });
    }
  });
}
// === Body ===
STATIC_BASE = 8;
STATICTOP = STATIC_BASE + 14144;
/* global initializers */ __ATINIT__.push({ func: function() { runPostSets() } });
/* memory initializer */ allocate([3,3,5,6,8,9,3,3,4,5,6,8,4,4,5,6,7,8,6,5,6,7,7,8,7,6,7,7,8,9,8,7,8,8,9,9,0,0,0,0,7,0,0,0,5,0,0,0,9,0,0,0,14,0,0,0,15,0,0,0,7,0,0,0,6,0,0,0,4,0,0,0,5,0,0,0,5,0,0,0,6,0,0,0,7,0,0,0,7,0,0,0,6,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,5,0,0,0,15,0,0,0,6,0,0,0,9,0,0,0,10,0,0,0,5,0,0,0,1,0,0,0,11,0,0,0,7,0,0,0,9,0,0,0,6,0,0,0,4,0,0,0,1,0,0,0,14,0,0,0,4,0,0,0,6,0,0,0,2,0,0,0,6,0,0,0,0,0,0,0,2,3,6,8,8,9,3,2,4,8,8,8,6,4,6,8,8,9,8,8,8,9,9,10,8,7,8,9,10,10,9,8,9,9,11,11,0,0,0,0,3,0,0,0,4,0,0,0,6,0,0,0,18,0,0,0,12,0,0,0,5,0,0,0,5,0,0,0,1,0,0,0,2,0,0,0,16,0,0,0,9,0,0,0,3,0,0,0,7,0,0,0,3,0,0,0,5,0,0,0,14,0,0,0,7,0,0,0,3,0,0,0,19,0,0,0,17,0,0,0,15,0,0,0,13,0,0,0,10,0,0,0,4,0,0,0,13,0,0,0,5,0,0,0,8,0,0,0,11,0,0,0,5,0,0,0,1,0,0,0,12,0,0,0,4,0,0,0,4,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,3,6,8,8,9,3,4,6,7,7,8,6,5,7,8,8,9,7,7,8,9,9,9,7,7,8,9,9,10,8,8,9,10,10,10,0,0,0,0,1,0,0,0,2,0,0,0,10,0,0,0,19,0,0,0,16,0,0,0,10,0,0,0,3,0,0,0,3,0,0,0,7,0,0,0,10,0,0,0,5,0,0,0,3,0,0,0,11,0,0,0,4,0,0,0,13,0,0,0,17,0,0,0,8,0,0,0,4,0,0,0,12,0,0,0,11,0,0,0,18,0,0,0,15,0,0,0,11,0,0,0,2,0,0,0,7,0,0,0,6,0,0,0,9,0,0,0,14,0,0,0,3,0,0,0,1,0,0,0,6,0,0,0,4,0,0,0,5,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,3,3,5,7,3,2,4,5,4,4,5,6,6,5,6,7,7,0,0,0,3,0,0,0,5,0,0,0,1,0,0,0,6,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,5,0,0,0,4,0,0,0,4,0,0,0,1,0,0,0,3,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,1,3,6,7,3,3,6,7,6,6,7,8,7,6,7,8,1,0,0,0,2,0,0,0,6,0,0,0,5,0,0,0,3,0,0,0,1,0,0,0,4,0,0,0,4,0,0,0,7,0,0,0,5,0,0,0,7,0,0,0,1,0,0,0,6,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,2,2,6,3,2,5,5,5,6,0,0,0,0,0,0,0,3,0,0,0,2,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,4,15,0,0,0,14,0,0,0,13,0,0,0,12,0,0,0,11,0,0,0,10,0,0,0,9,0,0,0,8,0,0,0,7,0,0,0,6,0,0,0,5,0,0,0,4,0,0,0,3,0,0,0,2,0,0,0,1,0,0,0,0,0,0,0,1,4,4,5,4,6,5,6,4,5,5,6,5,6,6,6,1,0,0,0,5,0,0,0,4,0,0,0,5,0,0,0,6,0,0,0,5,0,0,0,4,0,0,0,4,0,0,0,7,0,0,0,3,0,0,0,6,0,0,0,0,0,0,0,7,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,1,3,6,3,3,5,5,5,6,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,1,0,0,0,3,0,0,0,1,0,0,0,1,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,4,4,6,7,8,9,9,10,10,11,11,11,11,11,12,9,4,4,5,6,7,8,8,9,9,9,10,10,10,10,10,8,6,5,6,7,7,8,8,9,9,9,9,10,10,10,11,7,7,6,7,7,8,8,8,9,9,9,9,10,10,10,10,7,8,7,7,8,8,8,8,9,9,9,10,10,10,10,11,7,9,7,8,8,8,8,9,9,9,9,10,10,10,10,10,7,9,8,8,8,8,9,9,9,9,10,10,10,10,10,11,7,10,8,8,8,9,9,9,9,10,10,10,10,10,11,11,8,10,9,9,9,9,9,9,9,9,10,10,10,10,11,11,8,10,9,9,9,9,9,9,10,10,10,10,10,11,11,11,8,11,9,9,9,9,10,10,10,10,10,10,11,11,11,11,8,11,10,9,9,9,10,10,10,10,10,10,11,11,11,11,8,11,10,10,10,10,10,10,10,10,10,11,11,11,11,11,8,11,10,10,10,10,10,10,10,11,11,11,11,11,11,11,8,12,10,10,10,10,10,10,11,11,11,11,11,11,11,11,8,8,7,7,7,7,7,7,7,7,7,7,8,8,8,8,4,15,0,0,0,13,0,0,0,46,0,0,0,80,0,0,0,146,0,0,0,6,1,0,0,248,0,0,0,178,1,0,0,170,1,0,0,157,2,0,0,141,2,0,0,137,2,0,0,109,2,0,0,5,2,0,0,8,4,0,0,88,0,0,0,14,0,0,0,12,0,0,0,21,0,0,0,38,0,0,0,71,0,0,0,130,0,0,0,122,0,0,0,216,0,0,0,209,0,0,0,198,0,0,0,71,1,0,0,89,1,0,0,63,1,0,0,41,1,0,0,23,1,0,0,42,0,0,0,47,0,0,0,22,0,0,0,41,0,0,0,74,0,0,0,68,0,0,0,128,0,0,0,120,0,0,0,221,0,0,0,207,0,0,0,194,0,0,0,182,0,0,0,84,1,0,0,59,1,0,0,39,1,0,0,29,2,0,0,18,0,0,0,81,0,0,0,39,0,0,0,75,0,0,0,70,0,0,0,134,0,0,0,125,0,0,0,116,0,0,0,220,0,0,0,204,0,0,0,190,0,0,0,178,0,0,0,69,1,0,0,55,1,0,0,37,1,0,0,15,1,0,0,16,0,0,0,147,0,0,0,72,0,0,0,69,0,0,0,135,0,0,0,127,0,0,0,118,0,0,0,112,0,0,0,210,0,0,0,200,0,0,0,188,0,0,0,96,1,0,0,67,1,0,0,50,1,0,0,29,1,0,0,28,2,0,0,14,0,0,0,7,1,0,0,66,0,0,0,129,0,0,0,126,0,0,0,119,0,0,0,114,0,0,0,214,0,0,0,202,0,0,0,192,0,0,0,180,0,0,0,85,1,0,0,61,1,0,0,45,1,0,0,25,1,0,0,6,1,0,0,12,0,0,0,249,0,0,0,123,0,0,0,121,0,0,0,117,0,0,0,113,0,0,0,215,0,0,0,206,0,0,0,195,0,0,0,185,0,0,0,91,1,0,0,74,1,0,0,52,1,0,0,35,1,0,0,16,1,0,0,8,2,0,0,10,0,0,0,179,1,0,0,115,0,0,0,111,0,0,0,109,0,0,0,211,0,0,0,203,0,0,0,196,0,0,0,187,0,0,0,97,1,0,0,76,1,0,0,57,1,0,0,42,1,0,0,27,1,0,0,19,2,0,0,125,1,0,0,17,0,0,0,171,1,0,0,212,0,0,0,208,0,0,0,205,0,0,0,201,0,0,0,193,0,0,0,186,0,0,0,177,0,0,0,169,0,0,0,64,1,0,0,47,1,0,0,30,1,0,0,12,1,0,0,2,2,0,0,121,1,0,0,16,0,0,0,79,1,0,0,199,0,0,0,197,0,0,0,191,0,0,0,189,0,0,0,181,0,0,0,174,0,0,0,77,1,0,0,65,1,0,0,49,1,0,0,33,1,0,0,19,1,0,0,9,2,0,0,123,1,0,0,115,1,0,0,11,0,0,0,156,2,0,0,184,0,0,0,183,0,0,0,179,0,0,0,175,0,0,0,88,1,0,0,75,1,0,0,58,1,0,0,48,1,0,0,34,1,0,0,21,1,0,0,18,2,0,0,127,1,0,0,117,1,0,0,110,1,0,0,10,0,0,0,140,2,0,0,90,1,0,0,171,0,0,0,168,0,0,0,164,0,0,0,62,1,0,0,53,1,0,0,43,1,0,0,31,1,0,0,20,1,0,0,7,1,0,0,1,2,0,0,119,1,0,0,112,1,0,0,106,1,0,0,6,0,0,0,136,2,0,0,66,1,0,0,60,1,0,0,56,1,0,0,51,1,0,0,46,1,0,0,36,1,0,0,28,1,0,0,13,1,0,0,5,1,0,0,0,2,0,0,120,1,0,0,114,1,0,0,108,1,0,0,103,1,0,0,4,0,0,0,108,2,0,0,44,1,0,0,40,1,0,0,38,1,0,0,32,1,0,0,26,1,0,0,17,1,0,0,10,1,0,0,3,2,0,0,124,1,0,0,118,1,0,0,113,1,0,0,109,1,0,0,105,1,0,0,101,1,0,0,2,0,0,0,9,4,0,0,24,1,0,0,22,1,0,0,18,1,0,0,11,1,0,0,8,1,0,0,3,1,0,0,126,1,0,0,122,1,0,0,116,1,0,0,111,1,0,0,107,1,0,0,104,1,0,0,102,1,0,0,100,1,0,0,0,0,0,0,43,0,0,0,20,0,0,0,19,0,0,0,17,0,0,0,15,0,0,0,13,0,0,0,11,0,0,0,9,0,0,0,7,0,0,0,6,0,0,0,4,0,0,0,7,0,0,0,5,0,0,0,3,0,0,0,1,0,0,0,3,0,0,0,1,3,2,3,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,4,6,8,9,9,10,10,11,11,11,12,12,12,13,9,3,4,6,7,8,9,9,9,10,10,10,11,12,11,12,8,6,6,7,8,9,9,10,10,11,10,11,11,11,12,12,9,8,7,8,9,9,10,10,10,11,11,12,12,12,13,13,10,9,8,9,9,10,10,11,11,11,12,12,12,13,13,13,9,9,8,9,9,10,11,11,12,11,12,12,13,13,13,14,10,10,9,9,10,11,11,11,11,12,12,12,12,13,13,14,10,10,9,10,10,11,11,11,12,12,13,13,13,13,15,15,10,10,10,10,11,11,11,12,12,13,13,13,13,14,14,14,10,11,10,10,11,11,12,12,13,13,13,13,14,13,14,13,11,11,11,10,11,12,12,12,12,13,14,14,14,15,15,14,10,12,11,11,11,12,12,13,14,14,14,14,14,14,13,14,11,12,12,12,12,12,13,13,13,13,15,14,14,14,14,16,11,14,12,12,12,13,13,14,14,14,16,15,15,15,17,15,11,13,13,11,12,14,14,13,14,14,15,16,15,17,15,14,11,9,8,8,9,9,10,10,10,11,11,11,11,11,11,11,8,1,0,0,0,5,0,0,0,14,0,0,0,44,0,0,0,74,0,0,0,63,0,0,0,110,0,0,0,93,0,0,0,172,0,0,0,149,0,0,0,138,0,0,0,242,0,0,0,225,0,0,0,195,0,0,0,120,1,0,0,17,0,0,0,3,0,0,0,4,0,0,0,12,0,0,0,20,0,0,0,35,0,0,0,62,0,0,0,53,0,0,0,47,0,0,0,83,0,0,0,75,0,0,0,68,0,0,0,119,0,0,0,201,0,0,0,107,0,0,0,207,0,0,0,9,0,0,0,15,0,0,0,13,0,0,0,23,0,0,0,38,0,0,0,67,0,0,0,58,0,0,0,103,0,0,0,90,0,0,0,161,0,0,0,72,0,0,0,127,0,0,0,117,0,0,0,110,0,0,0,209,0,0,0,206,0,0,0,16,0,0,0,45,0,0,0,21,0,0,0,39,0,0,0,69,0,0,0,64,0,0,0,114,0,0,0,99,0,0,0,87,0,0,0,158,0,0,0,140,0,0,0,252,0,0,0,212,0,0,0,199,0,0,0,131,1,0,0,109,1,0,0,26,0,0,0,75,0,0,0,36,0,0,0,68,0,0,0,65,0,0,0,115,0,0,0,101,0,0,0,179,0,0,0,164,0,0,0,155,0,0,0,8,1,0,0,246,0,0,0,226,0,0,0,139,1,0,0,126,1,0,0,106,1,0,0,9,0,0,0,66,0,0,0,30,0,0,0,59,0,0,0,56,0,0,0,102,0,0,0,185,0,0,0,173,0,0,0,9,1,0,0,142,0,0,0,253,0,0,0,232,0,0,0,144,1,0,0,132,1,0,0,122,1,0,0,189,1,0,0,16,0,0,0,111,0,0,0,54,0,0,0,52,0,0,0,100,0,0,0,184,0,0,0,178,0,0,0,160,0,0,0,133,0,0,0,1,1,0,0,244,0,0,0,228,0,0,0,217,0,0,0,129,1,0,0,110,1,0,0,203,2,0,0,10,0,0,0,98,0,0,0,48,0,0,0,91,0,0,0,88,0,0,0,165,0,0,0,157,0,0,0,148,0,0,0,5,1,0,0,248,0,0,0,151,1,0,0,141,1,0,0,116,1,0,0,124,1,0,0,121,3,0,0,116,3,0,0,8,0,0,0,85,0,0,0,84,0,0,0,81,0,0,0,159,0,0,0,156,0,0,0,143,0,0,0,4,1,0,0,249,0,0,0,171,1,0,0,145,1,0,0,136,1,0,0,127,1,0,0,215,2,0,0,201,2,0,0,196,2,0,0,7,0,0,0,154,0,0,0,76,0,0,0,73,0,0,0,141,0,0,0,131,0,0,0,0,1,0,0,245,0,0,0,170,1,0,0,150,1,0,0,138,1,0,0,128,1,0,0,223,2,0,0,103,1,0,0,198,2,0,0,96,1,0,0,11,0,0,0,139,0,0,0,129,0,0,0,67,0,0,0,125,0,0,0,247,0,0,0,233,0,0,0,229,0,0,0,219,0,0,0,137,1,0,0,231,2,0,0,225,2,0,0,208,2,0,0,117,3,0,0,114,3,0,0,183,1,0,0,4,0,0,0,243,0,0,0,120,0,0,0,118,0,0,0,115,0,0,0,227,0,0,0,223,0,0,0,140,1,0,0,234,2,0,0,230,2,0,0,224,2,0,0,209,2,0,0,200,2,0,0,194,2,0,0,223,0,0,0,180,1,0,0,6,0,0,0,202,0,0,0,224,0,0,0,222,0,0,0,218,0,0,0,216,0,0,0,133,1,0,0,130,1,0,0,125,1,0,0,108,1,0,0,120,3,0,0,187,1,0,0,195,2,0,0,184,1,0,0,181,1,0,0,192,6,0,0,4,0,0,0,235,2,0,0,211,0,0,0,210,0,0,0,208,0,0,0,114,1,0,0,123,1,0,0,222,2,0,0,211,2,0,0,202,2,0,0,199,6,0,0,115,3,0,0,109,3,0,0,108,3,0,0,131,13,0,0,97,3,0,0,2,0,0,0,121,1,0,0,113,1,0,0,102,0,0,0,187,0,0,0,214,2,0,0,210,2,0,0,102,1,0,0,199,2,0,0,197,2,0,0,98,3,0,0,198,6,0,0,103,3,0,0,130,13,0,0,102,3,0,0,178,1,0,0,0,0,0,0,12,0,0,0,10,0,0,0,7,0,0,0,11,0,0,0,10,0,0,0,17,0,0,0,11,0,0,0,9,0,0,0,13,0,0,0,12,0,0,0,10,0,0,0,7,0,0,0,5,0,0,0,3,0,0,0,1,0,0,0,3,0,0,0,3,4,5,7,7,8,9,9,9,10,10,11,11,11,12,13,4,3,5,6,7,7,8,8,8,9,9,10,10,10,11,11,5,5,5,6,7,7,8,8,8,9,9,10,10,11,11,11,6,6,6,7,7,8,8,9,9,9,10,10,10,11,11,11,7,6,7,7,8,8,9,9,9,9,10,10,10,11,11,11,8,7,7,8,8,8,9,9,9,9,10,10,11,11,11,12,9,7,8,8,8,9,9,9,9,10,10,10,11,11,12,12,9,8,8,9,9,9,9,10,10,10,10,10,11,11,11,12,9,8,8,9,9,9,9,10,10,10,10,11,11,12,12,12,9,8,9,9,9,9,10,10,10,11,11,11,11,12,12,12,10,9,9,9,10,10,10,10,10,11,11,11,11,12,13,12,10,9,9,9,10,10,10,10,11,11,11,11,12,12,12,13,11,10,9,10,10,10,11,11,11,11,11,11,12,12,13,13,11,10,10,10,10,11,11,11,11,12,12,12,12,12,13,13,12,11,11,11,11,11,11,11,12,12,12,12,13,13,12,13,12,11,11,11,11,11,11,12,12,12,12,12,13,13,13,13,7,0,0,0,12,0,0,0,18,0,0,0,53,0,0,0,47,0,0,0,76,0,0,0,124,0,0,0,108,0,0,0,89,0,0,0,123,0,0,0,108,0,0,0,119,0,0,0,107,0,0,0,81,0,0,0,122,0,0,0,63,0,0,0,13,0,0,0,5,0,0,0,16,0,0,0,27,0,0,0,46,0,0,0,36,0,0,0,61,0,0,0,51,0,0,0,42,0,0,0,70,0,0,0,52,0,0,0,83,0,0,0,65,0,0,0,41,0,0,0,59,0,0,0,36,0,0,0,19,0,0,0,17,0,0,0,15,0,0,0,24,0,0,0,41,0,0,0,34,0,0,0,59,0,0,0,48,0,0,0,40,0,0,0,64,0,0,0,50,0,0,0,78,0,0,0,62,0,0,0,80,0,0,0,56,0,0,0,33,0,0,0,29,0,0,0,28,0,0,0,25,0,0,0,43,0,0,0,39,0,0,0,63,0,0,0,55,0,0,0,93,0,0,0,76,0,0,0,59,0,0,0,93,0,0,0,72,0,0,0,54,0,0,0,75,0,0,0,50,0,0,0,29,0,0,0,52,0,0,0,22,0,0,0,42,0,0,0,40,0,0,0,67,0,0,0,57,0,0,0,95,0,0,0,79,0,0,0,72,0,0,0,57,0,0,0,89,0,0,0,69,0,0,0,49,0,0,0,66,0,0,0,46,0,0,0,27,0,0,0,77,0,0,0,37,0,0,0,35,0,0,0,66,0,0,0,58,0,0,0,52,0,0,0,91,0,0,0,74,0,0,0,62,0,0,0,48,0,0,0,79,0,0,0,63,0,0,0,90,0,0,0,62,0,0,0,40,0,0,0,38,0,0,0,125,0,0,0,32,0,0,0,60,0,0,0,56,0,0,0,50,0,0,0,92,0,0,0,78,0,0,0,65,0,0,0,55,0,0,0,87,0,0,0,71,0,0,0,51,0,0,0,73,0,0,0,51,0,0,0,70,0,0,0,30,0,0,0,109,0,0,0,53,0,0,0,49,0,0,0,94,0,0,0,88,0,0,0,75,0,0,0,66,0,0,0,122,0,0,0,91,0,0,0,73,0,0,0,56,0,0,0,42,0,0,0,64,0,0,0,44,0,0,0,21,0,0,0,25,0,0,0,90,0,0,0,43,0,0,0,41,0,0,0,77,0,0,0,73,0,0,0,63,0,0,0,56,0,0,0,92,0,0,0,77,0,0,0,66,0,0,0,47,0,0,0,67,0,0,0,48,0,0,0,53,0,0,0,36,0,0,0,20,0,0,0,71,0,0,0,34,0,0,0,67,0,0,0,60,0,0,0,58,0,0,0,49,0,0,0,88,0,0,0,76,0,0,0,67,0,0,0,106,0,0,0,71,0,0,0,54,0,0,0,38,0,0,0,39,0,0,0,23,0,0,0,15,0,0,0,109,0,0,0,53,0,0,0,51,0,0,0,47,0,0,0,90,0,0,0,82,0,0,0,58,0,0,0,57,0,0,0,48,0,0,0,72,0,0,0,57,0,0,0,41,0,0,0,23,0,0,0,27,0,0,0,62,0,0,0,9,0,0,0,86,0,0,0,42,0,0,0,40,0,0,0,37,0,0,0,70,0,0,0,64,0,0,0,52,0,0,0,43,0,0,0,70,0,0,0,55,0,0,0,42,0,0,0,25,0,0,0,29,0,0,0,18,0,0,0,11,0,0,0,11,0,0,0,118,0,0,0,68,0,0,0,30,0,0,0,55,0,0,0,50,0,0,0,46,0,0,0,74,0,0,0,65,0,0,0,49,0,0,0,39,0,0,0,24,0,0,0,16,0,0,0,22,0,0,0,13,0,0,0,14,0,0,0,7,0,0,0,91,0,0,0,44,0,0,0,39,0,0,0,38,0,0,0,34,0,0,0,63,0,0,0,52,0,0,0,45,0,0,0,31,0,0,0,52,0,0,0,28,0,0,0,19,0,0,0,14,0,0,0,8,0,0,0,9,0,0,0,3,0,0,0,123,0,0,0,60,0,0,0,58,0,0,0,53,0,0,0,47,0,0,0,43,0,0,0,32,0,0,0,22,0,0,0,37,0,0,0,24,0,0,0,17,0,0,0,12,0,0,0,15,0,0,0,10,0,0,0,2,0,0,0,1,0,0,0,71,0,0,0,37,0,0,0,34,0,0,0,30,0,0,0,28,0,0,0,20,0,0,0,17,0,0,0,26,0,0,0,21,0,0,0,16,0,0,0,10,0,0,0,6,0,0,0,8,0,0,0,6,0,0,0,2,0,0,0,0,0,0,0,1,4,6,7,8,9,9,10,9,10,11,11,12,12,13,13,3,4,6,7,8,8,9,9,9,9,10,10,11,12,12,12,6,6,7,8,9,9,10,10,9,10,10,11,11,12,13,13,7,7,8,9,9,10,10,10,10,11,11,11,11,12,13,13,8,7,9,9,10,10,11,11,10,11,11,12,12,13,13,14,9,8,9,10,10,10,11,11,11,11,12,11,13,13,14,14,9,9,10,10,11,11,11,11,11,12,12,12,13,13,14,14,10,9,10,11,11,11,12,12,12,12,13,13,13,14,16,16,9,8,9,10,10,11,11,12,12,12,12,13,13,14,15,15,10,9,10,10,11,11,11,13,12,13,13,14,14,14,16,15,10,10,10,11,11,12,12,13,12,13,14,13,14,15,16,17,11,10,10,11,12,12,12,12,13,13,13,14,15,15,15,16,11,11,11,12,12,13,12,13,14,14,15,15,15,16,16,16,12,11,12,13,13,13,14,14,14,14,14,15,16,15,16,16,13,12,12,13,13,13,15,14,14,17,15,15,15,17,16,16,12,12,13,14,14,14,15,14,15,15,16,16,19,18,19,16,1,0,0,0,5,0,0,0,14,0,0,0,21,0,0,0,34,0,0,0,51,0,0,0,46,0,0,0,71,0,0,0,42,0,0,0,52,0,0,0,68,0,0,0,52,0,0,0,67,0,0,0,44,0,0,0,43,0,0,0,19,0,0,0,3,0,0,0,4,0,0,0,12,0,0,0,19,0,0,0,31,0,0,0,26,0,0,0,44,0,0,0,33,0,0,0,31,0,0,0,24,0,0,0,32,0,0,0,24,0,0,0,31,0,0,0,35,0,0,0,22,0,0,0,14,0,0,0,15,0,0,0,13,0,0,0,23,0,0,0,36,0,0,0,59,0,0,0,49,0,0,0,77,0,0,0,65,0,0,0,29,0,0,0,40,0,0,0,30,0,0,0,40,0,0,0,27,0,0,0,33,0,0,0,42,0,0,0,16,0,0,0,22,0,0,0,20,0,0,0,37,0,0,0,61,0,0,0,56,0,0,0,79,0,0,0,73,0,0,0,64,0,0,0,43,0,0,0,76,0,0,0,56,0,0,0,37,0,0,0,26,0,0,0,31,0,0,0,25,0,0,0,14,0,0,0,35,0,0,0,16,0,0,0,60,0,0,0,57,0,0,0,97,0,0,0,75,0,0,0,114,0,0,0,91,0,0,0,54,0,0,0,73,0,0,0,55,0,0,0,41,0,0,0,48,0,0,0,53,0,0,0,23,0,0,0,24,0,0,0,58,0,0,0,27,0,0,0,50,0,0,0,96,0,0,0,76,0,0,0,70,0,0,0,93,0,0,0,84,0,0,0,77,0,0,0,58,0,0,0,79,0,0,0,29,0,0,0,74,0,0,0,49,0,0,0,41,0,0,0,17,0,0,0,47,0,0,0,45,0,0,0,78,0,0,0,74,0,0,0,115,0,0,0,94,0,0,0,90,0,0,0,79,0,0,0,69,0,0,0,83,0,0,0,71,0,0,0,50,0,0,0,59,0,0,0,38,0,0,0,36,0,0,0,15,0,0,0,72,0,0,0,34,0,0,0,56,0,0,0,95,0,0,0,92,0,0,0,85,0,0,0,91,0,0,0,90,0,0,0,86,0,0,0,73,0,0,0,77,0,0,0,65,0,0,0,51,0,0,0,44,0,0,0,43,0,0,0,42,0,0,0,43,0,0,0,20,0,0,0,30,0,0,0,44,0,0,0,55,0,0,0,78,0,0,0,72,0,0,0,87,0,0,0,78,0,0,0,61,0,0,0,46,0,0,0,54,0,0,0,37,0,0,0,30,0,0,0,20,0,0,0,16,0,0,0,53,0,0,0,25,0,0,0,41,0,0,0,37,0,0,0,44,0,0,0,59,0,0,0,54,0,0,0,81,0,0,0,66,0,0,0,76,0,0,0,57,0,0,0,54,0,0,0,37,0,0,0,18,0,0,0,39,0,0,0,11,0,0,0,35,0,0,0,33,0,0,0,31,0,0,0,57,0,0,0,42,0,0,0,82,0,0,0,72,0,0,0,80,0,0,0,47,0,0,0,58,0,0,0,55,0,0,0,21,0,0,0,22,0,0,0,26,0,0,0,38,0,0,0,22,0,0,0,53,0,0,0,25,0,0,0,23,0,0,0,38,0,0,0,70,0,0,0,60,0,0,0,51,0,0,0,36,0,0,0,55,0,0,0,26,0,0,0,34,0,0,0,23,0,0,0,27,0,0,0,14,0,0,0,9,0,0,0,7,0,0,0,34,0,0,0,32,0,0,0,28,0,0,0,39,0,0,0,49,0,0,0,75,0,0,0,30,0,0,0,52,0,0,0,48,0,0,0,40,0,0,0,52,0,0,0,28,0,0,0,18,0,0,0,17,0,0,0,9,0,0,0,5,0,0,0,45,0,0,0,21,0,0,0,34,0,0,0,64,0,0,0,56,0,0,0,50,0,0,0,49,0,0,0,45,0,0,0,31,0,0,0,19,0,0,0,12,0,0,0,15,0,0,0,10,0,0,0,7,0,0,0,6,0,0,0,3,0,0,0,48,0,0,0,23,0,0,0,20,0,0,0,39,0,0,0,36,0,0,0,35,0,0,0,53,0,0,0,21,0,0,0,16,0,0,0,23,0,0,0,13,0,0,0,10,0,0,0,6,0,0,0,1,0,0,0,4,0,0,0,2,0,0,0,16,0,0,0,15,0,0,0,17,0,0,0,27,0,0,0,25,0,0,0,20,0,0,0,29,0,0,0,11,0,0,0,17,0,0,0,12,0,0,0,16,0,0,0,8,0,0,0,1,0,0,0,1,0,0,0,0,0,0,0,1,0,0,0,4,3,5,7,8,9,9,9,3,3,4,5,7,7,8,8,5,4,5,6,7,8,7,8,6,5,6,6,7,8,8,8,7,6,7,7,8,8,8,9,8,7,8,8,8,9,8,9,8,7,7,8,8,9,9,10,9,8,8,9,9,9,9,10,9,0,0,0,6,0,0,0,16,0,0,0,33,0,0,0,41,0,0,0,39,0,0,0,38,0,0,0,26,0,0,0,7,0,0,0,5,0,0,0,6,0,0,0,9,0,0,0,23,0,0,0,16,0,0,0,26,0,0,0,11,0,0,0,17,0,0,0,7,0,0,0,11,0,0,0,14,0,0,0,21,0,0,0,30,0,0,0,10,0,0,0,7,0,0,0,17,0,0,0,10,0,0,0,15,0,0,0,12,0,0,0,18,0,0,0,28,0,0,0,14,0,0,0,5,0,0,0,32,0,0,0,13,0,0,0,22,0,0,0,19,0,0,0,18,0,0,0,16,0,0,0,9,0,0,0,5,0,0,0,40,0,0,0,17,0,0,0,31,0,0,0,29,0,0,0,17,0,0,0,13,0,0,0,4,0,0,0,2,0,0,0,27,0,0,0,12,0,0,0,11,0,0,0,15,0,0,0,10,0,0,0,7,0,0,0,4,0,0,0,1,0,0,0,27,0,0,0,12,0,0,0,8,0,0,0,12,0,0,0,6,0,0,0,3,0,0,0,1,0,0,0,0,0,0,0,2,3,5,7,8,9,8,9,3,3,4,6,8,8,7,8,5,5,6,7,8,9,8,8,7,6,7,9,8,10,8,9,8,8,8,9,9,10,9,10,8,8,9,10,10,11,10,11,8,7,7,8,9,10,10,10,8,7,8,9,10,10,10,10,3,0,0,0,4,0,0,0,10,0,0,0,24,0,0,0,34,0,0,0,33,0,0,0,21,0,0,0,15,0,0,0,5,0,0,0,3,0,0,0,4,0,0,0,10,0,0,0,32,0,0,0,17,0,0,0,11,0,0,0,10,0,0,0,11,0,0,0,7,0,0,0,13,0,0,0,18,0,0,0,30,0,0,0,31,0,0,0,20,0,0,0,5,0,0,0,25,0,0,0,11,0,0,0,19,0,0,0,59,0,0,0,27,0,0,0,18,0,0,0,12,0,0,0,5,0,0,0,35,0,0,0,33,0,0,0,31,0,0,0,58,0,0,0,30,0,0,0,16,0,0,0,7,0,0,0,5,0,0,0,28,0,0,0,26,0,0,0,32,0,0,0,19,0,0,0,17,0,0,0,15,0,0,0,8,0,0,0,14,0,0,0,14,0,0,0,12,0,0,0,9,0,0,0,13,0,0,0,14,0,0,0,9,0,0,0,4,0,0,0,1,0,0,0,11,0,0,0,4,0,0,0,6,0,0,0,6,0,0,0,6,0,0,0,3,0,0,0,2,0,0,0,0,0,0,0,1,3,6,8,9,9,9,10,3,4,6,7,8,9,8,8,6,6,7,8,9,10,9,9,7,7,8,9,10,10,9,10,8,8,9,10,10,10,10,10,9,9,10,10,11,11,10,11,8,8,9,10,10,10,11,11,9,8,9,10,10,11,11,11,1,0,0,0,2,0,0,0,10,0,0,0,23,0,0,0,35,0,0,0,30,0,0,0,12,0,0,0,17,0,0,0,3,0,0,0,3,0,0,0,8,0,0,0,12,0,0,0,18,0,0,0,21,0,0,0,12,0,0,0,7,0,0,0,11,0,0,0,9,0,0,0,15,0,0,0,21,0,0,0,32,0,0,0,40,0,0,0,19,0,0,0,6,0,0,0,14,0,0,0,13,0,0,0,22,0,0,0,34,0,0,0,46,0,0,0,23,0,0,0,18,0,0,0,7,0,0,0,20,0,0,0,19,0,0,0,33,0,0,0,47,0,0,0,27,0,0,0,22,0,0,0,9,0,0,0,3,0,0,0,31,0,0,0,22,0,0,0,41,0,0,0,26,0,0,0,21,0,0,0,20,0,0,0,5,0,0,0,3,0,0,0,14,0,0,0,13,0,0,0,10,0,0,0,11,0,0,0,16,0,0,0,6,0,0,0,5,0,0,0,1,0,0,0,9,0,0,0,8,0,0,0,7,0,0,0,8,0,0,0,4,0,0,0,4,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,5,0,0,0,4,0,0,0,6,0,0,0,5,0,0,0,6,0,0,0,5,0,0,0,6,0,0,0,5,0,0,0,7,0,0,0,6,0,0,0,7,0,0,0,6,0,0,0,7,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,1,0,0,0,2,0,0,0,3,0,0,0,2,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,3,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,0,3,0,0,0,3,0,0,0,3,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,52,0,0,0,62,0,0,0,74,0,0,0,90,0,0,0,110,0,0,0,134,0,0,0,162,0,0,0,196,0,0,0,238,0,0,0,32,1,0,0,86,1,0,0,162,1,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,42,0,0,0,50,0,0,0,60,0,0,0,72,0,0,0,88,0,0,0,106,0,0,0,128,0,0,0,156,0,0,0,190,0,0,0,230,0,0,0,20,1,0,0,74,1,0,0,128,1,0,0,64,2,0,0,0,0,0,0,4,0,0,0,8,0,0,0,12,0,0,0,16,0,0,0,20,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,82,0,0,0,102,0,0,0,126,0,0,0,156,0,0,0,194,0,0,0,240,0,0,0,40,1,0,0,108,1,0,0,192,1,0,0,38,2,0,0,64,2,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,116,0,0,0,140,0,0,0,168,0,0,0,200,0,0,0,238,0,0,0,28,1,0,0,80,1,0,0,140,1,0,0,208,1,0,0,10,2,0,0,64,2,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,114,0,0,0,136,0,0,0,162,0,0,0,194,0,0,0,232,0,0,0,22,1,0,0,74,1,0,0,138,1,0,0,208,1,0,0,28,2,0,0,64,2,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,45,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,116,0,0,0,140,0,0,0,168,0,0,0,200,0,0,0,238,0,0,0,248,0,0,0,80,1,0,0,140,1,0,0,208,1,0,0,10,2,0,0,64,2,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,116,0,0,0,140,0,0,0,168,0,0,0,200,0,0,0,238,0,0,0,28,1,0,0,80,1,0,0,140,1,0,0,208,1,0,0,10,2,0,0,64,2,0,0,0,0,0,0,6,0,0,0,12,0,0,0,18,0,0,0,24,0,0,0,30,0,0,0,36,0,0,0,44,0,0,0,54,0,0,0,66,0,0,0,80,0,0,0,96,0,0,0,116,0,0,0,140,0,0,0,168,0,0,0,200,0,0,0,238,0,0,0,28,1,0,0,80,1,0,0,140,1,0,0,208,1,0,0,10,2,0,0,64,2,0,0,0,0,0,0,12,0,0,0,24,0,0,0,36,0,0,0,48,0,0,0,60,0,0,0,72,0,0,0,88,0,0,0,108,0,0,0,132,0,0,0,160,0,0,0,192,0,0,0,232,0,0,0,24,1,0,0,80,1,0,0,144,1,0,0,220,1,0,0,54,2,0,0,56,2,0,0,58,2,0,0,60,2,0,0,62,2,0,0,64,2,0,0,0,0,0,0,0,0,0,0,1,0,0,0,3,0,0,0,7,0,0,0,15,0,0,0,31,0,0,0,63,0,0,0,127,0,0,0,255,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,0,0,0,2,0,0,0,0,0,0,0,0,0,0,0,232,8,0,0,224,8,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,184,3,0,0,168,3,0,0,3,0,0,0,3,0,0,0,0,0,0,0,0,0,0,0,224,2,0,0,208,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,144,2,0,0,128,2,0,0,4,0,0,0,4,0,0,0,0,0,0,0,0,0,0,0,64,2,0,0,48,2,0,0,6,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,160,1,0,0,120,1,0,0,6,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,232,0,0,0,192,0,0,0,6,0,0,0,6,0,0,0,0,0,0,0,0,0,0,0,48,0,0,0,8,0,0,0,8,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,184,26,0,0,120,26,0,0,8,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,120,25,0,0,56,25,0,0,8,0,0,0,8,0,0,0,0,0,0,0,0,0,0,0,56,24,0,0,248,23,0,0,16,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,248,19,0,0,248,18,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,248,14,0,0,248,13,0,0,16,0,0,0,16,0,0,0,1,0,0,0,1,0,0,0,248,9,0,0,248,8,0,0,16,0,0,0,16,0,0,0,2,0,0,0,3,0,0,0,248,9,0,0,248,8,0,0,16,0,0,0,16,0,0,0,3,0,0,0,7,0,0,0,248,9,0,0,248,8,0,0,16,0,0,0,16,0,0,0,4,0,0,0,15,0,0,0,248,9,0,0,248,8,0,0,16,0,0,0,16,0,0,0,6,0,0,0,63,0,0,0,248,9,0,0,248,8,0,0,16,0,0,0,16,0,0,0,8,0,0,0,255,0,0,0,248,9,0,0,248,8,0,0,16,0,0,0,16,0,0,0,10,0,0,0,255,3,0,0,248,9,0,0,248,8,0,0,16,0,0,0,16,0,0,0,13,0,0,0,255,31,0,0,248,9,0,0,248,8,0,0,16,0,0,0,16,0,0,0,4,0,0,0,15,0,0,0,224,4,0,0,224,3,0,0,16,0,0,0,16,0,0,0,5,0,0,0,31,0,0,0,224,4,0,0,224,3,0,0,16,0,0,0,16,0,0,0,6,0,0,0,63,0,0,0,224,4,0,0,224,3,0,0,16,0,0,0,16,0,0,0,7,0,0,0,127,0,0,0,224,4,0,0,224,3,0,0,16,0,0,0,16,0,0,0,8,0,0,0,255,0,0,0,224,4,0,0,224,3,0,0,16,0,0,0,16,0,0,0,9,0,0,0,255,1,0,0,224,4,0,0,224,3,0,0,16,0,0,0,16,0,0,0,11,0,0,0,255,7,0,0,224,4,0,0,224,3,0,0,16,0,0,0,16,0,0,0,13,0,0,0,255,31,0,0,224,4,0,0,224,3,0,0,1,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,104,3,0,0,88,3,0,0,1,0,0,0,16,0,0,0,0,0,0,0,0,0,0,0,24,3,0,0,8,3,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,141,237,181,160,247,198,176,190,141,237,181,160,247,198,176,190,141,237,181,160,247,198,176,190,141,237,181,160,247,198,176,190,141,237,181,160,247,198,176,190,141,237,181,160,247,198,176,190,141,237,181,160,247,198,192,190,141,237,181,160,247,198,192,190,141,237,181,160,247,198,192,190,141,237,181,160,247,198,192,190,84,228,16,113,115,42,201,190,84,228,16,113,115,42,201,190,84,228,16,113,115,42,201,190,141,237,181,160,247,198,208,190,141,237,181,160,247,198,208,190,241,104,227,136,181,248,212,190,241,104,227,136,181,248,212,190,84,228,16,113,115,42,217,190,183,95,62,89,49,92,221,190,141,237,181,160,247,198,224,190,141,237,181,160,247,198,224,190,63,171,204,148,214,223,226,190,241,104,227,136,181,248,228,190,162,38,250,124,148,17,231,190,84,228,16,113,115,42,233,190,183,95,62,89,49,92,237,190,105,29,85,77,16,117,239,190,102,76,193,26,103,211,241,190,63,171,204,148,214,223,242,190,241,104,227,136,181,248,244,190,201,199,238,2,37,5,246,190,123,133,5,247,3,30,248,190,45,67,28,235,226,54,250,190,183,95,62,89,49,92,253,190,105,29,85,77,16,117,255,190,141,237,181,160,247,198,0,191,210,251,198,215,158,89,2,191,24,10,216,14,70,236,3,191,93,24,233,69,237,126,5,191,54,119,244,191,92,139,6,191,123,133,5,247,3,30,8,191,45,67,28,235,226,54,10,191,114,81,45,34,138,201,11,191,183,95,62,89,49,92,13,191,105,29,85,77,16,117,15,191,215,21,51,194,219,131,16,191,250,156,187,93,47,77,17,191,210,251,198,215,158,89,18,191,245,130,79,115,242,34,19,191,206,225,90,237,97,47,20,191,167,64,102,103,209,59,21,191,201,199,238,2,37,5,22,191,236,78,119,158,120,206,22,191,197,173,130,24,232,218,23,191,49,93,136,213,31,97,24,191,84,228,16,113,115,42,25,191,118,107,153,12,199,243,25,191,153,242,33,168,26,189,26,63,5,162,39,101,82,67,27,63,114,81,45,34,138,201,27,63,40,41,176,0,166,12,28,63,222,0,51,223,193,79,28,63,149,216,181,189,221,146,28,63,149,216,181,189,221,146,28,63,222,0,51,223,193,79,28,63,40,41,176,0,166,12,28,63,188,121,170,67,110,134,27,63,79,202,164,134,54,0,27,63,118,107,153,12,199,243,25,63,158,12,142,146,87,231,24,63,15,214,255,57,204,151,23,63,201,199,238,2,37,5,22,63,132,185,221,203,125,114,20,63,210,251,198,215,158,89,18,63,213,204,90,10,72,251,15,63,153,242,33,168,26,189,10,63,241,104,227,136,181,248,4,63,222,0,51,223,193,79,252,62,183,95,62,89,49,92,237,62,141,237,181,160,247,198,176,190,102,76,193,26,103,211,241,190,102,76,193,26,103,211,1,191,114,81,45,34,138,201,11,191,245,130,79,115,242,34,19,191,231,52,11,180,59,164,24,191,144,190,73,211,160,104,30,191,210,251,198,215,158,89,34,191,56,132,42,53,123,160,37,191,121,120,207,129,229,8,41,191,112,68,247,172,107,180,44,191,51,136,15,236,248,47,48,191,10,218,228,240,73,39,50,191,206,225,90,237,97,47,52,191,146,233,208,233,121,55,54,191,68,167,231,221,88,80,56,191,227,26,159,201,254,121,58,191,112,68,247,172,107,180,60,191,234,35,240,135,159,255,62,191,187,38,164,53,6,157,64,191,120,150,32,35,160,194,65,191,54,6,157,16,58,232,66,191,243,117,25,254,211,13,68,191,176,229,149,235,109,51,69,191,118,250,65,93,164,80,70,191,70,180,29,83,119,101,71,191,22,110,249,72,74,122,72,191,238,204,4,195,185,134,73,191,208,208,63,193,197,138,74,191,197,30,218,199,10,126,75,191,204,182,211,214,136,96,76,191,220,243,252,105,163,58,77,191,8,32,181,137,147,251,77,191,70,150,204,177,188,171,78,191,160,251,114,102,187,66,79,191,22,80,168,167,143,192,79,191,212,73,182,186,156,18,80,191,175,181,247,169,42,52,80,191,24,153,128,95,35,73,80,191,147,198,104,29,85,77,80,191,33,62,176,227,191,64,80,191,70,210,110,244,49,31,80,191].concat([3,6,73,159,86,209,79,63,160,251,114,102,187,66,79,63,116,207,186,70,203,129,78,63,119,220,240,187,233,150,77,63,176,199,68,74,179,121,76,63,33,145,182,241,39,42,75,63,192,147,22,46,171,176,73,63,160,25,196,7,118,252,71,63,183,125,143,250,235,21,70,63,5,192,120,6,13,253,67,63,148,133,175,175,117,169,65,63,162,8,169,219,217,87,62,63,176,86,237,154,144,214,56,63,63,171,204,148,214,223,50,63,84,228,16,113,115,42,41,63,162,38,250,124,148,17,23,63,201,199,238,2,37,5,246,190,65,184,2,10,245,244,33,191,67,197,56,127,19,10,49,191,10,188,147,79,143,109,57,191,49,123,217,118,218,26,65,191,38,58,203,44,66,177,69,191,236,191,206,77,155,113,74,191,132,12,228,217,229,91,79,191,124,98,157,42,223,51,82,191,31,162,209,29,196,206,84,191,51,106,190,74,62,118,87,191,54,232,75,111,127,46,90,191,170,238,145,205,85,243,92,191,154,34,192,233,93,188,95,191,126,111,211,159,253,72,97,191,175,205,198,74,204,179,98,191,158,66,174,212,179,32,100,191,141,183,149,94,155,141,101,191,0,255,148,42,81,246,102,191,182,47,160,23,238,92,104,191,50,28,207,103,64,189,105,191,118,196,33,27,72,23,107,191,5,251,175,115,211,102,108,191,157,214,109,80,251,173,109,191,6,19,127,20,117,230,110,191,31,216,241,95,32,8,112,191,35,215,77,41,175,149,112,191,210,111,95,7,206,25,113,191,204,150,172,138,112,147,113,191,179,64,187,67,138,1,114,191,135,109,139,50,27,100,114,191,43,251,174,8,254,183,114,191,92,0,26,165,75,255,114,191,255,90,94,185,222,54,115,191,181,255,1,214,170,93,115,191,124,238,4,251,175,115,115,191,153,16,115,73,213,118,115,191,10,102,76,193,26,103,115,191,113,227,22,243,115,67,115,191,112,125,88,111,212,10,115,191,166,40,151,198,47,188,114,191,182,217,88,137,121,86,114,191,159,144,157,183,177,217,113,191,164,54,113,114,191,67,113,191,35,215,77,41,175,149,112,191,125,205,114,217,232,156,111,191,111,157,127,187,236,215,109,191,219,52,182,215,130,222,107,191,3,125,34,79,146,174,105,63,41,95,208,66,2,70,103,63,200,8,168,112,4,169,100,63,168,53,205,59,78,209,97,63,14,249,103,6,241,129,93,63,199,186,184,141,6,240,86,63,3,6,73,159,86,209,79,63,104,89,247,143,133,232,64,63,250,156,187,93,47,77,1,63,179,69,210,110,244,49,63,191,197,203,211,185,162,148,80,191,165,164,135,161,213,201,89,191,6,14,104,233,10,182,97,191,131,107,238,232,127,185,102,191,134,1,75,174,98,241,107,191,169,220,68,45,205,173,112,191,20,62,91,7,7,123,115,191,166,153,238,117,82,95,118,191,0,228,132,9,163,89,121,191,33,29,30,194,248,105,124,191,238,34,76,81,46,141,127,191,179,122,135,219,161,97,129,191,149,68,246,65,150,5,131,191,191,99,120,236,103,177,132,191,209,204,147,107,10,100,134,191,204,127,72,191,125,29,136,191,80,113,28,120,181,220,137,191,79,144,216,238,30,160,139,191,122,226,57,91,64,104,141,191,17,81,76,222,0,51,143,191,51,107,41,32,237,127,144,191,141,179,233,8,224,102,145,191,191,126,136,13,22,78,146,191,25,199,72,246,8,53,147,191,20,4,143,111,239,26,148,191,177,53,91,121,201,255,148,191,143,80,51,164,138,226,149,191,176,84,23,240,50,195,150,191,181,54,141,237,181,160,151,191,157,246,148,156,19,123,152,191,225,11,147,169,130,81,153,191,170,243,168,248,191,35,154,191,72,168,25,82,69,241,154,191,52,161,73,98,73,185,155,191,150,91,90,13,137,123,156,191,151,84,109,55,193,55,157,191,176,3,231,140,40,237,157,191,8,230,232,241,123,155,158,191,200,120,148,74,120,66,159,191,106,51,78,67,84,225,159,191,138,201,27,96,230,59,160,191,120,10,185,82,207,130,160,191,19,155,143,107,67,197,160,191,131,248,192,142,255,2,161,191,93,225,93,46,226,59,161,191,52,20,119,188,201,111,161,191,156,79,29,171,148,158,161,191,42,82,97,108,33,200,161,191,223,27,67,0,112,236,161,191,225,41,228,74,61,11,162,191,49,124,68,76,137,36,162,191,207,18,100,4,84,56,162,191,79,172,83,229,123,70,162,191,178,72,19,239,0,79,162,191,247,231,162,33,227,81,162,63,178,72,19,239,0,79,162,63,79,172,83,229,123,70,162,63,207,18,100,4,84,56,162,63,49,124,68,76,137,36,162,63,225,41,228,74,61,11,162,63,223,27,67,0,112,236,161,63,42,82,97,108,33,200,161,63,156,79,29,171,148,158,161,63,52,20,119,188,201,111,161,63,93,225,93,46,226,59,161,63,131,248,192,142,255,2,161,63,19,155,143,107,67,197,160,63,120,10,185,82,207,130,160,63,138,201,27,96,230,59,160,63,106,51,78,67,84,225,159,63,200,120,148,74,120,66,159,63,8,230,232,241,123,155,158,63,176,3,231,140,40,237,157,63,151,84,109,55,193,55,157,63,150,91,90,13,137,123,156,63,52,161,73,98,73,185,155,63,72,168,25,82,69,241,154,63,170,243,168,248,191,35,154,63,225,11,147,169,130,81,153,63,157,246,148,156,19,123,152,63,181,54,141,237,181,160,151,63,176,84,23,240,50,195,150,63,143,80,51,164,138,226,149,63,177,53,91,121,201,255,148,63,20,4,143,111,239,26,148,63,25,199,72,246,8,53,147,63,191,126,136,13,22,78,146,63,141,179,233,8,224,102,145,63,51,107,41,32,237,127,144,63,17,81,76,222,0,51,143,63,122,226,57,91,64,104,141,63,79,144,216,238,30,160,139,63,80,113,28,120,181,220,137,63,204,127,72,191,125,29,136,63,209,204,147,107,10,100,134,63,191,99,120,236,103,177,132,63,149,68,246,65,150,5,131,63,179,122,135,219,161,97,129,63,238,34,76,81,46,141,127,63,33,29,30,194,248,105,124,63,0,228,132,9,163,89,121,63,166,153,238,117,82,95,118,63,20,62,91,7,7,123,115,63,169,220,68,45,205,173,112,63,134,1,75,174,98,241,107,63,131,107,238,232,127,185,102,63,6,14,104,233,10,182,97,63,165,164,135,161,213,201,89,63,197,203,211,185,162,148,80,63,179,69,210,110,244,49,63,63,250,156,187,93,47,77,1,191,104,89,247,143,133,232,64,191,3,6,73,159,86,209,79,191,199,186,184,141,6,240,86,191,14,249,103,6,241,129,93,191,168,53,205,59,78,209,97,191,200,8,168,112,4,169,100,191,41,95,208,66,2,70,103,191,3,125,34,79,146,174,105,63,219,52,182,215,130,222,107,63,111,157,127,187,236,215,109,63,125,205,114,217,232,156,111,63,35,215,77,41,175,149,112,63,164,54,113,114,191,67,113,63,159,144,157,183,177,217,113,63,182,217,88,137,121,86,114,63,166,40,151,198,47,188,114,63,112,125,88,111,212,10,115,63,113,227,22,243,115,67,115,63,10,102,76,193,26,103,115,63,153,16,115,73,213,118,115,63,124,238,4,251,175,115,115,63,181,255,1,214,170,93,115,63,255,90,94,185,222,54,115,63,92,0,26,165,75,255,114,63,43,251,174,8,254,183,114,63,135,109,139,50,27,100,114,63,179,64,187,67,138,1,114,63,204,150,172,138,112,147,113,63,210,111,95,7,206,25,113,63,35,215,77,41,175,149,112,63,31,216,241,95,32,8,112,63,6,19,127,20,117,230,110,63,157,214,109,80,251,173,109,63,5,251,175,115,211,102,108,63,118,196,33,27,72,23,107,63,50,28,207,103,64,189,105,63,182,47,160,23,238,92,104,63,0,255,148,42,81,246,102,63,141,183,149,94,155,141,101,63,158,66,174,212,179,32,100,63,175,205,198,74,204,179,98,63,126,111,211,159,253,72,97,63,154,34,192,233,93,188,95,63,170,238,145,205,85,243,92,63,54,232,75,111,127,46,90,63,51,106,190,74,62,118,87,63,31,162,209,29,196,206,84,63,124,98,157,42,223,51,82,63,132,12,228,217,229,91,79,63,236,191,206,77,155,113,74,63,38,58,203,44,66,177,69,63,49,123,217,118,218,26,65,63,10,188,147,79,143,109,57,63,67,197,56,127,19,10,49,63,65,184,2,10,245,244,33,63,201,199,238,2,37,5,246,62,162,38,250,124,148,17,23,191,84,228,16,113,115,42,41,191,63,171,204,148,214,223,50,191,176,86,237,154,144,214,56,191,162,8,169,219,217,87,62,191,148,133,175,175,117,169,65,191,5,192,120,6,13,253,67,191,183,125,143,250,235,21,70,191,160,25,196,7,118,252,71,191,192,147,22,46,171,176,73,191,33,145,182,241,39,42,75,191,176,199,68,74,179,121,76,191,119,220,240,187,233,150,77,191,116,207,186,70,203,129,78,191,160,251,114,102,187,66,79,191,3,6,73,159,86,209,79,63,70,210,110,244,49,31,80,63,33,62,176,227,191,64,80,63,147,198,104,29,85,77,80,63,24,153,128,95,35,73,80,63,175,181,247,169,42,52,80,63,212,73,182,186,156,18,80,63,22,80,168,167,143,192,79,63,160,251,114,102,187,66,79,63,70,150,204,177,188,171,78,63,8,32,181,137,147,251,77,63,220,243,252,105,163,58,77,63,204,182,211,214,136,96,76,63,197,30,218,199,10,126,75,63,208,208,63,193,197,138,74,63,238,204,4,195,185,134,73,63,22,110,249,72,74,122,72,63,70,180,29,83,119,101,71,63,118,250,65,93,164,80,70,63,176,229,149,235,109,51,69,63,243,117,25,254,211,13,68,63,54,6,157,16,58,232,66,63,120,150,32,35,160,194,65,63,187,38,164,53,6,157,64,63,234,35,240,135,159,255,62,63,112,68,247,172,107,180,60,63,227,26,159,201,254,121,58,63,68,167,231,221,88,80,56,63,146,233,208,233,121,55,54,63,206,225,90,237,97,47,52,63,10,218,228,240,73,39,50,63,51,136,15,236,248,47,48,63,112,68,247,172,107,180,44,63,121,120,207,129,229,8,41,63,56,132,42,53,123,160,37,63,210,251,198,215,158,89,34,63,144,190,73,211,160,104,30,63,231,52,11,180,59,164,24,63,245,130,79,115,242,34,19,63,114,81,45,34,138,201,11,63,102,76,193,26,103,211,1,63,102,76,193,26,103,211,241,62,141,237,181,160,247,198,176,62,183,95,62,89,49,92,237,190,222,0,51,223,193,79,252,190,241,104,227,136,181,248,4,191,153,242,33,168,26,189,10,191,213,204,90,10,72,251,15,191,210,251,198,215,158,89,18,191,132,185,221,203,125,114,20,191,201,199,238,2,37,5,22,191,15,214,255,57,204,151,23,191,158,12,142,146,87,231,24,191,118,107,153,12,199,243,25,191,79,202,164,134,54,0,27,191,188,121,170,67,110,134,27,191,40,41,176,0,166,12,28,191,222,0,51,223,193,79,28,191,149,216,181,189,221,146,28,191,149,216,181,189,221,146,28,191,222,0,51,223,193,79,28,191,40,41,176,0,166,12,28,191,114,81,45,34,138,201,27,191,5,162,39,101,82,67,27,191,153,242,33,168,26,189,26,63,118,107,153,12,199,243,25,63,84,228,16,113,115,42,25,63,49,93,136,213,31,97,24,63,197,173,130,24,232,218,23,63,236,78,119,158,120,206,22,63,201,199,238,2,37,5,22,63,167,64,102,103,209,59,21,63,206,225,90,237,97,47,20,63,245,130,79,115,242,34,19,63,210,251,198,215,158,89,18,63,250,156,187,93,47,77,17,63,215,21,51,194,219,131,16,63,105,29,85,77,16,117,15,63,183,95,62,89,49,92,13,63,114,81,45,34,138,201,11,63,45,67,28,235,226,54,10,63,123,133,5,247,3,30,8,63,54,119,244,191,92,139,6,63,93,24,233,69,237,126,5,63,24,10,216,14,70,236,3,63,210,251,198,215,158,89,2,63,141,237,181,160,247,198,0,63,105,29,85,77,16,117,255,62,183,95,62,89,49,92,253,62,45,67,28,235,226,54,250,62,123,133,5,247,3,30,248,62,201,199,238,2,37,5,246,62,241,104,227,136,181,248,244,62,63,171,204,148,214,223,242,62,102,76,193,26,103,211,241,62,105,29,85,77,16,117,239,62,183,95,62,89,49,92,237,62,84,228,16,113,115,42,233,62,162,38,250,124,148,17,231,62,241,104,227,136,181,248,228,62,63,171,204,148,214,223,226,62,141,237,181,160,247,198,224,62,141,237,181,160,247,198,224,62,183,95,62,89,49,92,221,62,84,228,16,113,115,42,217,62,241,104,227,136,181,248,212,62,241,104,227,136,181,248,212,62,141,237,181,160,247,198,208,62,141,237,181,160,247,198,208,62,84,228,16,113,115,42,201,62,84,228,16,113,115,42,201,62,84,228,16,113,115,42,201,62,141,237,181,160,247,198,192,62,141,237,181,160,247,198,192,62,141,237,181,160,247,198,192,62,141,237,181,160,247,198,192,62,141,237,181,160,247,198,176,62,141,237,181,160,247,198,176,62,141,237,181,160,247,198,176,62,141,237,181,160,247,198,176,62,141,237,181,160,247,198,176,62,141,237,181,160,247,198,176,62,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,68,172,0,0,128,187,0,0,0,125,0,0,34,86,0,0,192,93,0,0,128,62,0,0,17,43,0,0,224,46,0,0,64,31,0,0,0,0,0,0,1,0,0,0,255,255,255,255,1,0,0,0,2,0,0,0,0,0,0,0,6,0,0,0,11,0,0,0,16,0,0,0,21,0,0,0,0,0,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,8,0,0,0,255,255,255,255,8,0,0,0,32,0,0,0,16,0,0,0,255,255,255,255,16,0,0,0,40,0,0,0,24,0,0,0,255,255,255,255,24,0,0,0,48,0,0,0,32,0,0,0,255,255,255,255,32,0,0,0,56,0,0,0,40,0,0,0,255,255,255,255,40,0,0,0,64,0,0,0,48,0,0,0,255,255,255,255,48,0,0,0,80,0,0,0,56,0,0,0,255,255,255,255,56,0,0,0,96,0,0,0,64,0,0,0,255,255,255,255,64,0,0,0,112,0,0,0,80,0,0,0,255,255,255,255,80,0,0,0,128,0,0,0,96,0,0,0,255,255,255,255,96,0,0,0,160,0,0,0,112,0,0,0,255,255,255,255,112,0,0,0,192,0,0,0,128,0,0,0,255,255,255,255,128,0,0,0,224,0,0,0,144,0,0,0,255,255,255,255,144,0,0,0,0,1,0,0,160,0,0,0,255,255,255,255,160,0,0,0,64,1,0,0,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255,255])
, "i8", ALLOC_NONE, Runtime.GLOBAL_BASE)
var tempDoublePtr = Runtime.alignMemory(allocate(12, "i8", ALLOC_STATIC), 8);
assert(tempDoublePtr % 8 == 0);
function copyTempFloat(ptr) { // functions, because inlining this code increases code size too much
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
}
function copyTempDouble(ptr) {
  HEAP8[tempDoublePtr] = HEAP8[ptr];
  HEAP8[tempDoublePtr+1] = HEAP8[ptr+1];
  HEAP8[tempDoublePtr+2] = HEAP8[ptr+2];
  HEAP8[tempDoublePtr+3] = HEAP8[ptr+3];
  HEAP8[tempDoublePtr+4] = HEAP8[ptr+4];
  HEAP8[tempDoublePtr+5] = HEAP8[ptr+5];
  HEAP8[tempDoublePtr+6] = HEAP8[ptr+6];
  HEAP8[tempDoublePtr+7] = HEAP8[ptr+7];
}
  Module["_memcpy"] = _memcpy;var _llvm_memcpy_p0i8_p0i8_i32=_memcpy;
  function _llvm_lifetime_start() {}
  function _llvm_lifetime_end() {}
  Module["_memset"] = _memset;var _llvm_memset_p0i8_i32=_memset;
  var _sqrt=Math.sqrt;
  var _log=Math.log;
  var _llvm_memset_p0i8_i64=_memset;
  function _exp2(x) {
      return Math.pow(2, x);
    }
  var _sin=Math.sin;
  var _cos=Math.cos;
  function _modf(x, intpart) {
      HEAPF64[((intpart)>>3)]=Math.floor(x)
      return x - HEAPF64[((intpart)>>3)];
    }
  function _abort() {
      Module['abort']();
    }
  var ___errno_state=0;function ___setErrNo(value) {
      // For convenient setting and returning of errno.
      HEAP32[((___errno_state)>>2)]=value
      return value;
    }function ___errno_location() {
      return ___errno_state;
    }var ___errno=___errno_location;
  var ERRNO_CODES={EPERM:1,ENOENT:2,ESRCH:3,EINTR:4,EIO:5,ENXIO:6,E2BIG:7,ENOEXEC:8,EBADF:9,ECHILD:10,EAGAIN:11,EWOULDBLOCK:11,ENOMEM:12,EACCES:13,EFAULT:14,ENOTBLK:15,EBUSY:16,EEXIST:17,EXDEV:18,ENODEV:19,ENOTDIR:20,EISDIR:21,EINVAL:22,ENFILE:23,EMFILE:24,ENOTTY:25,ETXTBSY:26,EFBIG:27,ENOSPC:28,ESPIPE:29,EROFS:30,EMLINK:31,EPIPE:32,EDOM:33,ERANGE:34,ENOMSG:35,EIDRM:36,ECHRNG:37,EL2NSYNC:38,EL3HLT:39,EL3RST:40,ELNRNG:41,EUNATCH:42,ENOCSI:43,EL2HLT:44,EDEADLK:45,ENOLCK:46,EBADE:50,EBADR:51,EXFULL:52,ENOANO:53,EBADRQC:54,EBADSLT:55,EDEADLOCK:56,EBFONT:57,ENOSTR:60,ENODATA:61,ETIME:62,ENOSR:63,ENONET:64,ENOPKG:65,EREMOTE:66,ENOLINK:67,EADV:68,ESRMNT:69,ECOMM:70,EPROTO:71,EMULTIHOP:74,ELBIN:75,EDOTDOT:76,EBADMSG:77,EFTYPE:79,ENOTUNIQ:80,EBADFD:81,EREMCHG:82,ELIBACC:83,ELIBBAD:84,ELIBSCN:85,ELIBMAX:86,ELIBEXEC:87,ENOSYS:88,ENMFILE:89,ENOTEMPTY:90,ENAMETOOLONG:91,ELOOP:92,EOPNOTSUPP:95,EPFNOSUPPORT:96,ECONNRESET:104,ENOBUFS:105,EAFNOSUPPORT:106,EPROTOTYPE:107,ENOTSOCK:108,ENOPROTOOPT:109,ESHUTDOWN:110,ECONNREFUSED:111,EADDRINUSE:112,ECONNABORTED:113,ENETUNREACH:114,ENETDOWN:115,ETIMEDOUT:116,EHOSTDOWN:117,EHOSTUNREACH:118,EINPROGRESS:119,EALREADY:120,EDESTADDRREQ:121,EMSGSIZE:122,EPROTONOSUPPORT:123,ESOCKTNOSUPPORT:124,EADDRNOTAVAIL:125,ENETRESET:126,EISCONN:127,ENOTCONN:128,ETOOMANYREFS:129,EPROCLIM:130,EUSERS:131,EDQUOT:132,ESTALE:133,ENOTSUP:134,ENOMEDIUM:135,ENOSHARE:136,ECASECLASH:137,EILSEQ:138,EOVERFLOW:139,ECANCELED:140,ENOTRECOVERABLE:141,EOWNERDEAD:142,ESTRPIPE:143};function _sysconf(name) {
      // long sysconf(int name);
      // http://pubs.opengroup.org/onlinepubs/009695399/functions/sysconf.html
      switch(name) {
        case 8: return PAGE_SIZE;
        case 54:
        case 56:
        case 21:
        case 61:
        case 63:
        case 22:
        case 67:
        case 23:
        case 24:
        case 25:
        case 26:
        case 27:
        case 69:
        case 28:
        case 101:
        case 70:
        case 71:
        case 29:
        case 30:
        case 199:
        case 75:
        case 76:
        case 32:
        case 43:
        case 44:
        case 80:
        case 46:
        case 47:
        case 45:
        case 48:
        case 49:
        case 42:
        case 82:
        case 33:
        case 7:
        case 108:
        case 109:
        case 107:
        case 112:
        case 119:
        case 121:
          return 200809;
        case 13:
        case 104:
        case 94:
        case 95:
        case 34:
        case 35:
        case 77:
        case 81:
        case 83:
        case 84:
        case 85:
        case 86:
        case 87:
        case 88:
        case 89:
        case 90:
        case 91:
        case 94:
        case 95:
        case 110:
        case 111:
        case 113:
        case 114:
        case 115:
        case 116:
        case 117:
        case 118:
        case 120:
        case 40:
        case 16:
        case 79:
        case 19:
          return -1;
        case 92:
        case 93:
        case 5:
        case 72:
        case 6:
        case 74:
        case 92:
        case 93:
        case 96:
        case 97:
        case 98:
        case 99:
        case 102:
        case 103:
        case 105:
          return 1;
        case 38:
        case 66:
        case 50:
        case 51:
        case 4:
          return 1024;
        case 15:
        case 64:
        case 41:
          return 32;
        case 55:
        case 37:
        case 17:
          return 2147483647;
        case 18:
        case 1:
          return 47839;
        case 59:
        case 57:
          return 99;
        case 68:
        case 58:
          return 2048;
        case 0: return 2097152;
        case 3: return 65536;
        case 14: return 32768;
        case 73: return 32767;
        case 39: return 16384;
        case 60: return 1000;
        case 106: return 700;
        case 52: return 256;
        case 62: return 255;
        case 2: return 100;
        case 65: return 64;
        case 36: return 20;
        case 100: return 16;
        case 20: return 6;
        case 53: return 4;
        case 10: return 1;
      }
      ___setErrNo(ERRNO_CODES.EINVAL);
      return -1;
    }
  function _time(ptr) {
      var ret = Math.floor(Date.now()/1000);
      if (ptr) {
        HEAP32[((ptr)>>2)]=ret
      }
      return ret;
    }
  function _sbrk(bytes) {
      // Implement a Linux-like 'memory area' for our 'process'.
      // Changes the size of the memory area by |bytes|; returns the
      // address of the previous top ('break') of the memory area
      // We control the "dynamic" memory - DYNAMIC_BASE to DYNAMICTOP
      var self = _sbrk;
      if (!self.called) {
        DYNAMICTOP = alignMemoryPage(DYNAMICTOP); // make sure we start out aligned
        self.called = true;
        assert(Runtime.dynamicAlloc);
        self.alloc = Runtime.dynamicAlloc;
        Runtime.dynamicAlloc = function() { abort('cannot dynamically allocate, sbrk now has control') };
      }
      var ret = DYNAMICTOP;
      if (bytes != 0) self.alloc(bytes);
      return ret;  // Previous break location.
    }
  Module["_strlen"] = _strlen;
  var Browser={mainLoop:{scheduler:null,shouldPause:false,paused:false,queue:[],pause:function () {
          Browser.mainLoop.shouldPause = true;
        },resume:function () {
          if (Browser.mainLoop.paused) {
            Browser.mainLoop.paused = false;
            Browser.mainLoop.scheduler();
          }
          Browser.mainLoop.shouldPause = false;
        },updateStatus:function () {
          if (Module['setStatus']) {
            var message = Module['statusMessage'] || 'Please wait...';
            var remaining = Browser.mainLoop.remainingBlockers;
            var expected = Browser.mainLoop.expectedBlockers;
            if (remaining) {
              if (remaining < expected) {
                Module['setStatus'](message + ' (' + (expected - remaining) + '/' + expected + ')');
              } else {
                Module['setStatus'](message);
              }
            } else {
              Module['setStatus']('');
            }
          }
        }},isFullScreen:false,pointerLock:false,moduleContextCreatedCallbacks:[],workers:[],init:function () {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = []; // needs to exist even in workers
        if (Browser.initted || ENVIRONMENT_IS_WORKER) return;
        Browser.initted = true;
        try {
          new Blob();
          Browser.hasBlobConstructor = true;
        } catch(e) {
          Browser.hasBlobConstructor = false;
          console.log("warning: no blob constructor, cannot create blobs with mimetypes");
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder : (typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder : (!Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null));
        Browser.URLObject = typeof window != "undefined" ? (window.URL ? window.URL : window.webkitURL) : console.log("warning: cannot create object URLs");
        // Support for plugins that can process preloaded files. You can add more of these to
        // your app by creating and appending to Module.preloadPlugins.
        //
        // Each plugin is asked if it can handle a file based on the file's name. If it can,
        // it is given the file's raw data. When it is done, it calls a callback with the file's
        // (possibly modified) data. For example, a plugin might decompress a file, or it
        // might create some side data structure for use later (like an Image element, etc.).
        var imagePlugin = {};
        imagePlugin['canHandle'] = function(name) {
          return !Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name);
        };
        imagePlugin['handle'] = function(byteArray, name, onload, onerror) {
          var b = null;
          if (Browser.hasBlobConstructor) {
            try {
              b = new Blob([byteArray], { type: Browser.getMimetype(name) });
              if (b.size !== byteArray.length) { // Safari bug #118630
                // Safari's Blob can only take an ArrayBuffer
                b = new Blob([(new Uint8Array(byteArray)).buffer], { type: Browser.getMimetype(name) });
              }
            } catch(e) {
              Runtime.warnOnce('Blob constructor present but fails: ' + e + '; falling back to blob builder');
            }
          }
          if (!b) {
            var bb = new Browser.BlobBuilder();
            bb.append((new Uint8Array(byteArray)).buffer); // we need to pass a buffer, and must copy the array to get the right data range
            b = bb.getBlob();
          }
          var url = Browser.URLObject.createObjectURL(b);
          var img = new Image();
          img.onload = function() {
            assert(img.complete, 'Image ' + name + ' could not be decoded');
            var canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            var ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);
            Module["preloadedImages"][name] = canvas;
            Browser.URLObject.revokeObjectURL(url);
            if (onload) onload(byteArray);
          };
          img.onerror = function(event) {
            console.log('Image ' + url + ' could not be decoded');
            if (onerror) onerror();
          };
          img.src = url;
        };
        Module['preloadPlugins'].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin['canHandle'] = function(name) {
          return !Module.noAudioDecoding && name.substr(-4) in { '.ogg': 1, '.wav': 1, '.mp3': 1 };
        };
        audioPlugin['handle'] = function(byteArray, name, onload, onerror) {
          var done = false;
          function finish(audio) {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = audio;
            if (onload) onload(byteArray);
          }
          function fail() {
            if (done) return;
            done = true;
            Module["preloadedAudios"][name] = new Audio(); // empty shim
            if (onerror) onerror();
          }
          if (Browser.hasBlobConstructor) {
            try {
              var b = new Blob([byteArray], { type: Browser.getMimetype(name) });
            } catch(e) {
              return fail();
            }
            var url = Browser.URLObject.createObjectURL(b); // XXX we never revoke this!
            var audio = new Audio();
            audio.addEventListener('canplaythrough', function() { finish(audio) }, false); // use addEventListener due to chromium bug 124926
            audio.onerror = function(event) {
              if (done) return;
              console.log('warning: browser could not fully decode audio ' + name + ', trying slower base64 approach');
              function encode64(data) {
                var BASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
                var PAD = '=';
                var ret = '';
                var leftchar = 0;
                var leftbits = 0;
                for (var i = 0; i < data.length; i++) {
                  leftchar = (leftchar << 8) | data[i];
                  leftbits += 8;
                  while (leftbits >= 6) {
                    var curr = (leftchar >> (leftbits-6)) & 0x3f;
                    leftbits -= 6;
                    ret += BASE[curr];
                  }
                }
                if (leftbits == 2) {
                  ret += BASE[(leftchar&3) << 4];
                  ret += PAD + PAD;
                } else if (leftbits == 4) {
                  ret += BASE[(leftchar&0xf) << 2];
                  ret += PAD;
                }
                return ret;
              }
              audio.src = 'data:audio/x-' + name.substr(-3) + ';base64,' + encode64(byteArray);
              finish(audio); // we don't wait for confirmation this worked - but it's worth trying
            };
            audio.src = url;
            // workaround for chrome bug 124926 - we do not always get oncanplaythrough or onerror
            Browser.safeSetTimeout(function() {
              finish(audio); // try to use it even though it is not necessarily ready to play
            }, 10000);
          } else {
            return fail();
          }
        };
        Module['preloadPlugins'].push(audioPlugin);
        // Canvas event setup
        var canvas = Module['canvas'];
        canvas.requestPointerLock = canvas['requestPointerLock'] ||
                                    canvas['mozRequestPointerLock'] ||
                                    canvas['webkitRequestPointerLock'];
        canvas.exitPointerLock = document['exitPointerLock'] ||
                                 document['mozExitPointerLock'] ||
                                 document['webkitExitPointerLock'] ||
                                 function(){}; // no-op if function does not exist
        canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
        function pointerLockChange() {
          Browser.pointerLock = document['pointerLockElement'] === canvas ||
                                document['mozPointerLockElement'] === canvas ||
                                document['webkitPointerLockElement'] === canvas;
        }
        document.addEventListener('pointerlockchange', pointerLockChange, false);
        document.addEventListener('mozpointerlockchange', pointerLockChange, false);
        document.addEventListener('webkitpointerlockchange', pointerLockChange, false);
        if (Module['elementPointerLock']) {
          canvas.addEventListener("click", function(ev) {
            if (!Browser.pointerLock && canvas.requestPointerLock) {
              canvas.requestPointerLock();
              ev.preventDefault();
            }
          }, false);
        }
      },createContext:function (canvas, useWebGL, setInModule) {
        var ctx;
        try {
          if (useWebGL) {
            ctx = canvas.getContext('experimental-webgl', {
              alpha: false
            });
          } else {
            ctx = canvas.getContext('2d');
          }
          if (!ctx) throw ':(';
        } catch (e) {
          Module.print('Could not create canvas - ' + e);
          return null;
        }
        if (useWebGL) {
          // Set the background of the WebGL canvas to black
          canvas.style.backgroundColor = "black";
          // Warn on context loss
          canvas.addEventListener('webglcontextlost', function(event) {
            alert('WebGL context lost. You will need to reload the page.');
          }, false);
        }
        if (setInModule) {
          Module.ctx = ctx;
          Module.useWebGL = useWebGL;
          Browser.moduleContextCreatedCallbacks.forEach(function(callback) { callback() });
          Browser.init();
        }
        return ctx;
      },destroyContext:function (canvas, useWebGL, setInModule) {},fullScreenHandlersInstalled:false,lockPointer:undefined,resizeCanvas:undefined,requestFullScreen:function (lockPointer, resizeCanvas) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        if (typeof Browser.lockPointer === 'undefined') Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === 'undefined') Browser.resizeCanvas = false;
        var canvas = Module['canvas'];
        function fullScreenChange() {
          Browser.isFullScreen = false;
          if ((document['webkitFullScreenElement'] || document['webkitFullscreenElement'] ||
               document['mozFullScreenElement'] || document['mozFullscreenElement'] ||
               document['fullScreenElement'] || document['fullscreenElement']) === canvas) {
            canvas.cancelFullScreen = document['cancelFullScreen'] ||
                                      document['mozCancelFullScreen'] ||
                                      document['webkitCancelFullScreen'];
            canvas.cancelFullScreen = canvas.cancelFullScreen.bind(document);
            if (Browser.lockPointer) canvas.requestPointerLock();
            Browser.isFullScreen = true;
            if (Browser.resizeCanvas) Browser.setFullScreenCanvasSize();
          } else if (Browser.resizeCanvas){
            Browser.setWindowedCanvasSize();
          }
          if (Module['onFullScreen']) Module['onFullScreen'](Browser.isFullScreen);
        }
        if (!Browser.fullScreenHandlersInstalled) {
          Browser.fullScreenHandlersInstalled = true;
          document.addEventListener('fullscreenchange', fullScreenChange, false);
          document.addEventListener('mozfullscreenchange', fullScreenChange, false);
          document.addEventListener('webkitfullscreenchange', fullScreenChange, false);
        }
        canvas.requestFullScreen = canvas['requestFullScreen'] ||
                                   canvas['mozRequestFullScreen'] ||
                                   (canvas['webkitRequestFullScreen'] ? function() { canvas['webkitRequestFullScreen'](Element['ALLOW_KEYBOARD_INPUT']) } : null);
        canvas.requestFullScreen();
      },requestAnimationFrame:function (func) {
        if (!window.requestAnimationFrame) {
          window.requestAnimationFrame = window['requestAnimationFrame'] ||
                                         window['mozRequestAnimationFrame'] ||
                                         window['webkitRequestAnimationFrame'] ||
                                         window['msRequestAnimationFrame'] ||
                                         window['oRequestAnimationFrame'] ||
                                         window['setTimeout'];
        }
        window.requestAnimationFrame(func);
      },safeCallback:function (func) {
        return function() {
          if (!ABORT) return func.apply(null, arguments);
        };
      },safeRequestAnimationFrame:function (func) {
        return Browser.requestAnimationFrame(function() {
          if (!ABORT) func();
        });
      },safeSetTimeout:function (func, timeout) {
        return setTimeout(function() {
          if (!ABORT) func();
        }, timeout);
      },safeSetInterval:function (func, timeout) {
        return setInterval(function() {
          if (!ABORT) func();
        }, timeout);
      },getMimetype:function (name) {
        return {
          'jpg': 'image/jpeg',
          'jpeg': 'image/jpeg',
          'png': 'image/png',
          'bmp': 'image/bmp',
          'ogg': 'audio/ogg',
          'wav': 'audio/wav',
          'mp3': 'audio/mpeg'
        }[name.substr(name.lastIndexOf('.')+1)];
      },getUserMedia:function (func) {
        if(!window.getUserMedia) {
          window.getUserMedia = navigator['getUserMedia'] ||
                                navigator['mozGetUserMedia'];
        }
        window.getUserMedia(func);
      },getMovementX:function (event) {
        return event['movementX'] ||
               event['mozMovementX'] ||
               event['webkitMovementX'] ||
               0;
      },getMovementY:function (event) {
        return event['movementY'] ||
               event['mozMovementY'] ||
               event['webkitMovementY'] ||
               0;
      },mouseX:0,mouseY:0,mouseMovementX:0,mouseMovementY:0,calculateMouseEvent:function (event) { // event should be mousemove, mousedown or mouseup
        if (Browser.pointerLock) {
          // When the pointer is locked, calculate the coordinates
          // based on the movement of the mouse.
          // Workaround for Firefox bug 764498
          if (event.type != 'mousemove' &&
              ('mozMovementX' in event)) {
            Browser.mouseMovementX = Browser.mouseMovementY = 0;
          } else {
            Browser.mouseMovementX = Browser.getMovementX(event);
            Browser.mouseMovementY = Browser.getMovementY(event);
          }
          // check if SDL is available
          if (typeof SDL != "undefined") {
          	Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
          	Browser.mouseY = SDL.mouseY + Browser.mouseMovementY;
          } else {
          	// just add the mouse delta to the current absolut mouse position
          	// FIXME: ideally this should be clamped against the canvas size and zero
          	Browser.mouseX += Browser.mouseMovementX;
          	Browser.mouseY += Browser.mouseMovementY;
          }        
        } else {
          // Otherwise, calculate the movement based on the changes
          // in the coordinates.
          var rect = Module["canvas"].getBoundingClientRect();
          var x = event.pageX - (window.scrollX + rect.left);
          var y = event.pageY - (window.scrollY + rect.top);
          // the canvas might be CSS-scaled compared to its backbuffer;
          // SDL-using content will want mouse coordinates in terms
          // of backbuffer units.
          var cw = Module["canvas"].width;
          var ch = Module["canvas"].height;
          x = x * (cw / rect.width);
          y = y * (ch / rect.height);
          Browser.mouseMovementX = x - Browser.mouseX;
          Browser.mouseMovementY = y - Browser.mouseY;
          Browser.mouseX = x;
          Browser.mouseY = y;
        }
      },xhrLoad:function (url, onload, onerror) {
        var xhr = new XMLHttpRequest();
        xhr.open('GET', url, true);
        xhr.responseType = 'arraybuffer';
        xhr.onload = function() {
          if (xhr.status == 200 || (xhr.status == 0 && xhr.response)) { // file URLs can return 0
            onload(xhr.response);
          } else {
            onerror();
          }
        };
        xhr.onerror = onerror;
        xhr.send(null);
      },asyncLoad:function (url, onload, onerror, noRunDep) {
        Browser.xhrLoad(url, function(arrayBuffer) {
          assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
          onload(new Uint8Array(arrayBuffer));
          if (!noRunDep) removeRunDependency('al ' + url);
        }, function(event) {
          if (onerror) {
            onerror();
          } else {
            throw 'Loading data file "' + url + '" failed.';
          }
        });
        if (!noRunDep) addRunDependency('al ' + url);
      },resizeListeners:[],updateResizeListeners:function () {
        var canvas = Module['canvas'];
        Browser.resizeListeners.forEach(function(listener) {
          listener(canvas.width, canvas.height);
        });
      },setCanvasSize:function (width, height, noUpdates) {
        var canvas = Module['canvas'];
        canvas.width = width;
        canvas.height = height;
        if (!noUpdates) Browser.updateResizeListeners();
      },windowedWidth:0,windowedHeight:0,setFullScreenCanvasSize:function () {
        var canvas = Module['canvas'];
        this.windowedWidth = canvas.width;
        this.windowedHeight = canvas.height;
        canvas.width = screen.width;
        canvas.height = screen.height;
        // check if SDL is available   
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags | 0x00800000; // set SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      },setWindowedCanvasSize:function () {
        var canvas = Module['canvas'];
        canvas.width = this.windowedWidth;
        canvas.height = this.windowedHeight;
        // check if SDL is available       
        if (typeof SDL != "undefined") {
        	var flags = HEAPU32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)];
        	flags = flags & ~0x00800000; // clear SDL_FULLSCREEN flag
        	HEAP32[((SDL.screen+Runtime.QUANTUM_SIZE*0)>>2)]=flags
        }
        Browser.updateResizeListeners();
      }};
___errno_state = Runtime.staticAlloc(4); HEAP32[((___errno_state)>>2)]=0;
Module["requestFullScreen"] = function(lockPointer, resizeCanvas) { Browser.requestFullScreen(lockPointer, resizeCanvas) };
  Module["requestAnimationFrame"] = function(func) { Browser.requestAnimationFrame(func) };
  Module["pauseMainLoop"] = function() { Browser.mainLoop.pause() };
  Module["resumeMainLoop"] = function() { Browser.mainLoop.resume() };
  Module["getUserMedia"] = function() { Browser.getUserMedia() }
STACK_BASE = STACKTOP = Runtime.alignMemory(STATICTOP);
staticSealed = true; // seal the static portion of memory
STACK_MAX = STACK_BASE + 5242880;
DYNAMIC_BASE = DYNAMICTOP = Runtime.alignMemory(STACK_MAX);
assert(DYNAMIC_BASE < TOTAL_MEMORY); // Stack must fit in TOTAL_MEMORY; allocations from here on may enlarge TOTAL_MEMORY
 var ctlz_i8 = allocate([8,7,6,6,5,5,5,5,4,4,4,4,4,4,4,4,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0], "i8", ALLOC_DYNAMIC);
 var cttz_i8 = allocate([8,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,7,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,6,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,5,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0,4,0,1,0,2,0,1,0,3,0,1,0,2,0,1,0], "i8", ALLOC_DYNAMIC);
var Math_min = Math.min;
function invoke_ii(index,a1) {
  try {
    return Module["dynCall_ii"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_v(index) {
  try {
    Module["dynCall_v"](index);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_iii(index,a1,a2) {
  try {
    return Module["dynCall_iii"](index,a1,a2);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function invoke_vi(index,a1) {
  try {
    Module["dynCall_vi"](index,a1);
  } catch(e) {
    if (typeof e !== 'number' && e !== 'longjmp') throw e;
    asm["setThrew"](1, 0);
  }
}
function asmPrintInt(x, y) {
  Module.print('int ' + x + ',' + y);// + ' ' + new Error().stack);
}
function asmPrintFloat(x, y) {
  Module.print('float ' + x + ',' + y);// + ' ' + new Error().stack);
}
// EMSCRIPTEN_START_ASM
var asm=(function(global,env,buffer){"use asm";var a=new global.Int8Array(buffer);var b=new global.Int16Array(buffer);var c=new global.Int32Array(buffer);var d=new global.Uint8Array(buffer);var e=new global.Uint16Array(buffer);var f=new global.Uint32Array(buffer);var g=new global.Float32Array(buffer);var h=new global.Float64Array(buffer);var i=env.STACKTOP|0;var j=env.STACK_MAX|0;var k=env.tempDoublePtr|0;var l=env.ABORT|0;var m=env.cttz_i8|0;var n=env.ctlz_i8|0;var o=+env.NaN;var p=+env.Infinity;var q=0;var r=0;var s=0;var t=0;var u=0,v=0,w=0,x=0,y=0.0,z=0,A=0,B=0,C=0.0;var D=0;var E=0;var F=0;var G=0;var H=0;var I=0;var J=0;var K=0;var L=0;var M=0;var N=global.Math.floor;var O=global.Math.abs;var P=global.Math.sqrt;var Q=global.Math.pow;var R=global.Math.cos;var S=global.Math.sin;var T=global.Math.tan;var U=global.Math.acos;var V=global.Math.asin;var W=global.Math.atan;var X=global.Math.atan2;var Y=global.Math.exp;var Z=global.Math.log;var _=global.Math.ceil;var $=global.Math.imul;var aa=env.abort;var ab=env.assert;var ac=env.asmPrintInt;var ad=env.asmPrintFloat;var ae=env.min;var af=env.invoke_ii;var ag=env.invoke_v;var ah=env.invoke_iii;var ai=env.invoke_vi;var aj=env._llvm_lifetime_end;var ak=env._cos;var al=env._log;var am=env._sysconf;var an=env.___setErrNo;var ao=env._exp2;var ap=env.___errno_location;var aq=env._sqrt;var ar=env._sin;var as=env._llvm_lifetime_start;var at=env._abort;var au=env._sbrk;var av=env._modf;var aw=env._time;
// EMSCRIPTEN_START_FUNCS
function aB(a){a=a|0;var b=0;b=i;i=i+a|0;i=i+7>>3<<3;return b|0}function aC(){return i|0}function aD(a){a=a|0;i=a}function aE(a,b){a=a|0;b=b|0;if((q|0)==0){q=a;r=b}}function aF(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0]}function aG(b){b=b|0;a[k]=a[b];a[k+1|0]=a[b+1|0];a[k+2|0]=a[b+2|0];a[k+3|0]=a[b+3|0];a[k+4|0]=a[b+4|0];a[k+5|0]=a[b+5|0];a[k+6|0]=a[b+6|0];a[k+7|0]=a[b+7|0]}function aH(a){a=a|0;D=a}function aI(a){a=a|0;E=a}function aJ(a){a=a|0;F=a}function aK(a){a=a|0;G=a}function aL(a){a=a|0;H=a}function aM(a){a=a|0;I=a}function aN(a){a=a|0;J=a}function aO(a){a=a|0;K=a}function aP(a){a=a|0;L=a}function aQ(a){a=a|0;M=a}function aR(){}function aS(a){a=a|0;var b=0,d=0,e=0,f=0;c[a+34512>>2]=0;c[a+34516>>2]=c[a+36>>2];c[a+34520>>2]=0;c[a+34524>>2]=0;b=a|0;if((c[b>>2]|0)<=0){return}d=a+16|0;e=0;do{c[a+34528+(e<<2)>>2]=0;if((c[d>>2]|0)>0){f=0;do{c[a+34536+(f<<3)+(e<<2)>>2]=0;f=f+1|0;}while((f|0)<(c[d>>2]|0))}e=e+1|0;}while((e|0)<(c[b>>2]|0));return}function aT(b,d){b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0;e=b+16|0;f=c[e>>2]|0;g=f-d|0;h=b+4|0;i=b+8|0;j=c[i>>2]|0;if(((c[h>>2]|0)-j|0)<(g|0)){k=b|0;c[k>>2]=bx(c[k>>2]|0,j+g|0)|0;k=c[i>>2]|0;c[h>>2]=k+g;l=c[e>>2]|0;m=k}else{l=f;m=j}if((l|0)>(d|0)){j=b+12|0;f=b|0;k=d;h=l;n=m;while(1){a[(c[f>>2]|0)+(h+~k+n)|0]=a[(c[j>>2]|0)+k|0]|0;o=k+1|0;p=c[e>>2]|0;q=c[i>>2]|0;if((o|0)<(p|0)){k=o;h=p;n=q}else{r=q;s=p;break}}}else{r=m;s=l}c[i>>2]=r+g;if((d|0)<=0){t=s;u=~d;v=t+u|0;w=b+24|0;c[w>>2]=v;x=b+28|0;c[x>>2]=8;return}g=b+12|0;r=0;i=s;while(1){s=c[g>>2]|0;a[s+(r-d+i)|0]=a[s+r|0]|0;s=r+1|0;l=c[e>>2]|0;if((s|0)<(d|0)){r=s;i=l}else{t=l;break}}u=~d;v=t+u|0;w=b+24|0;c[w>>2]=v;x=b+28|0;c[x>>2]=8;return}function aU(a,b){a=a|0;b=b|0;c[a>>2]=0;c[a+4>>2]=0;c[a+8>>2]=0;c[a+12>>2]=bu(b)|0;c[a+16>>2]=b;c[a+24>>2]=b-1;c[a+28>>2]=8;c[a+20>>2]=0;c[a+32>>2]=1;c[a+36>>2]=0;c[a+40>>2]=0;return}function aV(a){a=a|0;var b=0;b=c[a>>2]|0;if((b|0)!=0){bv(b)}bv(c[a+12>>2]|0);return}function aW(b,e,f){b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0;g=b+20|0;c[g>>2]=(c[g>>2]|0)+f;if((f|0)<=0){return}g=b+28|0;h=b+24|0;i=b+12|0;j=f;do{f=c[g>>2]|0;k=(j|0)<(f|0)?j:f;j=j-k|0;l=(c[i>>2]|0)+(c[h>>2]|0)|0;a[l]=((e>>>(j>>>0)&c[8368+(k<<2)>>2])<<f-k|(d[l]|0))&255;l=c[g>>2]|0;c[g>>2]=l-k;if((l|0)==(k|0)){c[g>>2]=8;k=(c[h>>2]|0)-1|0;c[h>>2]=k;if((k|0)<0){aT(b,4);m=c[h>>2]|0}else{m=k}a[(c[i>>2]|0)+m|0]=0}}while((j|0)>0);return}function aX(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0;b=c[a+34520>>2]|0;d=b+4|0;bv(c[(c[d>>2]|0)+4>>2]|0);bv(c[d>>2]|0);bv(b);b=c[a+34524>>2]|0;d=b+4|0;bv(c[(c[d>>2]|0)+4>>2]|0);bv(c[d>>2]|0);bv(b);b=a|0;if((c[b>>2]|0)<=0){return}d=a+16|0;e=0;do{f=c[a+34528+(e<<2)>>2]|0;g=f+4|0;bv(c[(c[g>>2]|0)+4>>2]|0);bv(c[g>>2]|0);bv(f);if((c[d>>2]|0)>0){f=0;do{g=c[a+34536+(f<<3)+(e<<2)>>2]|0;h=g+4|0;bv(c[(c[h>>2]|0)+4>>2]|0);bv(c[h>>2]|0);bv(g);f=f+1|0;}while((f|0)<(c[d>>2]|0))}e=e+1|0;}while((e|0)<(c[b>>2]|0));return}function aY(a){a=a|0;var b=0;b=a+4|0;bv(c[(c[b>>2]|0)+4>>2]|0);bv(c[b>>2]|0);bv(a);return 0}function aZ(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0;b=a+34520|0;d=c[b>>2]|0;e=a+34552|0;do{if((d|0)==0){f=c[c[e>>2]>>2]|0;g=bw(1,8)|0;h=g;c[g>>2]=f;i=bw(1,8)|0;c[g+4>>2]=i;c[i+4>>2]=bw(f,8)|0;c[i>>2]=0;c[b>>2]=h;i=c[c[a+34556>>2]>>2]|0;f=bw(1,8)|0;c[f>>2]=i;g=bw(1,8)|0;c[f+4>>2]=g;c[g+4>>2]=bw(i,8)|0;c[g>>2]=0;c[a+34524>>2]=f;f=a|0;if((c[f>>2]|0)<=0){j=h;break}h=a+16|0;g=0;do{i=c[c[a+34560+(g<<2)>>2]>>2]|0;k=bw(1,8)|0;c[k>>2]=i;l=bw(1,8)|0;c[k+4>>2]=l;c[l+4>>2]=bw(i,8)|0;c[l>>2]=0;c[a+34528+(g<<2)>>2]=k;if((c[h>>2]|0)>0){k=0;do{l=c[c[a+34568+(k<<3)+(g<<2)>>2]>>2]|0;i=bw(1,8)|0;c[i>>2]=l;m=bw(1,8)|0;c[i+4>>2]=m;c[m+4>>2]=bw(l,8)|0;c[m>>2]=0;c[a+34536+(k<<3)+(g<<2)>>2]=i;k=k+1|0;}while((k|0)<(c[h>>2]|0))}g=g+1|0;}while((g|0)<(c[f>>2]|0));j=c[b>>2]|0}else{j=d}}while(0);d=c[e>>2]|0;c[c[j+4>>2]>>2]=0;e=d|0;if((c[e>>2]|0)==0){n=j}else{f=d+4|0;d=j;j=0;while(1){g=(c[f>>2]|0)+(j<<3)|0;h=c[d+4>>2]|0;k=c[h>>2]|0;if((k+1|0)>(c[d>>2]|0)){i=a$(d,k+9|0)|0;m=c[i+4>>2]|0;o=i;p=m;q=c[m>>2]|0}else{o=d;p=h;q=k}c[p>>2]=q+1;k=g;g=(c[(c[o+4>>2]|0)+4>>2]|0)+(q<<3)|0;h=c[k+4>>2]|0;c[g>>2]=c[k>>2];c[g+4>>2]=h;h=j+1|0;if(h>>>0<(c[e>>2]|0)>>>0){d=o;j=h}else{n=o;break}}}c[b>>2]=n;n=a+34524|0;b=c[n>>2]|0;o=c[a+34556>>2]|0;c[c[b+4>>2]>>2]=0;j=o|0;if((c[j>>2]|0)==0){r=b}else{d=o+4|0;o=b;b=0;while(1){e=(c[d>>2]|0)+(b<<3)|0;q=c[o+4>>2]|0;p=c[q>>2]|0;if((p+1|0)>(c[o>>2]|0)){f=a$(o,p+9|0)|0;h=c[f+4>>2]|0;s=f;t=h;u=c[h>>2]|0}else{s=o;t=q;u=p}c[t>>2]=u+1;p=e;e=(c[(c[s+4>>2]|0)+4>>2]|0)+(u<<3)|0;q=c[p+4>>2]|0;c[e>>2]=c[p>>2];c[e+4>>2]=q;q=b+1|0;if(q>>>0<(c[j>>2]|0)>>>0){o=s;b=q}else{r=s;break}}}c[n>>2]=r;r=a|0;n=c[r>>2]|0;s=a+16|0;if((n|0)>0){b=0;while(1){o=a+34528+(b<<2)|0;j=c[o>>2]|0;u=c[a+34560+(b<<2)>>2]|0;c[c[j+4>>2]>>2]=0;t=u|0;if((c[t>>2]|0)==0){v=j}else{d=u+4|0;u=j;j=0;while(1){q=(c[d>>2]|0)+(j<<3)|0;e=c[u+4>>2]|0;p=c[e>>2]|0;if((p+1|0)>(c[u>>2]|0)){h=a$(u,p+9|0)|0;f=c[h+4>>2]|0;w=h;x=f;y=c[f>>2]|0}else{w=u;x=e;y=p}c[x>>2]=y+1;p=q;q=(c[(c[w+4>>2]|0)+4>>2]|0)+(y<<3)|0;e=c[p+4>>2]|0;c[q>>2]=c[p>>2];c[q+4>>2]=e;e=j+1|0;if(e>>>0<(c[t>>2]|0)>>>0){u=w;j=e}else{v=w;break}}}c[o>>2]=v;j=c[s>>2]|0;if((j|0)>0){u=0;while(1){t=a+34536+(u<<3)+(b<<2)|0;d=c[t>>2]|0;e=c[a+34568+(u<<3)+(b<<2)>>2]|0;c[c[d+4>>2]>>2]=0;q=e|0;if((c[q>>2]|0)==0){z=d}else{p=e+4|0;e=d;d=0;while(1){f=(c[p>>2]|0)+(d<<3)|0;h=c[e+4>>2]|0;g=c[h>>2]|0;if((g+1|0)>(c[e>>2]|0)){k=a$(e,g+9|0)|0;m=c[k+4>>2]|0;A=k;B=m;C=c[m>>2]|0}else{A=e;B=h;C=g}c[B>>2]=C+1;g=f;f=(c[(c[A+4>>2]|0)+4>>2]|0)+(C<<3)|0;h=c[g+4>>2]|0;c[f>>2]=c[g>>2];c[f+4>>2]=h;h=d+1|0;if(h>>>0<(c[q>>2]|0)>>>0){e=A;d=h}else{z=A;break}}}c[t>>2]=z;d=u+1|0;e=c[s>>2]|0;if((d|0)<(e|0)){u=d}else{D=e;break}}}else{D=j}u=b+1|0;o=c[r>>2]|0;if((u|0)<(o|0)){b=u}else{E=o;F=D;break}}}else{E=n;F=c[s>>2]|0}s=a+16|0;if((F|0)>0){G=0;H=E;I=F}else{J=a+34632|0;K=c[J>>2]|0;a1(K,a);return}while(1){if((H|0)>0){F=0;do{a1(c[a+34584+(G<<3)+(F<<2)>>2]|0,a);a1(c[a+34600+(G<<3)+(F<<2)>>2]|0,a);a1(c[a+34616+(G<<3)+(F<<2)>>2]|0,a);F=F+1|0;L=c[r>>2]|0;}while((F|0)<(L|0));M=L;N=c[s>>2]|0}else{M=H;N=I}F=G+1|0;if((F|0)<(N|0)){G=F;H=M;I=N}else{break}}J=a+34632|0;K=c[J>>2]|0;a1(K,a);return}function a_(a){a=a|0;var b=0,d=0;b=bw(1,8)|0;c[b>>2]=a;d=bw(1,8)|0;c[b+4>>2]=d;c[d+4>>2]=bw(a,8)|0;c[d>>2]=0;return b|0}function a$(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;d=bw(1,8)|0;e=d;c[d>>2]=b;f=bw(1,8)|0;c[d+4>>2]=f;d=bw(b,8)|0;c[f+4>>2]=d;g=c[a>>2]|0;h=(g|0)>(b|0)?b:g;c[f>>2]=h;if((h|0)<=0){i=a+4|0;j=c[i>>2]|0;k=j+4|0;l=c[k>>2]|0;m=l;bv(m);n=c[i>>2]|0;o=n;bv(o);p=a;bv(p);return e|0}g=f+4|0;f=a+4|0;b=0;q=d;while(1){d=(c[(c[f>>2]|0)+4>>2]|0)+(b<<3)|0;r=q+(b<<3)|0;s=c[d+4>>2]|0;c[r>>2]=c[d>>2];c[r+4>>2]=s;s=b+1|0;if((s|0)>=(h|0)){i=f;break}b=s;q=c[g>>2]|0}j=c[i>>2]|0;k=j+4|0;l=c[k>>2]|0;m=l;bv(m);n=c[i>>2]|0;o=n;bv(o);p=a;bv(p);return e|0}function a0(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;if((d|0)==0){e=a;return e|0}f=c[a+4>>2]|0;g=c[f>>2]|0;if((g+1|0)>(c[a>>2]|0)){h=a$(a,g+9|0)|0;i=c[h+4>>2]|0;j=h;k=i;l=c[i>>2]|0}else{j=a;k=f;l=g}c[k>>2]=l+1;k=(c[(c[j+4>>2]|0)+4>>2]|0)+(l<<3)|0;c[k>>2]=b;c[k+4>>2]=d;e=j;return e|0}function a1(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0;d=a|0;if((c[d>>2]|0)==0){return}e=b+34512|0;f=b+36|0;g=b+34516|0;h=b+96|0;i=c[a+4>>2]|0;a=1;j=c[e>>2]|0;while(1){k=c[i>>2]|0;l=c[i+4>>2]|0;if((j|0)==(c[f>>2]|0)){m=a2(b)|0;c[e>>2]=m;c[g>>2]=(c[f>>2]|0)-m;n=m}else{n=j}if((l|0)==0){o=n}else{m=c[g>>2]|0;if(m>>>0<l>>>0){p=l-m|0;aW(h,k>>>(p>>>0),m);m=a2(b)|0;c[e>>2]=m;c[g>>2]=(c[f>>2]|0)-m;aW(h,k,p);q=p}else{aW(h,k,l);q=l}l=(c[e>>2]|0)+q|0;c[e>>2]=l;c[g>>2]=(c[g>>2]|0)-q;o=l}if(a>>>0>=(c[d>>2]|0)>>>0){break}i=i+8|0;a=a+1|0;j=o}return}function a2(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;b=c[(c[a+34520>>2]|0)+4>>2]|0;d=b|0;if((c[d>>2]|0)==0){e=0}else{f=a+96|0;g=c[b+4>>2]|0;b=0;h=0;while(1){i=g+4|0;aW(f,c[g>>2]|0,c[i>>2]|0);j=(c[i>>2]|0)+h|0;i=b+1|0;if(i>>>0<(c[d>>2]|0)>>>0){g=g+8|0;b=i;h=j}else{e=j;break}}}h=c[(c[a+34524>>2]|0)+4>>2]|0;b=h|0;if((c[b>>2]|0)==0){k=0}else{g=a+96|0;d=c[h+4>>2]|0;h=0;f=0;while(1){j=d+4|0;aW(g,c[d>>2]|0,c[j>>2]|0);i=(c[j>>2]|0)+f|0;j=h+1|0;if(j>>>0<(c[b>>2]|0)>>>0){d=d+8|0;h=j;f=i}else{k=i;break}}}f=k+e|0;e=a|0;k=c[e>>2]|0;if((k|0)>0){h=a+96|0;d=f;b=0;g=k;while(1){i=c[(c[a+34528+(b<<2)>>2]|0)+4>>2]|0;j=i|0;if((c[j>>2]|0)==0){l=0;m=g}else{n=c[i+4>>2]|0;i=0;o=0;while(1){p=n+4|0;aW(h,c[n>>2]|0,c[p>>2]|0);q=(c[p>>2]|0)+o|0;p=i+1|0;if(p>>>0<(c[j>>2]|0)>>>0){n=n+8|0;i=p;o=q}else{break}}l=q;m=c[e>>2]|0}o=l+d|0;i=b+1|0;if((i|0)<(m|0)){d=o;b=i;g=m}else{r=o;s=m;break}}}else{r=f;s=k}k=a+16|0;f=c[k>>2]|0;if((f|0)<=0){t=r;return t|0}m=a+96|0;g=r;r=0;b=s;s=f;while(1){if((b|0)>0){f=g;d=0;l=b;while(1){q=c[(c[a+34536+(r<<3)+(d<<2)>>2]|0)+4>>2]|0;h=q|0;if((c[h>>2]|0)==0){u=0;v=l}else{o=c[q+4>>2]|0;q=0;i=0;while(1){n=o+4|0;aW(m,c[o>>2]|0,c[n>>2]|0);w=(c[n>>2]|0)+i|0;n=q+1|0;if(n>>>0<(c[h>>2]|0)>>>0){o=o+8|0;q=n;i=w}else{break}}u=w;v=c[e>>2]|0}x=u+f|0;i=d+1|0;if((i|0)<(v|0)){f=x;d=i;l=v}else{break}}y=x;z=v;A=c[k>>2]|0}else{y=g;z=b;A=s}l=r+1|0;if((l|0)<(A|0)){g=y;r=l;b=z;s=A}else{t=y;break}}return t|0}function a3(a){a=a|0;c[a+34636>>2]=a_(12)|0;c[a+34640>>2]=a_(12)|0;c[a+34644>>2]=a_(8)|0;c[a+34648>>2]=a_(8)|0;c[a+34652>>2]=a_(32)|0;c[a+34668>>2]=a_(64)|0;c[a+34684>>2]=a_(576)|0;c[a+34700>>2]=a_(4)|0;c[a+34656>>2]=a_(32)|0;c[a+34672>>2]=a_(64)|0;c[a+34688>>2]=a_(576)|0;c[a+34704>>2]=a_(4)|0;c[a+34660>>2]=a_(32)|0;c[a+34676>>2]=a_(64)|0;c[a+34692>>2]=a_(576)|0;c[a+34708>>2]=a_(4)|0;c[a+34664>>2]=a_(32)|0;c[a+34680>>2]=a_(64)|0;c[a+34696>>2]=a_(576)|0;c[a+34712>>2]=a_(4)|0;c[a+34716>>2]=a_(8)|0;return}function a4(a){a=a|0;aY(c[a+34636>>2]|0)|0;aY(c[a+34640>>2]|0)|0;aY(c[a+34644>>2]|0)|0;aY(c[a+34648>>2]|0)|0;aY(c[a+34652>>2]|0)|0;aY(c[a+34668>>2]|0)|0;aY(c[a+34684>>2]|0)|0;aY(c[a+34700>>2]|0)|0;aY(c[a+34656>>2]|0)|0;aY(c[a+34672>>2]|0)|0;aY(c[a+34688>>2]|0)|0;aY(c[a+34704>>2]|0)|0;aY(c[a+34660>>2]|0)|0;aY(c[a+34676>>2]|0)|0;aY(c[a+34692>>2]|0)|0;aY(c[a+34708>>2]|0)|0;aY(c[a+34664>>2]|0)|0;aY(c[a+34680>>2]|0)|0;aY(c[a+34696>>2]|0)|0;aY(c[a+34712>>2]|0)|0;aY(c[a+34716>>2]|0)|0;return}function a5(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0,aq=0;b=i;i=i+872|0;d=b|0;e=b+8|0;f=b+16|0;g=b+24|0;h=b+32|0;j=b+40|0;k=b+48|0;l=b+56|0;m=b+464|0;n=a+16|0;o=c[n>>2]|0;p=a|0;if((o|0)>0){q=0;r=c[p>>2]|0;s=o;while(1){if((r|0)>0){o=0;do{t=0;u=a+2248+(q*4608|0)+(o*2304|0)|0;v=a+25288+(q*4608|0)+(o*2304|0)|0;while(1){do{if((c[v>>2]|0)<0){w=c[u>>2]|0;if((w|0)<=0){break}c[u>>2]=-w}}while(0);w=t+1|0;if((w|0)<576){t=w;u=u+4|0;v=v+4|0}else{break}}o=o+1|0;x=c[p>>2]|0;}while((o|0)<(x|0));y=x;z=c[n>>2]|0}else{y=r;z=s}o=q+1|0;if((o|0)<(z|0)){q=o;r=y;s=z}else{break}}}z=m;s=a+144|0;bB(z|0,s|0,408)|0;z=a+34636|0;c[c[(c[z>>2]|0)+4>>2]>>2]=0;y=a0(c[z>>2]|0,4095,11)|0;c[z>>2]=y;r=a+8|0;q=a0(y,c[r>>2]|0,2)|0;c[z>>2]=q;y=a0(q,c[a+12>>2]|0,2)|0;c[z>>2]=y;q=a0(y,(c[a+76>>2]|0)==0|0,1)|0;c[z>>2]=q;y=a0(q,c[a+68>>2]|0,4)|0;c[z>>2]=y;q=a+72|0;x=a0(y,(c[q>>2]|0)%3|0,2)|0;c[z>>2]=x;y=a0(x,c[a+32>>2]|0,1)|0;c[z>>2]=y;x=a0(y,c[a+80>>2]|0,1)|0;c[z>>2]=x;y=a0(x,c[a+20>>2]|0,2)|0;c[z>>2]=y;x=a0(y,c[a+84>>2]|0,2)|0;c[z>>2]=x;y=a0(x,c[a+88>>2]|0,1)|0;c[z>>2]=y;x=a0(y,c[a+92>>2]|0,1)|0;c[z>>2]=x;c[z>>2]=a0(x,c[a+28>>2]|0,2)|0;x=a+34640|0;c[c[(c[x>>2]|0)+4>>2]>>2]=0;y=c[p>>2]|0;if((y|0)>0){o=0;while(1){c[c[(c[a+34644+(o<<2)>>2]|0)+4>>2]>>2]=0;v=o+1|0;u=c[p>>2]|0;if((v|0)<(u|0)){o=v}else{A=u;break}}}else{A=y}y=c[n>>2]|0;if((y|0)>0){o=0;u=A;A=y;while(1){if((u|0)>0){y=0;do{c[c[(c[a+34652+(o<<3)+(y<<2)>>2]|0)+4>>2]>>2]=0;y=y+1|0;B=c[p>>2]|0;}while((y|0)<(B|0));C=B;D=c[n>>2]|0}else{C=u;D=A}y=o+1|0;if((y|0)<(D|0)){o=y;u=C;A=D}else{break}}}D=c[x>>2]|0;if((c[r>>2]|0)==3){E=a0(D,0,9)|0}else{E=a0(D,0,8)|0}c[x>>2]=E;D=(c[r>>2]|0)==3;A=c[m>>2]|0;do{if((c[p>>2]|0)==2){if(D){c[x>>2]=a0(E,A,3)|0;break}else{c[x>>2]=a0(E,A,2)|0;break}}else{if(D){c[x>>2]=a0(E,A,5)|0;break}else{c[x>>2]=a0(E,A,1)|0;break}}}while(0);do{if((c[r>>2]|0)==3){if((c[p>>2]|0)>0){F=0}else{break}do{A=a+34644+(F<<2)|0;E=a0(c[A>>2]|0,c[m+8+(F<<4)>>2]|0,1)|0;c[A>>2]=E;D=a0(E,c[m+8+(F<<4)+4>>2]|0,1)|0;c[A>>2]=D;E=a0(D,c[m+8+(F<<4)+8>>2]|0,1)|0;c[A>>2]=E;c[A>>2]=a0(E,c[m+8+(F<<4)+12>>2]|0,1)|0;F=F+1|0;}while((F|0)<(c[p>>2]|0))}}while(0);F=c[n>>2]|0;if((F|0)>0){E=0;A=c[p>>2]|0;D=F;while(1){if((A|0)>0){C=0;do{u=a+34652+(E<<3)+(C<<2)|0;o=a0(c[u>>2]|0,c[m+40+(E*184|0)+(C*92|0)>>2]|0,12)|0;c[u>>2]=o;B=a0(o,c[m+40+(E*184|0)+(C*92|0)+4>>2]|0,9)|0;c[u>>2]=B;o=a0(B,c[m+40+(E*184|0)+(C*92|0)+12>>2]|0,8)|0;c[u>>2]=o;B=c[m+40+(E*184|0)+(C*92|0)+16>>2]|0;if((c[r>>2]|0)==3){G=a0(o,B,4)|0}else{G=a0(o,B,9)|0}c[u>>2]=G;B=a0(G,0,1)|0;c[u>>2]=B;o=a0(B,c[m+40+(E*184|0)+(C*92|0)+20>>2]|0,5)|0;c[u>>2]=o;B=a0(o,c[m+40+(E*184|0)+(C*92|0)+24>>2]|0,5)|0;c[u>>2]=B;o=a0(B,c[m+40+(E*184|0)+(C*92|0)+28>>2]|0,5)|0;c[u>>2]=o;B=a0(o,c[m+40+(E*184|0)+(C*92|0)+32>>2]|0,4)|0;c[u>>2]=B;o=a0(B,c[m+40+(E*184|0)+(C*92|0)+36>>2]|0,3)|0;c[u>>2]=o;if((c[r>>2]|0)==3){B=a0(o,c[m+40+(E*184|0)+(C*92|0)+40>>2]|0,1)|0;c[u>>2]=B;H=B}else{H=o}o=a0(H,c[m+40+(E*184|0)+(C*92|0)+44>>2]|0,1)|0;c[u>>2]=o;c[u>>2]=a0(o,c[m+40+(E*184|0)+(C*92|0)+48>>2]|0,1)|0;C=C+1|0;I=c[p>>2]|0;}while((C|0)<(I|0));J=I;K=c[n>>2]|0}else{J=A;K=D}C=E+1|0;if((C|0)<(K|0)){E=C;A=J;D=K}else{L=K;break}}}else{L=F}F=l;bB(F|0,s|0,408)|0;s=c[p>>2]|0;do{if((L|0)>0){F=0;K=s;D=L;J=s;while(1){if((K|0)>0){A=0;do{c[c[(c[a+34668+(F<<3)+(A<<2)>>2]|0)+4>>2]>>2]=0;c[c[(c[a+34684+(F<<3)+(A<<2)>>2]|0)+4>>2]>>2]=0;A=A+1|0;M=c[p>>2]|0;}while((A|0)<(M|0));N=M;O=c[n>>2]|0;P=M}else{N=K;O=D;P=J}A=F+1|0;if((A|0)<(O|0)){F=A;K=N;D=O;J=P}else{break}}if((O|0)<=0){Q=O;R=P;break}J=0;D=P;K=O;while(1){if((D|0)>0){F=(J|0)==0;A=0;do{E=a+34668+(J<<3)+(A<<2)|0;I=c[l+40+(J*184|0)+(A*92|0)+16>>2]|0;m=c[7472+(I<<2)>>2]|0;H=c[7344+(I<<2)>>2]|0;if(F){S=194}else{if((c[l+8+(A<<4)>>2]|0)==0){S=194}else{S=195}}if((S|0)==194){S=0;I=a0(c[E>>2]|0,c[a+1232+(J*176|0)+(A*88|0)>>2]|0,m)|0;c[E>>2]=I;r=a0(I,c[a+1232+(J*176|0)+(A*88|0)+4>>2]|0,m)|0;c[E>>2]=r;I=a0(r,c[a+1232+(J*176|0)+(A*88|0)+8>>2]|0,m)|0;c[E>>2]=I;r=a0(I,c[a+1232+(J*176|0)+(A*88|0)+12>>2]|0,m)|0;c[E>>2]=r;I=a0(r,c[a+1232+(J*176|0)+(A*88|0)+16>>2]|0,m)|0;c[E>>2]=I;r=a0(I,c[a+1232+(J*176|0)+(A*88|0)+20>>2]|0,m)|0;c[E>>2]=r;if(F){T=r;S=197}else{S=195}}do{if((S|0)==195){S=0;if((c[l+8+(A<<4)+4>>2]|0)!=0){S=198;break}T=c[E>>2]|0;S=197}}while(0);if((S|0)==197){S=0;r=a0(T,c[a+1232+(J*176|0)+(A*88|0)+24>>2]|0,m)|0;c[E>>2]=r;I=a0(r,c[a+1232+(J*176|0)+(A*88|0)+28>>2]|0,m)|0;c[E>>2]=I;r=a0(I,c[a+1232+(J*176|0)+(A*88|0)+32>>2]|0,m)|0;c[E>>2]=r;I=a0(r,c[a+1232+(J*176|0)+(A*88|0)+36>>2]|0,m)|0;c[E>>2]=I;r=a0(I,c[a+1232+(J*176|0)+(A*88|0)+40>>2]|0,m)|0;c[E>>2]=r;if(F){U=r;S=200}else{S=198}}do{if((S|0)==198){S=0;if((c[l+8+(A<<4)+8>>2]|0)!=0){S=201;break}U=c[E>>2]|0;S=200}}while(0);if((S|0)==200){S=0;m=a0(U,c[a+1232+(J*176|0)+(A*88|0)+44>>2]|0,H)|0;c[E>>2]=m;r=a0(m,c[a+1232+(J*176|0)+(A*88|0)+48>>2]|0,H)|0;c[E>>2]=r;m=a0(r,c[a+1232+(J*176|0)+(A*88|0)+52>>2]|0,H)|0;c[E>>2]=m;r=a0(m,c[a+1232+(J*176|0)+(A*88|0)+56>>2]|0,H)|0;c[E>>2]=r;m=a0(r,c[a+1232+(J*176|0)+(A*88|0)+60>>2]|0,H)|0;c[E>>2]=m;if(F){V=m;S=203}else{S=201}}do{if((S|0)==201){S=0;if((c[l+8+(A<<4)+12>>2]|0)!=0){break}V=c[E>>2]|0;S=203}}while(0);if((S|0)==203){S=0;m=a0(V,c[a+1232+(J*176|0)+(A*88|0)+64>>2]|0,H)|0;c[E>>2]=m;r=a0(m,c[a+1232+(J*176|0)+(A*88|0)+68>>2]|0,H)|0;c[E>>2]=r;m=a0(r,c[a+1232+(J*176|0)+(A*88|0)+72>>2]|0,H)|0;c[E>>2]=m;r=a0(m,c[a+1232+(J*176|0)+(A*88|0)+76>>2]|0,H)|0;c[E>>2]=r;c[E>>2]=a0(r,c[a+1232+(J*176|0)+(A*88|0)+80>>2]|0,H)|0}r=a+34684+(J<<3)+(A<<2)|0;m=c[q>>2]|0;c[k>>2]=0;c[j>>2]=0;c[h>>2]=0;I=c[l+40+(J*184|0)+(A*92|0)+4>>2]<<1;G=c[l+40+(J*184|0)+(A*92|0)+32>>2]|0;C=c[7536+(m*92|0)+(G+1<<2)>>2]|0;o=c[7536+(m*92|0)+(G+2+(c[l+40+(J*184|0)+(A*92|0)+36>>2]|0)<<2)>>2]|0;if((I|0)>0){G=l+40+(J*184|0)+(A*92|0)+20|0;m=l+40+(J*184|0)+(A*92|0)+24|0;u=l+40+(J*184|0)+(A*92|0)+28|0;B=0;y=0;while(1){if((y|0)<(C|0)){W=G;X=h}else{v=(y|0)<(o|0);W=v?m:u;X=v?j:k}v=c[W>>2]|0;if((v|0)==0){Y=B;Z=0}else{t=a7(v,c[a+2248+(J*4608|0)+(A*2304|0)+(y<<2)>>2]|0,c[a+2248+(J*4608|0)+(A*2304|0)+((y|1)<<2)>>2]|0,f,g,d,e)|0;v=a0(c[r>>2]|0,c[f>>2]|0,c[d>>2]|0)|0;c[r>>2]=v;c[r>>2]=a0(v,c[g>>2]|0,c[e>>2]|0)|0;Y=t+B|0;Z=(c[X>>2]|0)+t|0}c[X>>2]=Z;t=y+2|0;if((t|0)<(I|0)){B=Y;y=t}else{_=Y;break}}}else{_=0}y=8408+(((c[l+40+(J*184|0)+(A*92|0)+48>>2]|0)+32|0)*24|0)|0;B=(c[l+40+(J*184|0)+(A*92|0)+8>>2]<<2)+I|0;if((I|0)<(B|0)){u=_;m=I;while(1){o=(a6(r,y,c[a+2248+(J*4608|0)+(A*2304|0)+(m<<2)>>2]|0,c[a+2248+(J*4608|0)+(A*2304|0)+((m|1)<<2)>>2]|0,c[a+2248+(J*4608|0)+(A*2304|0)+(m+2<<2)>>2]|0,c[a+2248+(J*4608|0)+(A*2304|0)+(m+3<<2)>>2]|0)|0)+u|0;G=m+4|0;if((G|0)<(B|0)){u=o;m=G}else{$=o;break}}}else{$=_}m=(c[l+40+(J*184|0)+(A*92|0)>>2]|0)-(c[l+40+(J*184|0)+(A*92|0)+52>>2]|0)|0;u=m-$|0;do{if((m|0)!=($|0)){B=(u|0)%32|0;if((u+31|0)>>>0>=63){y=(u|0)/32|0;I=c[r>>2]|0;do{y=y-1|0;I=a0(I,-1,32)|0;c[r>>2]=I;}while((y|0)!=0)}if((B|0)==0){break}c[r>>2]=a0(c[r>>2]|0,-1,B)|0}}while(0);A=A+1|0;aa=c[p>>2]|0;}while((A|0)<(aa|0));ab=aa;ac=c[n>>2]|0}else{ab=D;ac=K}A=J+1|0;if((A|0)<(ac|0)){J=A;D=ab;K=ac}else{Q=ac;R=ab;break}}}else{Q=L;R=s}}while(0);c[a+34552>>2]=c[(c[z>>2]|0)+4>>2];c[a+34556>>2]=c[(c[x>>2]|0)+4>>2];if((R|0)>0){x=0;do{c[a+34560+(x<<2)>>2]=c[(c[a+34644+(x<<2)>>2]|0)+4>>2];x=x+1|0;ad=c[p>>2]|0;}while((x|0)<(ad|0));ae=c[n>>2]|0;af=ad}else{ae=Q;af=R}if((ae|0)>0){ag=0;ah=af;ai=ae}else{aj=a+34716|0;ak=c[aj>>2]|0;al=ak+4|0;am=c[al>>2]|0;an=a+34632|0;c[an>>2]=am;aZ(a);i=b;return}while(1){if((ah|0)>0){ae=0;do{c[a+34568+(ag<<3)+(ae<<2)>>2]=c[(c[a+34652+(ag<<3)+(ae<<2)>>2]|0)+4>>2];c[a+34584+(ag<<3)+(ae<<2)>>2]=c[(c[a+34668+(ag<<3)+(ae<<2)>>2]|0)+4>>2];c[a+34600+(ag<<3)+(ae<<2)>>2]=c[(c[a+34684+(ag<<3)+(ae<<2)>>2]|0)+4>>2];c[a+34616+(ag<<3)+(ae<<2)>>2]=c[(c[a+34700+(ag<<3)+(ae<<2)>>2]|0)+4>>2];ae=ae+1|0;ao=c[p>>2]|0;}while((ae|0)<(ao|0));ap=ao;aq=c[n>>2]|0}else{ap=ah;aq=ai}ae=ag+1|0;if((ae|0)<(aq|0)){ag=ae;ah=ap;ai=aq}else{break}}aj=a+34716|0;ak=c[aj>>2]|0;al=ak+4|0;am=c[al>>2]|0;an=a+34632|0;c[an>>2]=am;aZ(a);i=b;return}function a6(a,b,e,f,g,h){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;var i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0;i=(e|0)>0;j=i?e:-e|0;e=(f|0)>0;k=e?f:-f|0;f=(g|0)>0;l=f?g:-g|0;g=(h|0)>0;m=g?h:-h|0;h=(k<<1)+j+(l<<2)+(m<<3)|0;n=d[(c[b+20>>2]|0)+h|0]|0;o=a0(c[a>>2]|0,c[(c[b+16>>2]|0)+(h<<2)>>2]|0,n)|0;c[a>>2]=o;if((j|0)==0){p=n;q=o}else{j=a0(o,i&1^1,1)|0;c[a>>2]=j;p=n+1|0;q=j}if((k|0)==0){r=p;s=q}else{k=a0(q,e&1^1,1)|0;c[a>>2]=k;r=p+1|0;s=k}if((l|0)==0){t=r;u=s}else{l=a0(s,f&1^1,1)|0;c[a>>2]=l;t=r+1|0;u=l}if((m|0)==0){v=t;return v|0}c[a>>2]=a0(u,g&1^1,1)|0;v=t+1|0;return v|0}function a7(a,b,e,f,g,h,i){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;h=h|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;c[h>>2]=0;c[i>>2]=0;c[f>>2]=0;c[g>>2]=0;if((a|0)==0){j=0;return j|0}k=(b|0)>0;l=k?b:-b|0;b=k&1^1;k=(e|0)>0;m=k?e:-e|0;e=k&1^1;k=c[8412+(a*24|0)>>2]|0;n=c[8416+(a*24|0)>>2]|0;do{if((a|0)>15){o=(l|0)>14;p=o?15:l;q=(m|0)>14;r=q?15:m;s=($(k,p)|0)+r|0;c[f>>2]=c[(c[8424+(a*24|0)>>2]|0)+(s<<2)>>2];c[h>>2]=d[(c[8428+(a*24|0)>>2]|0)+s|0]|0;if(o){c[g>>2]=c[g>>2]|l-15;c[i>>2]=(c[i>>2]|0)+n}if((p|0)!=0){c[g>>2]=c[g>>2]<<1|b;c[i>>2]=(c[i>>2]|0)+1}if(q){c[g>>2]=c[g>>2]<<n|(q?m-15|0:0);c[i>>2]=(c[i>>2]|0)+n}if((r|0)==0){break}c[g>>2]=c[g>>2]<<1|e;c[i>>2]=(c[i>>2]|0)+1}else{r=($(k,l)|0)+m|0;c[f>>2]=c[(c[8424+(a*24|0)>>2]|0)+(r<<2)>>2];c[h>>2]=(c[h>>2]|0)+(d[(c[8428+(a*24|0)>>2]|0)+r|0]|0);if((l|0)!=0){c[f>>2]=c[f>>2]<<1|b;c[h>>2]=(c[h>>2]|0)+1}if((m|0)==0){break}c[f>>2]=c[f>>2]<<1|e;c[h>>2]=(c[h>>2]|0)+1}}while(0);j=(c[i>>2]|0)+(c[h>>2]|0)|0;return j|0}function a8(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0;d=c[a+4>>2]|0;if((d|0)==0){c[a+32>>2]=0;c[a+36>>2]=0;return}e=d<<1;d=0;while(1){if((c[7536+(b*92|0)+(d<<2)>>2]|0)<(e|0)){d=d+1|0}else{break}}f=c[7096+(d<<3)>>2]|0;g=a+32|0;c[g>>2]=f;L386:do{if(d>>>0<6){h=f}else{i=f;j=f+1|0;while(1){if((c[7536+(b*92|0)+(j<<2)>>2]|0)<=(e|0)){h=i;break L386}k=i-1|0;if((k|0)==0){h=0;break}else{i=k;j=j-1|0}}}}while(0);c[g>>2]=h;g=c[7100+(d<<3)>>2]|0;f=a+36|0;c[f>>2]=g;L392:do{if(d>>>0<5){l=g}else{j=g;i=g+2+h|0;while(1){if((c[7536+(b*92|0)+(i<<2)>>2]|0)<=(e|0)){l=j;break L392}k=j-1|0;if((k|0)==0){l=0;break}else{j=k;i=i-1|0}}}}while(0);c[f>>2]=l;c[a+60>>2]=c[7536+(b*92|0)+(h+1<<2)>>2];c[a+64>>2]=c[7536+(b*92|0)+(h+2+l<<2)>>2];c[a+68>>2]=e;return}function a9(a,b,e,f,g,i){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0.0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0;g=e+72|0;if((b|0)<0){c[g>>2]=(c[g>>2]|0)-1}f=i+39332|0;j=i+34720|0;k=e+8|0;l=e+4|0;m=e+48|0;n=i+72|0;o=e+20|0;p=e+24|0;q=e+28|0;r=e+60|0;s=e+64|0;t=e+68|0;while(1){u=c[g>>2]|0;c[g>>2]=u+1;v=u+128|0;u=c[i+40712+(v<<2)>>2]|0;w=c[f>>2]|0;x=u;y=(u|0)<0?-1:0;u=bO(w,(w|0)<0?-1:0,x,y)|0;bE(u,D,-2147483648,0)|0;if((D|0)>165140){continue}u=i+39688+(v<<3)|0;v=0;w=0;do{z=c[(c[j>>2]|0)+(w<<2)>>2]|0;A=(z|0)>-1?z:-z|0;z=bO(A,(A|0)<0?-1:0,x,y)|0;bE(z,D,-2147483648,0)|0;z=D;if((z|0)<1e4){A=c[i+41224+(z<<2)>>2]|0;c[a+(w<<2)>>2]=A;B=A}else{C=+h[u>>3]*+(c[i+37028+(w<<2)>>2]|0)*4.656612875e-10;A=~~+P(+(+P(+C)*C));c[a+(w<<2)>>2]=A;B=A}v=(v|0)<(B|0)?B:v;w=w+1|0;}while((w|0)<576);if((v|0)>8192){continue}else{E=576}while(1){if((E|0)<=1){F=E;G=0;break}if((c[a+(E-1<<2)>>2]|0)!=0){F=E;G=0;break}w=E-2|0;if((c[a+(w<<2)>>2]|0)==0){E=w}else{F=E;G=0;break}}while(1){c[k>>2]=G;if((F|0)<=3){break}if((c[a+(F-1<<2)>>2]|0)>=2){break}if((c[a+(F-2<<2)>>2]|0)>=2){break}if((c[a+(F-3<<2)>>2]|0)>=2){break}v=F-4|0;if((c[a+(v<<2)>>2]|0)<2){F=v;G=G+1|0}else{break}}c[l>>2]=F>>1;if((G|0)==0){H=0;I=0}else{v=c[2299]|0;w=c[2305]|0;u=0;y=F;x=0;A=0;while(1){z=c[a+(y<<2)>>2]|0;J=c[a+((y|1)<<2)>>2]|0;K=c[a+(y+2<<2)>>2]|0;L=c[a+(y+3<<2)>>2]|0;M=(J<<1)+z+(K<<2)+(L<<3)|0;N=(z|0)!=0;z=((K|0)!=0)+((J|0)==0?N&1:N?2:1)+((L|0)!=0)|0;L=(d[v+M|0]|0)+x+z|0;N=z+A+(d[w+M|0]|0)|0;M=u+1|0;if(M>>>0<G>>>0){u=M;y=y+4|0;x=L;A=N}else{H=L;I=N;break}}}A=(H|0)<(I|0);c[m>>2]=A&1^1;a8(e,c[n>>2]|0);c[o>>2]=0;c[p>>2]=0;c[q>>2]=0;x=c[r>>2]|0;if((x|0)==0){O=0}else{y=be(a,0,x)|0;c[o>>2]=y;O=y}y=c[s>>2]|0;if(y>>>0>x>>>0){u=be(a,x,y)|0;c[p>>2]=u;Q=u}else{Q=0}u=c[l>>2]<<1;if(u>>>0>y>>>0){w=be(a,y,u)|0;c[q>>2]=w;R=w}else{R=0}if((O|0)==0){S=0}else{S=bb(a,0,x,O)|0}if((Q|0)==0){T=S}else{T=(bb(a,x,y,Q)|0)+S|0}if((R|0)==0){U=T}else{U=(bb(a,y,c[t>>2]|0,R)|0)+T|0}V=U+(A?H:I)|0;if((V|0)<=(b|0)){break}}return V|0}function ba(a,b,e,f,g,i){a=a|0;b=b|0;e=e|0;f=f|0;g=g|0;i=i|0;var j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0.0,L=0,M=0,N=0,O=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,am=0,an=0,ao=0,ap=0;b=i+184+(f*184|0)+(g*92|0)|0;j=i+39332|0;k=i+34720|0;l=i+184+(f*184|0)+(g*92|0)+8|0;m=i+184+(f*184|0)+(g*92|0)+4|0;n=i+184+(f*184|0)+(g*92|0)+48|0;o=i+72|0;p=i+184+(f*184|0)+(g*92|0)+20|0;q=i+184+(f*184|0)+(g*92|0)+24|0;r=i+184+(f*184|0)+(g*92|0)+28|0;s=i+184+(f*184|0)+(g*92|0)+60|0;t=i+184+(f*184|0)+(g*92|0)+64|0;u=i+184+(f*184|0)+(g*92|0)+68|0;v=-120;w=-120;x=0;while(1){y=v+x>>1;z=y+127|0;A=c[i+40712+(z<<2)>>2]|0;B=c[j>>2]|0;C=A;E=(A|0)<0?-1:0;A=bO(B,(B|0)<0?-1:0,C,E)|0;bE(A,D,-2147483648,0)|0;do{if((D|0)>165140){F=1e5}else{A=i+39688+(z<<3)|0;B=0;G=0;do{H=c[(c[k>>2]|0)+(G<<2)>>2]|0;I=(H|0)>-1?H:-H|0;H=bO(I,(I|0)<0?-1:0,C,E)|0;bE(H,D,-2147483648,0)|0;H=D;if((H|0)<1e4){I=c[i+41224+(H<<2)>>2]|0;c[e+(G<<2)>>2]=I;J=I}else{K=+h[A>>3]*+(c[i+37028+(G<<2)>>2]|0)*4.656612875e-10;I=~~+P(+(+P(+K)*K));c[e+(G<<2)>>2]=I;J=I}B=(B|0)<(J|0)?J:B;G=G+1|0;}while((G|0)<576);if((B|0)>8192){F=1e5;break}else{L=576}while(1){if((L|0)<=1){M=L;N=0;break}if((c[e+(L-1<<2)>>2]|0)!=0){M=L;N=0;break}G=L-2|0;if((c[e+(G<<2)>>2]|0)==0){L=G}else{M=L;N=0;break}}while(1){c[l>>2]=N;if((M|0)<=3){break}if((c[e+(M-1<<2)>>2]|0)>=2){break}if((c[e+(M-2<<2)>>2]|0)>=2){break}if((c[e+(M-3<<2)>>2]|0)>=2){break}B=M-4|0;if((c[e+(B<<2)>>2]|0)<2){M=B;N=N+1|0}else{break}}c[m>>2]=M>>1;if((N|0)==0){O=0;Q=0}else{B=c[2299]|0;G=c[2305]|0;A=0;I=M;H=0;R=0;while(1){S=c[e+(I<<2)>>2]|0;T=c[e+((I|1)<<2)>>2]|0;U=c[e+(I+2<<2)>>2]|0;V=c[e+(I+3<<2)>>2]|0;W=(T<<1)+S+(U<<2)+(V<<3)|0;X=(S|0)!=0;S=((U|0)!=0)+((T|0)==0?X&1:X?2:1)+((V|0)!=0)|0;V=(d[B+W|0]|0)+H+S|0;X=S+R+(d[G+W|0]|0)|0;W=A+1|0;if(W>>>0<N>>>0){A=W;I=I+4|0;H=V;R=X}else{O=V;Q=X;break}}}R=(O|0)<(Q|0);c[n>>2]=R&1^1;a8(b,c[o>>2]|0);c[p>>2]=0;c[q>>2]=0;c[r>>2]=0;H=c[s>>2]|0;if((H|0)==0){Y=0}else{I=be(e,0,H)|0;c[p>>2]=I;Y=I}I=c[t>>2]|0;if(I>>>0>H>>>0){A=be(e,H,I)|0;c[q>>2]=A;Z=A}else{Z=0}A=c[m>>2]<<1;if(A>>>0>I>>>0){G=be(e,I,A)|0;c[r>>2]=G;_=G}else{_=0}if((Y|0)==0){$=0}else{$=bb(e,0,H,Y)|0}if((Z|0)==0){aa=$}else{aa=(bb(e,H,I,Z)|0)+$|0}if((_|0)==0){ab=aa}else{ab=(bb(e,I,c[u>>2]|0,_)|0)+aa|0}F=ab+(R?O:Q)|0}}while(0);E=(F|0)>(a|0);if((F|0)==(a|0)){break}C=w-y|0;if((((C|0)>-1?C:-C|0)|0)<=1){break}v=E?y:v;w=y;x=E?x:y}c[i+184+(f*184|0)+(g*92|0)+72>>2]=y;y=c[i+184+(f*184|0)+(g*92|0)+16>>2]|0;x=c[7408+(y<<2)>>2]|0;w=c[7280+(y<<2)>>2]|0;y=(f|0)!=0;if(y){if((c[i+152+(g<<4)>>2]|0)==0){ac=x*6|0}else{ac=0}if((c[i+152+(g<<4)+4>>2]|0)==0){ad=ac;ae=353}else{af=ac}}else{ad=x*6|0;ae=353}if((ae|0)==353){af=ad+(x*5|0)|0}do{if(y){if((c[i+152+(g<<4)+8>>2]|0)==0){ag=af+(w*5|0)|0}else{ag=af}if((c[i+152+(g<<4)+12>>2]|0)==0){ah=ag;ai=w*5|0;break}else{aj=ag;ak=i+184+(f*184|0)+(g*92|0)+52|0;c[ak>>2]=aj;al=a-aj|0;am=a9(e,al,b,0,0,i)|0;an=c[ak>>2]|0;ao=an+am|0;ap=b|0;c[ap>>2]=ao;return ao|0}}else{x=w*5|0;ah=af+x|0;ai=x}}while(0);aj=ah+ai|0;ak=i+184+(f*184|0)+(g*92|0)+52|0;c[ak>>2]=aj;al=a-aj|0;am=a9(e,al,b,0,0,i)|0;an=c[ak>>2]|0;ao=an+am|0;ap=b|0;c[ap>>2]=ao;return ao|0}function bb(a,b,e,f){a=a|0;b=b|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if((f|0)==0){g=0;return g|0}h=c[8412+(f*24|0)>>2]|0;i=c[8416+(f*24|0)>>2]|0;j=b>>>0<e>>>0;if(f>>>0>15){if(!j){g=0;return g|0}k=c[8428+(f*24|0)>>2]|0;l=b;m=0;while(1){n=c[a+(l<<2)>>2]|0;o=c[a+(l+1<<2)>>2]|0;p=(n|0)>14;q=p?15:n;n=(o|0)>14;r=n?15:o;o=(p?i:0)+m+(n?i:0)+(d[k+(($(q,h)|0)+r)|0]|0)+((q|0)!=0)+((r|0)!=0)|0;r=l+2|0;if(r>>>0<e>>>0){l=r;m=o}else{g=o;break}}return g|0}else{if(!j){g=0;return g|0}j=c[8428+(f*24|0)>>2]|0;f=b;b=0;while(1){m=c[a+(f<<2)>>2]|0;l=c[a+(f+1<<2)>>2]|0;k=((m|0)!=0)+b+((l|0)!=0)+(d[j+(($(m,h)|0)+l)|0]|0)|0;l=f+2|0;if(l>>>0<e>>>0){f=l;b=k}else{g=k;break}}return g|0}return 0}function bc(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0.0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0;b=i;i=i+672|0;d=b|0;e=c[a>>2]|0;if((e|0)==0){bs(a);i=b;return}f=a+16|0;g=a+34720|0;j=a+39332|0;k=a+8|0;l=a+72|0;m=a;n=a+39684|0;o=a+39680|0;p=a+39336|0;q=a+39340|0;r=e;e=c[f>>2]|0;while(1){s=r-1|0;if((e|0)>0){t=m+((s<<4)+152)|0;u=0;while(1){v=a+25288+(u*4608|0)+(s*2304|0)|0;c[g>>2]=v;c[j>>2]=0;w=575;x=v;while(1){v=c[x+(w<<2)>>2]|0;y=v;z=(v|0)<0?-1:0;v=bO(y,z,y,z)|0;z=bE(v,D,-2147483648,0)|0;c[a+34724+(w<<2)>>2]=z>>>31|D<<1;z=c[(c[g>>2]|0)+(w<<2)>>2]|0;v=(z|0)>-1?z:-z|0;c[a+37028+(w<<2)>>2]=v;if((v|0)>(c[j>>2]|0)){c[j>>2]=v}if((w|0)==0){break}w=w-1|0;x=c[g>>2]|0}x=a+2248+(u*4608|0)+(s*2304|0)|0;c[a+184+(u*184|0)+(s*92|0)+56>>2]=21;w=a+184+(u*184|0)+(s*92|0)|0;bC(d+(u*336|0)+(s*168|0)|0,0,168);do{if((c[k>>2]|0)==3){v=c[l>>2]|0;c[a+39680+(u<<2)>>2]=c[j>>2];z=0;y=575;while(1){A=(c[a+34724+(y<<2)>>2]>>10)+z|0;if((y|0)==0){break}else{z=A;y=y-1|0}}if((A|0)==0){c[a+39336+(u<<2)>>2]=0;B=21;C=20}else{c[a+39336+(u<<2)>>2]=~~(+Z(+(+(A|0)*4.768371584e-7))/.69314718);B=21;C=20}while(1){y=c[7536+(v*92|0)+(C<<2)>>2]|0;z=c[7536+(v*92|0)+(B<<2)>>2]|0;do{if((y|0)<(z|0)){E=y;F=0;do{F=(c[a+34724+(E<<2)>>2]>>10)+F|0;E=E+1|0;}while((E|0)<(z|0));if((F|0)==0){G=398;break}c[a+39344+(u*84|0)+(C<<2)>>2]=~~(+Z(+(+(F|0)*4.768371584e-7))/.69314718)}else{G=398}}while(0);if((G|0)==398){G=0;c[a+39344+(u*84|0)+(C<<2)>>2]=0}H=+h[d+(u*336|0)+(s*168|0)+(C<<3)>>3];if(H!=0.0){c[a+39512+(u*84|0)+(C<<2)>>2]=~~(+Z(+H)/.69314718)}else{c[a+39512+(u*84|0)+(C<<2)>>2]=0}if((C|0)==0){break}else{B=C;C=C-1|0}}if((u|0)!=1){break}v=(c[o>>2]|0)!=0;z=(c[n>>2]|0)!=0?3:2;y=(c[p>>2]|0)-(c[q>>2]|0)|0;E=(((y|0)>-1?y:-y|0)|0)<10;y=0;I=20;while(1){J=(c[a+39344+(I<<2)>>2]|0)-(c[a+39428+(I<<2)>>2]|0)|0;K=((J|0)>-1?J:-J|0)+y|0;if((I|0)==0){break}else{y=K;I=I-1|0}}if(((v&1)+z+(E&1)+((K|0)<100)|0)==6){L=0;M=0}else{bC(t|0,0,16);break}while(1){I=a+152+(s<<4)+(L<<2)|0;c[I>>2]=0;y=L+1|0;J=c[13376+(y<<2)>>2]|0;if((M|0)<(J|0)){N=M;O=0;P=0;do{Q=(c[a+39344+(N<<2)>>2]|0)-(c[a+39428+(N<<2)>>2]|0)|0;O=((Q|0)>-1?Q:-Q|0)+O|0;Q=(c[a+39512+(N<<2)>>2]|0)-(c[a+39596+(N<<2)>>2]|0)|0;P=((Q|0)>-1?Q:-Q|0)+P|0;N=N+1|0;}while((N|0)<(J|0));R=(O|0)<10;S=(P|0)<10}else{R=1;S=1}if(R&S){c[I>>2]=1;if((y|0)<4){L=y;M=J;continue}else{break}}else{c[I>>2]=0;if((y|0)<4){L=y;M=J;continue}else{break}}}}}while(0);E=bl(a+2216+(u<<4)+(s<<3)|0,a)|0;bC(a+1232+(u*176|0)+(s*88|0)|0,0,22);bC(a+1584+(u*312|0)+(s*156|0)|0,0,14);z=w|0;c[z>>2]=0;c[a+184+(u*184|0)+(s*92|0)+4>>2]=0;c[a+184+(u*184|0)+(s*92|0)+8>>2]=0;bC(a+184+(u*184|0)+(s*92|0)+16|0,0,40);bC(a+184+(u*184|0)+(s*92|0)+76|0,0,16);if((c[j>>2]|0)!=0){c[z>>2]=ba(E,0,x,u,s,a)|0}bm(w,a);c[a+184+(u*184|0)+(s*92|0)+12>>2]=(c[a+184+(u*184|0)+(s*92|0)+72>>2]|0)+210;E=u+1|0;z=c[f>>2]|0;if((E|0)<(z|0)){u=E}else{T=z;break}}}else{T=e}if((s|0)==0){break}else{r=s;e=T}}bs(a);i=b;return}function bd(a){a=a|0;var b=0,d=0,e=0.0,f=0.0,g=0;b=128;d=127;while(1){e=+ao(+(+(128-b|0)*.25));h[a+39688+(d<<3)>>3]=e;f=e*2.0;if(f>2147483647.0){c[a+40712+(d<<2)>>2]=2147483647}else{c[a+40712+(d<<2)>>2]=~~(f+.5)}if((d|0)==0){g=9999;break}else{b=d;d=d-1|0}}while(1){f=+(g|0);c[a+41224+(g<<2)>>2]=~~(+P(+(f*+P(+f)))+-.0946+.5);if((g|0)==0){break}else{g=g-1|0}}return}function be(a,b,e){a=a|0;b=b|0;e=e|0;var f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0;if(b>>>0<e>>>0){f=b;g=0}else{h=0;return h|0}do{i=c[a+(f<<2)>>2]|0;g=(g|0)<(i|0)?i:g;f=f+1|0;}while(f>>>0<e>>>0);if((g|0)==0){h=0;return h|0}if((g|0)<15){j=14}else{f=g-15|0;i=15;while(1){if((i|0)>=24){k=0;break}if((c[8420+(i*24|0)>>2]|0)>>>0<f>>>0){i=i+1|0}else{k=i;break}}i=24;while(1){if((i|0)>=32){l=0;m=461;break}if((c[8420+(i*24|0)>>2]|0)>>>0<f>>>0){i=i+1|0}else{l=i;m=462;break}}if((m|0)==461){n=bb(a,b,e,k)|0;o=bb(a,b,e,l)|0;p=(o|0)<(n|0);q=p?l:k;return q|0}else if((m|0)==462){n=bb(a,b,e,k)|0;o=bb(a,b,e,l)|0;p=(o|0)<(n|0);q=p?l:k;return q|0}}while(1){r=j-1|0;if((j|0)==0){h=0;m=465;break}if((c[8408+(r*24|0)>>2]|0)>>>0>g>>>0){break}else{j=r}}if((m|0)==465){return h|0}m=bb(a,b,e,r)|0;if((j|0)==3){g=c[2121]|0;q=c[2125]|0;k=b;l=0;do{p=c[a+(k<<2)>>2]|0;n=c[a+(k+1<<2)>>2]|0;l=((p|0)!=0)+l+((n|0)!=0)+(d[q+(($(p,g)|0)+n)|0]|0)|0;k=k+2|0;}while(k>>>0<e>>>0);h=(l|0)>(m|0)?r:3;return h|0}else if((j|0)==6){l=c[2139]|0;k=c[2143]|0;g=b;q=0;do{n=c[a+(g<<2)>>2]|0;p=c[a+(g+1<<2)>>2]|0;q=((n|0)!=0)+q+((p|0)!=0)+(d[k+(($(n,l)|0)+p)|0]|0)|0;g=g+2|0;}while(g>>>0<e>>>0);h=(q|0)>(m|0)?r:6;return h|0}else if((j|0)==8){q=c[2151]|0;g=c[2155]|0;l=b;k=0;do{p=c[a+(l<<2)>>2]|0;n=c[a+(l+1<<2)>>2]|0;k=((p|0)!=0)+k+((n|0)!=0)+(d[g+(($(p,q)|0)+n)|0]|0)|0;l=l+2|0;}while(l>>>0<e>>>0);l=(k|0)>(m|0);q=l?r:8;g=l?m:k;k=c[2157]|0;l=c[2161]|0;n=b;p=0;do{o=c[a+(n<<2)>>2]|0;i=c[a+(n+1<<2)>>2]|0;p=((o|0)!=0)+p+((i|0)!=0)+(d[l+(($(o,k)|0)+i)|0]|0)|0;n=n+2|0;}while(n>>>0<e>>>0);return((p|0)>(g|0)?q:9)|0}else if((j|0)==11){q=c[2169]|0;g=c[2173]|0;p=b;n=0;do{k=c[a+(p<<2)>>2]|0;l=c[a+(p+1<<2)>>2]|0;n=((k|0)!=0)+n+((l|0)!=0)+(d[g+(($(k,q)|0)+l)|0]|0)|0;p=p+2|0;}while(p>>>0<e>>>0);p=(n|0)>(m|0);q=p?r:11;g=p?m:n;n=c[2175]|0;p=c[2179]|0;l=b;k=0;do{i=c[a+(l<<2)>>2]|0;o=c[a+(l+1<<2)>>2]|0;k=((i|0)!=0)+k+((o|0)!=0)+(d[p+(($(i,n)|0)+o)|0]|0)|0;l=l+2|0;}while(l>>>0<e>>>0);h=(k|0)>(g|0)?q:12;return h|0}else if((j|0)==14){j=c[2193]|0;q=c[2197]|0;g=b;b=0;do{k=c[a+(g<<2)>>2]|0;l=c[a+(g+1<<2)>>2]|0;b=((k|0)!=0)+b+((l|0)!=0)+(d[q+(($(k,j)|0)+l)|0]|0)|0;g=g+2|0;}while(g>>>0<e>>>0);h=(b|0)>(m|0)?r:15;return h|0}else{h=r;return h|0}return 0}function bf(a){a=a|0;var b=0,d=0.0,e=0,f=0.0;c[a+81252>>2]=-7945635;c[a+81284>>2]=2147468947;c[a+81248>>2]=-30491193;c[a+81280>>2]=2147267170;c[a+81244>>2]=-87972919;c[a+81276>>2]=2145680959;c[a+81240>>2]=-203096531;c[a+81272>>2]=2137858230;c[a+81236>>2]=-390655621;c[a+81268>>2]=2111652007;c[a+81232>>2]=-672972958;c[a+81264>>2]=2039311994;c[a+81228>>2]=-1013036688;c[a+81260>>2]=1893526520;c[a+81224>>2]=-1104871221;c[a+81256>>2]=1841452035;b=17;while(1){d=+(b<<1|1|0);e=35;while(1){f=+S(+((+(e|0)+.5)*.087266462599717));c[a+81288+(b*144|0)+(e<<2)>>2]=~~(f*+R(+(d*+((e<<1)+19|0)*.043633231299858195))*2147483647.0);if((e|0)==0){break}else{e=e-1|0}}if((b|0)==0){break}else{b=b-1|0}}return}function bg(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0;b=i;i=i+144|0;d=b|0;e=a+16|0;f=c[e>>2]|0;g=a|0;h=c[g>>2]|0;if((f|0)>0){j=0;k=h;l=f;while(1){f=j+1|0;if((k|0)==0){m=l;n=0}else{o=k;do{o=o-1|0;p=a+25288+(j*4608|0)+(o*2304|0)|0;q=1;do{r=a+11464+(o*6912|0)+(f*2304|0)+128+(q<<2)|0;c[r>>2]=-(c[r>>2]|0);r=a+11464+(o*6912|0)+(f*2304|0)+384+(q<<2)|0;c[r>>2]=-(c[r>>2]|0);r=a+11464+(o*6912|0)+(f*2304|0)+640+(q<<2)|0;c[r>>2]=-(c[r>>2]|0);r=a+11464+(o*6912|0)+(f*2304|0)+896+(q<<2)|0;c[r>>2]=-(c[r>>2]|0);r=a+11464+(o*6912|0)+(f*2304|0)+1152+(q<<2)|0;c[r>>2]=-(c[r>>2]|0);r=a+11464+(o*6912|0)+(f*2304|0)+1408+(q<<2)|0;c[r>>2]=-(c[r>>2]|0);r=a+11464+(o*6912|0)+(f*2304|0)+1664+(q<<2)|0;c[r>>2]=-(c[r>>2]|0);r=a+11464+(o*6912|0)+(f*2304|0)+1920+(q<<2)|0;c[r>>2]=-(c[r>>2]|0);r=a+11464+(o*6912|0)+(f*2304|0)+2176+(q<<2)|0;c[r>>2]=-(c[r>>2]|0);q=q+2|0;}while((q|0)<32);q=p;r=31;while(1){s=18;t=17;while(1){c[d+(t<<2)>>2]=c[a+11464+(o*6912|0)+(j*2304|0)+(t<<7)+(r<<2)>>2];c[d+(s+17<<2)>>2]=c[a+11464+(o*6912|0)+(f*2304|0)+(t<<7)+(r<<2)>>2];if((t|0)==0){u=17;break}else{s=t;t=t-1|0}}while(1){t=q+(r*72|0)+(u<<2)|0;c[t>>2]=0;s=0;v=35;while(1){w=c[d+(v<<2)>>2]|0;x=c[a+81288+(u*144|0)+(v<<2)>>2]|0;bO(x,(x|0)<0?-1:0,w,(w|0)<0?-1:0)|0;w=D+s|0;c[t>>2]=w;if((v|0)==0){break}else{s=w;v=v-1|0}}if((u|0)==0){break}else{u=u-1|0}}if((r|0)==0){y=31;z=30;break}else{r=r-1|0}}while(1){r=8;p=7;while(1){v=q+(z*72|0)+(18-r<<2)|0;s=c[v>>2]|0;t=s;w=(s|0)<0?-1:0;s=c[a+81256+(p<<2)>>2]|0;x=s;A=(s|0)<0?-1:0;s=bO(x,A,t,w)|0;B=s>>>31|D<<1;s=q+(y*72|0)+(p<<2)|0;C=c[s>>2]|0;E=C;F=(C|0)<0?-1:0;C=c[a+81224+(p<<2)>>2]|0;G=C;H=(C|0)<0?-1:0;C=bO(G,H,E,F)|0;I=(C>>>31|D<<1)+B|0;B=bO(E,F,x,A)|0;A=B>>>31|D<<1;B=bO(G,H,t,w)|0;c[v>>2]=I;c[s>>2]=A-(B>>>31|D<<1);if((p|0)==0){break}else{r=p;p=p-1|0}}if((z|0)==0){break}else{y=z;z=z-1|0}}}while((o|0)!=0);m=c[e>>2]|0;n=c[g>>2]|0}if((f|0)<(m|0)){j=f;k=n;l=m}else{J=n;break}}}else{J=h}if((J|0)==0){i=b;return}else{K=J}do{K=K-1|0;J=17;while(1){h=31;while(1){c[a+11464+(K*6912|0)+(J<<7)+(h<<2)>>2]=c[a+11464+(K*6912|0)+((c[e>>2]|0)*2304|0)+(J<<7)+(h<<2)>>2];if((h|0)==0){break}h=h-1|0}if((J|0)==0){break}else{J=J-1|0}}}while((K|0)!=0);i=b;return}function bh(a,b,d,f){a=a|0;b=b|0;d=d|0;f=f|0;var g=0,h=0,j=0,k=0,l=0,m=0,n=0,o=0;g=i;i=i+256|0;h=g|0;j=f+83880+(d<<2)|0;k=31;while(1){l=c[a>>2]|0;c[a>>2]=l+2;c[f+92080+(d<<11)+((c[j>>2]|0)+k<<2)>>2]=(e[l>>1]|0)<<16;if((k|0)>0){k=k-1|0}else{break}}k=511;a=c[j>>2]|0;while(1){l=c[f+92080+(d<<11)+((k+a&511)<<2)>>2]|0;m=c[f+100272+(k<<2)>>2]|0;bO(m,(m|0)<0?-1:0,l,(l|0)<0?-1:0)|0;c[f+96176+(d<<11)+(k<<2)>>2]=D;n=c[j>>2]|0;if((k|0)==0){break}else{k=k-1|0;a=n}}c[j>>2]=n+480&511;n=63;while(1){c[h+(n<<2)>>2]=(c[f+96176+(d<<11)+(n<<2)>>2]|0)+((c[f+96176+(d<<11)+(n+64<<2)>>2]|0)+((c[f+96176+(d<<11)+(n+128<<2)>>2]|0)+((c[f+96176+(d<<11)+(n+192<<2)>>2]|0)+((c[f+96176+(d<<11)+(n+256<<2)>>2]|0)+((c[f+96176+(d<<11)+(n+320<<2)>>2]|0)+((c[f+96176+(d<<11)+(n+384<<2)>>2]|0)+(c[f+96176+(d<<11)+(n+448<<2)>>2]|0)))))));if((n|0)==0){o=31;break}else{n=n-1|0}}while(1){n=b+(o<<2)|0;c[n>>2]=0;d=0;j=63;while(1){a=c[f+83888+(o<<8)+(j<<2)>>2]|0;k=c[h+(j<<2)>>2]|0;bO(k,(k|0)<0?-1:0,a,(a|0)<0?-1:0)|0;a=D+d|0;c[n>>2]=a;if((j|0)==0){break}else{d=a;j=j-1|0}}if((o|0)==0){break}else{o=o-1|0}}i=g;return}function bi(a){a=a|0;c[a+4>>2]=128;c[a+8>>2]=0;c[a+12>>2]=0;c[a+16>>2]=1;return}function bj(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0;d=0;while(1){if((d|0)>=9){e=-1;f=525;break}if((c[13320+(d<<2)>>2]|0)==(a|0)){break}else{d=d+1|0}}if((f|0)==525){return e|0}if((d|0)<0){e=-1;return e|0}if((d|0)<3){g=3}else{g=(d|0)<6?2:0}d=0;while(1){if((d|0)>=16){h=-1;break}if((c[13400+(d<<4)+(g<<2)>>2]|0)==(b|0)){h=d;break}else{d=d+1|0}}e=(h|0)<0?-1:g;return e|0}function bk(a){a=a|0;return(c[a+16>>2]|0)*576|0|0}function bl(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,i=0,j=0;d=(c[b+556>>2]|0)/(c[b>>2]|0)|0;e=(d|0)>4095?4095:d;f=c[b+34508>>2]|0;if((f|0)==0){g=e;return g|0}i=~~(+h[a>>3]*3.1- +(d|0));d=c[b+34504>>2]|0;if((i|0)>100){b=(d*6|0|0)/10|0;j=(b|0)<(i|0)?b:i}else{j=0}i=d-((f<<3|0)/10|0)|0;f=((i-j|0)>0?i:j)+e|0;g=(f|0)>4095?4095:f;return g|0}function bm(a,b){a=a|0;b=b|0;var d=0;d=b+34504|0;c[d>>2]=((c[b+556>>2]|0)/(c[b>>2]|0)|0)-(c[a>>2]|0)+(c[d>>2]|0);return}function bn(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,j=0,k=0.0,l=0.0,m=0;b=i;i=i+8|0;d=b|0;c[a+83884>>2]=0;e=511;while(1){c[a+94128+(e<<2)>>2]=0;if((e|0)==0){break}else{e=e-1|0}}c[a+83880>>2]=0;e=511;while(1){c[a+92080+(e<<2)>>2]=0;if((e|0)==0){f=31;break}else{e=e-1|0}}while(1){e=f<<1|1;g=64;j=63;while(1){k=+R(+(+($(17-g|0,e)|0)*.049087385212))*1.0e9;h[d>>3]=k;if(k<0.0){l=k+-.5;+av(+l,d|0)}else{l=k+.5;+av(+l,d|0)}c[a+83888+(f<<8)+(j<<2)>>2]=~~(+h[d>>3]*2.147483647);if((j|0)==0){break}else{g=j;j=j-1|0}}if((f|0)==0){m=511;break}else{f=f-1|0}}while(1){c[a+100272+(m<<2)>>2]=~~(+h[9224+(m<<3)>>3]*2147483647.0);if((m|0)==0){break}else{m=m-1|0}}i=b;return}function bo(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0.0,p=0.0;b=a+4|0;d=c[b>>2]|0;e=a+12|0;f=c[e>>2]|0;g=0;while(1){if((g|0)>=9){i=0;j=580;break}if((c[13320+(g<<2)>>2]|0)==(d|0)){break}else{g=g+1|0}}if((j|0)==580){return i|0}if((g|0)<0){i=0;return i|0}if((g|0)<3){k=3}else{k=(g|0)<6?2:0}g=0;while(1){if((g|0)>=16){i=0;j=576;break}if((c[13400+(g<<4)+(k<<2)>>2]|0)==(f|0)){break}else{g=g+1|0}}if((j|0)==576){return i|0}if((g|0)<0){i=0;return i|0}g=bw(1,102320)|0;f=g;if((g|0)==0){i=f;return i|0}bn(f);bf(f);bd(f);aS(f);a3(f);k=g;c[k>>2]=c[a>>2];d=c[b>>2]|0;c[g+4>>2]=d;b=g+8|0;c[g+20>>2]=c[a+8>>2];l=c[e>>2]|0;c[g+24>>2]=l;c[g+28>>2]=c[a+16>>2];c[g+88>>2]=c[a+20>>2];c[g+92>>2]=c[a+24>>2];c[g+34508>>2]=0;c[g+34504>>2]=0;c[g+12>>2]=1;c[g+76>>2]=0;c[g+80>>2]=0;c[g+84>>2]=0;c[g+40>>2]=8;a=0;while(1){if((a|0)>=9){j=562;break}if((c[13320+(a<<2)>>2]|0)==(d|0)){j=564;break}else{a=a+1|0}}do{if((j|0)==564){c[g+72>>2]=a;if((a|0)<3){m=3;break}m=(a|0)<6?2:0}else if((j|0)==562){c[g+72>>2]=-1;m=3}}while(0);c[b>>2]=m;b=0;while(1){if((b|0)>=16){n=-1;break}if((c[13400+(b<<4)+(m<<2)>>2]|0)==(l|0)){n=b;break}else{b=b+1|0}}c[g+68>>2]=n;n=c[13360+(m<<2)>>2]|0;m=g+16|0;c[m>>2]=n;o=+(n|0)*576.0/+(d|0)*+(l|0)*1.0e3*.125;l=~~o;c[g+64>>2]=l;p=o- +(l|0);h[g+48>>3]=p;h[g+56>>3]=-0.0-p;if(p==0.0){c[g+32>>2]=0}aU(g+96|0,4096);bC(g+144|0,0,408);l=(c[k>>2]|0)==1;if((c[m>>2]|0)==2){c[g+552>>2]=l?168:288;i=f;return i|0}else{c[g+552>>2]=l?104:168;i=f;return i|0}return 0}function bp(a,b,d){a=a|0;b=b|0;d=d|0;var e=0,f=0,g=0.0,i=0.0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0;c[a+2208>>2]=c[b>>2];e=a|0;f=c[e>>2]|0;if((f|0)==2){c[a+2212>>2]=c[b+4>>2]}g=+h[a+48>>3];do{if(g!=0.0){b=a+56|0;i=+h[b>>3];if(i>g+-1.0){h[b>>3]=i-g;c[a+32>>2]=0;j=0;break}else{h[b>>3]=1.0-g+i;c[a+32>>2]=1;j=1;break}}else{j=c[a+32>>2]|0}}while(0);b=j+(c[a+64>>2]|0)<<3;c[a+36>>2]=b;j=a+16|0;k=c[j>>2]|0;c[a+556>>2]=(b-(c[a+552>>2]|0)|0)/(k|0)|0;if((k|0)>0){l=1;m=k;n=f}else{bg(a);bc(a);a5(a);o=a+104|0;p=c[o>>2]|0;c[d>>2]=p;c[o>>2]=0;q=a+96|0;r=c[q>>2]|0;return r|0}while(1){if((n|0)==0){s=m}else{f=n;do{f=f-1|0;k=a+2208+(f<<2)|0;b=0;do{bh(k,a+11464+(f*6912|0)+(l*2304|0)+(b<<7)|0,f,a);b=b+1|0;}while((b|0)<18);}while((f|0)!=0);s=c[j>>2]|0}if((l|0)>=(s|0)){break}l=l+1|0;m=s;n=c[e>>2]|0}bg(a);bc(a);a5(a);o=a+104|0;p=c[o>>2]|0;c[d>>2]=p;c[o>>2]=0;q=a+96|0;r=c[q>>2]|0;return r|0}function bq(a,b){a=a|0;b=b|0;var d=0,e=0;d=a+96|0;aT(d,4);e=a+104|0;c[b>>2]=c[e>>2];c[e>>2]=0;return c[d>>2]|0}function br(a){a=a|0;a4(a);aX(a);aV(a+96|0);bv(a);return}function bs(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0;b=a|0;d=c[b>>2]|0;do{if((d|0)==2){if((c[a+556>>2]&1|0)==0){break}e=a+34504|0;c[e>>2]=(c[e>>2]|0)+1}}while(0);e=a+34504|0;f=c[e>>2]|0;g=f-(c[a+34508>>2]|0)|0;h=(g|0)<0?0:g;g=f-h|0;f=(g|0)%8|0;if((f|0)==0){i=h;j=g}else{i=h+f|0;j=g-f|0}c[e>>2]=j;if((i|0)==0){return}j=a+184|0;e=(c[j>>2]|0)+i|0;if(e>>>0<4095){c[j>>2]=e;return}e=a+16|0;j=c[e>>2]|0;if((j|0)>0){f=i;g=0;h=d;d=j;while(1){if((h|0)<1|(f|0)==0){k=f;l=h;m=d}else{j=f;n=0;while(1){o=a+184+(g*184|0)+(n*92|0)|0;p=c[o>>2]|0;q=4095-p|0;r=(q|0)<(j|0)?q:j;c[o>>2]=r+p;s=j-r|0;p=n+1|0;t=c[b>>2]|0;if((p|0)>=(t|0)|(j|0)==(r|0)){break}else{j=s;n=p}}k=s;l=t;m=c[e>>2]|0}n=g+1|0;if((n|0)<(m|0)){f=k;g=n;h=l;d=m}else{u=k;break}}}else{u=i}c[a+148>>2]=u;return}function bt(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+32|0;g=f|0;c[g>>2]=a;c[g+4>>2]=b;bi(g+8|0);c[g+8>>2]=d;c[g+12>>2]=e;e=bo(g)|0;i=f;return e|0}function bu(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0,P=0,Q=0,R=0,S=0,T=0,U=0,V=0,W=0,X=0,Y=0,Z=0,_=0,$=0,aa=0,ab=0,ac=0,ad=0,ae=0,af=0,ag=0,ah=0,ai=0,aj=0,ak=0,al=0,an=0,ao=0,aq=0,ar=0,as=0,av=0,ax=0,ay=0,az=0,aA=0,aB=0,aC=0,aD=0,aE=0,aF=0,aG=0,aH=0,aI=0,aJ=0,aK=0,aL=0;do{if(a>>>0<245){if(a>>>0<11){b=16}else{b=a+11&-8}d=b>>>3;e=c[3420]|0;f=e>>>(d>>>0);if((f&3|0)!=0){g=(f&1^1)+d|0;h=g<<1;i=13720+(h<<2)|0;j=13720+(h+2<<2)|0;h=c[j>>2]|0;k=h+8|0;l=c[k>>2]|0;do{if((i|0)==(l|0)){c[3420]=e&~(1<<g)}else{if(l>>>0<(c[3424]|0)>>>0){at();return 0}m=l+12|0;if((c[m>>2]|0)==(h|0)){c[m>>2]=i;c[j>>2]=l;break}else{at();return 0}}}while(0);l=g<<3;c[h+4>>2]=l|3;j=h+(l|4)|0;c[j>>2]=c[j>>2]|1;n=k;return n|0}if(b>>>0<=(c[3422]|0)>>>0){o=b;break}if((f|0)!=0){j=2<<d;l=f<<d&(j|-j);j=(l&-l)-1|0;l=j>>>12&16;i=j>>>(l>>>0);j=i>>>5&8;m=i>>>(j>>>0);i=m>>>2&4;p=m>>>(i>>>0);m=p>>>1&2;q=p>>>(m>>>0);p=q>>>1&1;r=(j|l|i|m|p)+(q>>>(p>>>0))|0;p=r<<1;q=13720+(p<<2)|0;m=13720+(p+2<<2)|0;p=c[m>>2]|0;i=p+8|0;l=c[i>>2]|0;do{if((q|0)==(l|0)){c[3420]=e&~(1<<r)}else{if(l>>>0<(c[3424]|0)>>>0){at();return 0}j=l+12|0;if((c[j>>2]|0)==(p|0)){c[j>>2]=q;c[m>>2]=l;break}else{at();return 0}}}while(0);l=r<<3;m=l-b|0;c[p+4>>2]=b|3;q=p;e=q+b|0;c[q+(b|4)>>2]=m|1;c[q+l>>2]=m;l=c[3422]|0;if((l|0)!=0){q=c[3425]|0;d=l>>>3;l=d<<1;f=13720+(l<<2)|0;k=c[3420]|0;h=1<<d;do{if((k&h|0)==0){c[3420]=k|h;s=f;t=13720+(l+2<<2)|0}else{d=13720+(l+2<<2)|0;g=c[d>>2]|0;if(g>>>0>=(c[3424]|0)>>>0){s=g;t=d;break}at();return 0}}while(0);c[t>>2]=q;c[s+12>>2]=q;c[q+8>>2]=s;c[q+12>>2]=f}c[3422]=m;c[3425]=e;n=i;return n|0}l=c[3421]|0;if((l|0)==0){o=b;break}h=(l&-l)-1|0;l=h>>>12&16;k=h>>>(l>>>0);h=k>>>5&8;p=k>>>(h>>>0);k=p>>>2&4;r=p>>>(k>>>0);p=r>>>1&2;d=r>>>(p>>>0);r=d>>>1&1;g=c[13984+((h|l|k|p|r)+(d>>>(r>>>0))<<2)>>2]|0;r=g;d=g;p=(c[g+4>>2]&-8)-b|0;while(1){g=c[r+16>>2]|0;if((g|0)==0){k=c[r+20>>2]|0;if((k|0)==0){break}else{u=k}}else{u=g}g=(c[u+4>>2]&-8)-b|0;k=g>>>0<p>>>0;r=u;d=k?u:d;p=k?g:p}r=d;i=c[3424]|0;if(r>>>0<i>>>0){at();return 0}e=r+b|0;m=e;if(r>>>0>=e>>>0){at();return 0}e=c[d+24>>2]|0;f=c[d+12>>2]|0;do{if((f|0)==(d|0)){q=d+20|0;g=c[q>>2]|0;if((g|0)==0){k=d+16|0;l=c[k>>2]|0;if((l|0)==0){v=0;break}else{w=l;x=k}}else{w=g;x=q}while(1){q=w+20|0;g=c[q>>2]|0;if((g|0)!=0){w=g;x=q;continue}q=w+16|0;g=c[q>>2]|0;if((g|0)==0){break}else{w=g;x=q}}if(x>>>0<i>>>0){at();return 0}else{c[x>>2]=0;v=w;break}}else{q=c[d+8>>2]|0;if(q>>>0<i>>>0){at();return 0}g=q+12|0;if((c[g>>2]|0)!=(d|0)){at();return 0}k=f+8|0;if((c[k>>2]|0)==(d|0)){c[g>>2]=f;c[k>>2]=q;v=f;break}else{at();return 0}}}while(0);L954:do{if((e|0)!=0){f=d+28|0;i=13984+(c[f>>2]<<2)|0;do{if((d|0)==(c[i>>2]|0)){c[i>>2]=v;if((v|0)!=0){break}c[3421]=c[3421]&~(1<<c[f>>2]);break L954}else{if(e>>>0<(c[3424]|0)>>>0){at();return 0}q=e+16|0;if((c[q>>2]|0)==(d|0)){c[q>>2]=v}else{c[e+20>>2]=v}if((v|0)==0){break L954}}}while(0);if(v>>>0<(c[3424]|0)>>>0){at();return 0}c[v+24>>2]=e;f=c[d+16>>2]|0;do{if((f|0)!=0){if(f>>>0<(c[3424]|0)>>>0){at();return 0}else{c[v+16>>2]=f;c[f+24>>2]=v;break}}}while(0);f=c[d+20>>2]|0;if((f|0)==0){break}if(f>>>0<(c[3424]|0)>>>0){at();return 0}else{c[v+20>>2]=f;c[f+24>>2]=v;break}}}while(0);if(p>>>0<16){e=p+b|0;c[d+4>>2]=e|3;f=r+(e+4)|0;c[f>>2]=c[f>>2]|1}else{c[d+4>>2]=b|3;c[r+(b|4)>>2]=p|1;c[r+(p+b)>>2]=p;f=c[3422]|0;if((f|0)!=0){e=c[3425]|0;i=f>>>3;f=i<<1;q=13720+(f<<2)|0;k=c[3420]|0;g=1<<i;do{if((k&g|0)==0){c[3420]=k|g;y=q;z=13720+(f+2<<2)|0}else{i=13720+(f+2<<2)|0;l=c[i>>2]|0;if(l>>>0>=(c[3424]|0)>>>0){y=l;z=i;break}at();return 0}}while(0);c[z>>2]=e;c[y+12>>2]=e;c[e+8>>2]=y;c[e+12>>2]=q}c[3422]=p;c[3425]=m}f=d+8|0;if((f|0)==0){o=b;break}else{n=f}return n|0}else{if(a>>>0>4294967231){o=-1;break}f=a+11|0;g=f&-8;k=c[3421]|0;if((k|0)==0){o=g;break}r=-g|0;i=f>>>8;do{if((i|0)==0){A=0}else{if(g>>>0>16777215){A=31;break}f=(i+1048320|0)>>>16&8;l=i<<f;h=(l+520192|0)>>>16&4;j=l<<h;l=(j+245760|0)>>>16&2;B=14-(h|f|l)+(j<<l>>>15)|0;A=g>>>((B+7|0)>>>0)&1|B<<1}}while(0);i=c[13984+(A<<2)>>2]|0;L1002:do{if((i|0)==0){C=0;D=r;E=0}else{if((A|0)==31){F=0}else{F=25-(A>>>1)|0}d=0;m=r;p=i;q=g<<F;e=0;while(1){B=c[p+4>>2]&-8;l=B-g|0;if(l>>>0<m>>>0){if((B|0)==(g|0)){C=p;D=l;E=p;break L1002}else{G=p;H=l}}else{G=d;H=m}l=c[p+20>>2]|0;B=c[p+16+(q>>>31<<2)>>2]|0;j=(l|0)==0|(l|0)==(B|0)?e:l;if((B|0)==0){C=G;D=H;E=j;break}else{d=G;m=H;p=B;q=q<<1;e=j}}}}while(0);if((E|0)==0&(C|0)==0){i=2<<A;r=k&(i|-i);if((r|0)==0){o=g;break}i=(r&-r)-1|0;r=i>>>12&16;e=i>>>(r>>>0);i=e>>>5&8;q=e>>>(i>>>0);e=q>>>2&4;p=q>>>(e>>>0);q=p>>>1&2;m=p>>>(q>>>0);p=m>>>1&1;I=c[13984+((i|r|e|q|p)+(m>>>(p>>>0))<<2)>>2]|0}else{I=E}if((I|0)==0){J=D;K=C}else{p=I;m=D;q=C;while(1){e=(c[p+4>>2]&-8)-g|0;r=e>>>0<m>>>0;i=r?e:m;e=r?p:q;r=c[p+16>>2]|0;if((r|0)!=0){p=r;m=i;q=e;continue}r=c[p+20>>2]|0;if((r|0)==0){J=i;K=e;break}else{p=r;m=i;q=e}}}if((K|0)==0){o=g;break}if(J>>>0>=((c[3422]|0)-g|0)>>>0){o=g;break}q=K;m=c[3424]|0;if(q>>>0<m>>>0){at();return 0}p=q+g|0;k=p;if(q>>>0>=p>>>0){at();return 0}e=c[K+24>>2]|0;i=c[K+12>>2]|0;do{if((i|0)==(K|0)){r=K+20|0;d=c[r>>2]|0;if((d|0)==0){j=K+16|0;B=c[j>>2]|0;if((B|0)==0){L=0;break}else{M=B;N=j}}else{M=d;N=r}while(1){r=M+20|0;d=c[r>>2]|0;if((d|0)!=0){M=d;N=r;continue}r=M+16|0;d=c[r>>2]|0;if((d|0)==0){break}else{M=d;N=r}}if(N>>>0<m>>>0){at();return 0}else{c[N>>2]=0;L=M;break}}else{r=c[K+8>>2]|0;if(r>>>0<m>>>0){at();return 0}d=r+12|0;if((c[d>>2]|0)!=(K|0)){at();return 0}j=i+8|0;if((c[j>>2]|0)==(K|0)){c[d>>2]=i;c[j>>2]=r;L=i;break}else{at();return 0}}}while(0);L1052:do{if((e|0)!=0){i=K+28|0;m=13984+(c[i>>2]<<2)|0;do{if((K|0)==(c[m>>2]|0)){c[m>>2]=L;if((L|0)!=0){break}c[3421]=c[3421]&~(1<<c[i>>2]);break L1052}else{if(e>>>0<(c[3424]|0)>>>0){at();return 0}r=e+16|0;if((c[r>>2]|0)==(K|0)){c[r>>2]=L}else{c[e+20>>2]=L}if((L|0)==0){break L1052}}}while(0);if(L>>>0<(c[3424]|0)>>>0){at();return 0}c[L+24>>2]=e;i=c[K+16>>2]|0;do{if((i|0)!=0){if(i>>>0<(c[3424]|0)>>>0){at();return 0}else{c[L+16>>2]=i;c[i+24>>2]=L;break}}}while(0);i=c[K+20>>2]|0;if((i|0)==0){break}if(i>>>0<(c[3424]|0)>>>0){at();return 0}else{c[L+20>>2]=i;c[i+24>>2]=L;break}}}while(0);do{if(J>>>0<16){e=J+g|0;c[K+4>>2]=e|3;i=q+(e+4)|0;c[i>>2]=c[i>>2]|1}else{c[K+4>>2]=g|3;c[q+(g|4)>>2]=J|1;c[q+(J+g)>>2]=J;i=J>>>3;if(J>>>0<256){e=i<<1;m=13720+(e<<2)|0;r=c[3420]|0;j=1<<i;do{if((r&j|0)==0){c[3420]=r|j;O=m;P=13720+(e+2<<2)|0}else{i=13720+(e+2<<2)|0;d=c[i>>2]|0;if(d>>>0>=(c[3424]|0)>>>0){O=d;P=i;break}at();return 0}}while(0);c[P>>2]=k;c[O+12>>2]=k;c[q+(g+8)>>2]=O;c[q+(g+12)>>2]=m;break}e=p;j=J>>>8;do{if((j|0)==0){Q=0}else{if(J>>>0>16777215){Q=31;break}r=(j+1048320|0)>>>16&8;i=j<<r;d=(i+520192|0)>>>16&4;B=i<<d;i=(B+245760|0)>>>16&2;l=14-(d|r|i)+(B<<i>>>15)|0;Q=J>>>((l+7|0)>>>0)&1|l<<1}}while(0);j=13984+(Q<<2)|0;c[q+(g+28)>>2]=Q;c[q+(g+20)>>2]=0;c[q+(g+16)>>2]=0;m=c[3421]|0;l=1<<Q;if((m&l|0)==0){c[3421]=m|l;c[j>>2]=e;c[q+(g+24)>>2]=j;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}if((Q|0)==31){R=0}else{R=25-(Q>>>1)|0}l=J<<R;m=c[j>>2]|0;while(1){if((c[m+4>>2]&-8|0)==(J|0)){break}S=m+16+(l>>>31<<2)|0;j=c[S>>2]|0;if((j|0)==0){T=771;break}else{l=l<<1;m=j}}if((T|0)==771){if(S>>>0<(c[3424]|0)>>>0){at();return 0}else{c[S>>2]=e;c[q+(g+24)>>2]=m;c[q+(g+12)>>2]=e;c[q+(g+8)>>2]=e;break}}l=m+8|0;j=c[l>>2]|0;i=c[3424]|0;if(m>>>0<i>>>0){at();return 0}if(j>>>0<i>>>0){at();return 0}else{c[j+12>>2]=e;c[l>>2]=e;c[q+(g+8)>>2]=j;c[q+(g+12)>>2]=m;c[q+(g+24)>>2]=0;break}}}while(0);q=K+8|0;if((q|0)==0){o=g;break}else{n=q}return n|0}}while(0);K=c[3422]|0;if(o>>>0<=K>>>0){S=K-o|0;J=c[3425]|0;if(S>>>0>15){R=J;c[3425]=R+o;c[3422]=S;c[R+(o+4)>>2]=S|1;c[R+K>>2]=S;c[J+4>>2]=o|3}else{c[3422]=0;c[3425]=0;c[J+4>>2]=K|3;S=J+(K+4)|0;c[S>>2]=c[S>>2]|1}n=J+8|0;return n|0}J=c[3423]|0;if(o>>>0<J>>>0){S=J-o|0;c[3423]=S;J=c[3426]|0;K=J;c[3426]=K+o;c[K+(o+4)>>2]=S|1;c[J+4>>2]=o|3;n=J+8|0;return n|0}do{if((c[3414]|0)==0){J=am(8)|0;if((J-1&J|0)==0){c[3416]=J;c[3415]=J;c[3417]=-1;c[3418]=2097152;c[3419]=0;c[3531]=0;c[3414]=(aw(0)|0)&-16^1431655768;break}else{at();return 0}}}while(0);J=o+48|0;S=c[3416]|0;K=o+47|0;R=S+K|0;Q=-S|0;S=R&Q;if(S>>>0<=o>>>0){n=0;return n|0}O=c[3530]|0;do{if((O|0)!=0){P=c[3528]|0;L=P+S|0;if(L>>>0<=P>>>0|L>>>0>O>>>0){n=0}else{break}return n|0}}while(0);L1144:do{if((c[3531]&4|0)==0){O=c[3426]|0;L1146:do{if((O|0)==0){T=801}else{L=O;P=14128;while(1){U=P|0;M=c[U>>2]|0;if(M>>>0<=L>>>0){V=P+4|0;if((M+(c[V>>2]|0)|0)>>>0>L>>>0){break}}M=c[P+8>>2]|0;if((M|0)==0){T=801;break L1146}else{P=M}}if((P|0)==0){T=801;break}L=R-(c[3423]|0)&Q;if(L>>>0>=2147483647){W=0;break}m=au(L|0)|0;e=(m|0)==((c[U>>2]|0)+(c[V>>2]|0)|0);X=e?m:-1;Y=e?L:0;Z=m;_=L;T=810}}while(0);do{if((T|0)==801){O=au(0)|0;if((O|0)==-1){W=0;break}g=O;L=c[3415]|0;m=L-1|0;if((m&g|0)==0){$=S}else{$=S-g+(m+g&-L)|0}L=c[3528]|0;g=L+$|0;if(!($>>>0>o>>>0&$>>>0<2147483647)){W=0;break}m=c[3530]|0;if((m|0)!=0){if(g>>>0<=L>>>0|g>>>0>m>>>0){W=0;break}}m=au($|0)|0;g=(m|0)==(O|0);X=g?O:-1;Y=g?$:0;Z=m;_=$;T=810}}while(0);L1166:do{if((T|0)==810){m=-_|0;if((X|0)!=-1){aa=Y;ab=X;T=821;break L1144}do{if((Z|0)!=-1&_>>>0<2147483647&_>>>0<J>>>0){g=c[3416]|0;O=K-_+g&-g;if(O>>>0>=2147483647){ac=_;break}if((au(O|0)|0)==-1){au(m|0)|0;W=Y;break L1166}else{ac=O+_|0;break}}else{ac=_}}while(0);if((Z|0)==-1){W=Y}else{aa=ac;ab=Z;T=821;break L1144}}}while(0);c[3531]=c[3531]|4;ad=W;T=818}else{ad=0;T=818}}while(0);do{if((T|0)==818){if(S>>>0>=2147483647){break}W=au(S|0)|0;Z=au(0)|0;if(!((Z|0)!=-1&(W|0)!=-1&W>>>0<Z>>>0)){break}ac=Z-W|0;Z=ac>>>0>(o+40|0)>>>0;Y=Z?W:-1;if((Y|0)!=-1){aa=Z?ac:ad;ab=Y;T=821}}}while(0);do{if((T|0)==821){ad=(c[3528]|0)+aa|0;c[3528]=ad;if(ad>>>0>(c[3529]|0)>>>0){c[3529]=ad}ad=c[3426]|0;L1186:do{if((ad|0)==0){S=c[3424]|0;if((S|0)==0|ab>>>0<S>>>0){c[3424]=ab}c[3532]=ab;c[3533]=aa;c[3535]=0;c[3429]=c[3414];c[3428]=-1;S=0;do{Y=S<<1;ac=13720+(Y<<2)|0;c[13720+(Y+3<<2)>>2]=ac;c[13720+(Y+2<<2)>>2]=ac;S=S+1|0;}while(S>>>0<32);S=ab+8|0;if((S&7|0)==0){ae=0}else{ae=-S&7}S=aa-40-ae|0;c[3426]=ab+ae;c[3423]=S;c[ab+(ae+4)>>2]=S|1;c[ab+(aa-36)>>2]=40;c[3427]=c[3418]}else{S=14128;while(1){af=c[S>>2]|0;ag=S+4|0;ah=c[ag>>2]|0;if((ab|0)==(af+ah|0)){T=833;break}ac=c[S+8>>2]|0;if((ac|0)==0){break}else{S=ac}}do{if((T|0)==833){if((c[S+12>>2]&8|0)!=0){break}ac=ad;if(!(ac>>>0>=af>>>0&ac>>>0<ab>>>0)){break}c[ag>>2]=ah+aa;ac=c[3426]|0;Y=(c[3423]|0)+aa|0;Z=ac;W=ac+8|0;if((W&7|0)==0){ai=0}else{ai=-W&7}W=Y-ai|0;c[3426]=Z+ai;c[3423]=W;c[Z+(ai+4)>>2]=W|1;c[Z+(Y+4)>>2]=40;c[3427]=c[3418];break L1186}}while(0);if(ab>>>0<(c[3424]|0)>>>0){c[3424]=ab}S=ab+aa|0;Y=14128;while(1){aj=Y|0;if((c[aj>>2]|0)==(S|0)){T=843;break}Z=c[Y+8>>2]|0;if((Z|0)==0){break}else{Y=Z}}do{if((T|0)==843){if((c[Y+12>>2]&8|0)!=0){break}c[aj>>2]=ab;S=Y+4|0;c[S>>2]=(c[S>>2]|0)+aa;S=ab+8|0;if((S&7|0)==0){ak=0}else{ak=-S&7}S=ab+(aa+8)|0;if((S&7|0)==0){al=0}else{al=-S&7}S=ab+(al+aa)|0;Z=S;W=ak+o|0;ac=ab+W|0;_=ac;K=S-(ab+ak)-o|0;c[ab+(ak+4)>>2]=o|3;do{if((Z|0)==(c[3426]|0)){J=(c[3423]|0)+K|0;c[3423]=J;c[3426]=_;c[ab+(W+4)>>2]=J|1}else{if((Z|0)==(c[3425]|0)){J=(c[3422]|0)+K|0;c[3422]=J;c[3425]=_;c[ab+(W+4)>>2]=J|1;c[ab+(J+W)>>2]=J;break}J=aa+4|0;X=c[ab+(J+al)>>2]|0;if((X&3|0)==1){$=X&-8;V=X>>>3;L1231:do{if(X>>>0<256){U=c[ab+((al|8)+aa)>>2]|0;Q=c[ab+(aa+12+al)>>2]|0;R=13720+(V<<1<<2)|0;do{if((U|0)!=(R|0)){if(U>>>0<(c[3424]|0)>>>0){at();return 0}if((c[U+12>>2]|0)==(Z|0)){break}at();return 0}}while(0);if((Q|0)==(U|0)){c[3420]=c[3420]&~(1<<V);break}do{if((Q|0)==(R|0)){an=Q+8|0}else{if(Q>>>0<(c[3424]|0)>>>0){at();return 0}m=Q+8|0;if((c[m>>2]|0)==(Z|0)){an=m;break}at();return 0}}while(0);c[U+12>>2]=Q;c[an>>2]=U}else{R=S;m=c[ab+((al|24)+aa)>>2]|0;P=c[ab+(aa+12+al)>>2]|0;do{if((P|0)==(R|0)){O=al|16;g=ab+(J+O)|0;L=c[g>>2]|0;if((L|0)==0){e=ab+(O+aa)|0;O=c[e>>2]|0;if((O|0)==0){ao=0;break}else{aq=O;ar=e}}else{aq=L;ar=g}while(1){g=aq+20|0;L=c[g>>2]|0;if((L|0)!=0){aq=L;ar=g;continue}g=aq+16|0;L=c[g>>2]|0;if((L|0)==0){break}else{aq=L;ar=g}}if(ar>>>0<(c[3424]|0)>>>0){at();return 0}else{c[ar>>2]=0;ao=aq;break}}else{g=c[ab+((al|8)+aa)>>2]|0;if(g>>>0<(c[3424]|0)>>>0){at();return 0}L=g+12|0;if((c[L>>2]|0)!=(R|0)){at();return 0}e=P+8|0;if((c[e>>2]|0)==(R|0)){c[L>>2]=P;c[e>>2]=g;ao=P;break}else{at();return 0}}}while(0);if((m|0)==0){break}P=ab+(aa+28+al)|0;U=13984+(c[P>>2]<<2)|0;do{if((R|0)==(c[U>>2]|0)){c[U>>2]=ao;if((ao|0)!=0){break}c[3421]=c[3421]&~(1<<c[P>>2]);break L1231}else{if(m>>>0<(c[3424]|0)>>>0){at();return 0}Q=m+16|0;if((c[Q>>2]|0)==(R|0)){c[Q>>2]=ao}else{c[m+20>>2]=ao}if((ao|0)==0){break L1231}}}while(0);if(ao>>>0<(c[3424]|0)>>>0){at();return 0}c[ao+24>>2]=m;R=al|16;P=c[ab+(R+aa)>>2]|0;do{if((P|0)!=0){if(P>>>0<(c[3424]|0)>>>0){at();return 0}else{c[ao+16>>2]=P;c[P+24>>2]=ao;break}}}while(0);P=c[ab+(J+R)>>2]|0;if((P|0)==0){break}if(P>>>0<(c[3424]|0)>>>0){at();return 0}else{c[ao+20>>2]=P;c[P+24>>2]=ao;break}}}while(0);as=ab+(($|al)+aa)|0;av=$+K|0}else{as=Z;av=K}J=as+4|0;c[J>>2]=c[J>>2]&-2;c[ab+(W+4)>>2]=av|1;c[ab+(av+W)>>2]=av;J=av>>>3;if(av>>>0<256){V=J<<1;X=13720+(V<<2)|0;P=c[3420]|0;m=1<<J;do{if((P&m|0)==0){c[3420]=P|m;ax=X;ay=13720+(V+2<<2)|0}else{J=13720+(V+2<<2)|0;U=c[J>>2]|0;if(U>>>0>=(c[3424]|0)>>>0){ax=U;ay=J;break}at();return 0}}while(0);c[ay>>2]=_;c[ax+12>>2]=_;c[ab+(W+8)>>2]=ax;c[ab+(W+12)>>2]=X;break}V=ac;m=av>>>8;do{if((m|0)==0){az=0}else{if(av>>>0>16777215){az=31;break}P=(m+1048320|0)>>>16&8;$=m<<P;J=($+520192|0)>>>16&4;U=$<<J;$=(U+245760|0)>>>16&2;Q=14-(J|P|$)+(U<<$>>>15)|0;az=av>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=13984+(az<<2)|0;c[ab+(W+28)>>2]=az;c[ab+(W+20)>>2]=0;c[ab+(W+16)>>2]=0;X=c[3421]|0;Q=1<<az;if((X&Q|0)==0){c[3421]=X|Q;c[m>>2]=V;c[ab+(W+24)>>2]=m;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}if((az|0)==31){aA=0}else{aA=25-(az>>>1)|0}Q=av<<aA;X=c[m>>2]|0;while(1){if((c[X+4>>2]&-8|0)==(av|0)){break}aB=X+16+(Q>>>31<<2)|0;m=c[aB>>2]|0;if((m|0)==0){T=916;break}else{Q=Q<<1;X=m}}if((T|0)==916){if(aB>>>0<(c[3424]|0)>>>0){at();return 0}else{c[aB>>2]=V;c[ab+(W+24)>>2]=X;c[ab+(W+12)>>2]=V;c[ab+(W+8)>>2]=V;break}}Q=X+8|0;m=c[Q>>2]|0;$=c[3424]|0;if(X>>>0<$>>>0){at();return 0}if(m>>>0<$>>>0){at();return 0}else{c[m+12>>2]=V;c[Q>>2]=V;c[ab+(W+8)>>2]=m;c[ab+(W+12)>>2]=X;c[ab+(W+24)>>2]=0;break}}}while(0);n=ab+(ak|8)|0;return n|0}}while(0);Y=ad;W=14128;while(1){aC=c[W>>2]|0;if(aC>>>0<=Y>>>0){aD=c[W+4>>2]|0;aE=aC+aD|0;if(aE>>>0>Y>>>0){break}}W=c[W+8>>2]|0}W=aC+(aD-39)|0;if((W&7|0)==0){aF=0}else{aF=-W&7}W=aC+(aD-47+aF)|0;ac=W>>>0<(ad+16|0)>>>0?Y:W;W=ac+8|0;_=ab+8|0;if((_&7|0)==0){aG=0}else{aG=-_&7}_=aa-40-aG|0;c[3426]=ab+aG;c[3423]=_;c[ab+(aG+4)>>2]=_|1;c[ab+(aa-36)>>2]=40;c[3427]=c[3418];c[ac+4>>2]=27;c[W>>2]=c[3532];c[W+4>>2]=c[14132>>2];c[W+8>>2]=c[14136>>2];c[W+12>>2]=c[14140>>2];c[3532]=ab;c[3533]=aa;c[3535]=0;c[3534]=W;W=ac+28|0;c[W>>2]=7;if((ac+32|0)>>>0<aE>>>0){_=W;while(1){W=_+4|0;c[W>>2]=7;if((_+8|0)>>>0<aE>>>0){_=W}else{break}}}if((ac|0)==(Y|0)){break}_=ac-ad|0;W=Y+(_+4)|0;c[W>>2]=c[W>>2]&-2;c[ad+4>>2]=_|1;c[Y+_>>2]=_;W=_>>>3;if(_>>>0<256){K=W<<1;Z=13720+(K<<2)|0;S=c[3420]|0;m=1<<W;do{if((S&m|0)==0){c[3420]=S|m;aH=Z;aI=13720+(K+2<<2)|0}else{W=13720+(K+2<<2)|0;Q=c[W>>2]|0;if(Q>>>0>=(c[3424]|0)>>>0){aH=Q;aI=W;break}at();return 0}}while(0);c[aI>>2]=ad;c[aH+12>>2]=ad;c[ad+8>>2]=aH;c[ad+12>>2]=Z;break}K=ad;m=_>>>8;do{if((m|0)==0){aJ=0}else{if(_>>>0>16777215){aJ=31;break}S=(m+1048320|0)>>>16&8;Y=m<<S;ac=(Y+520192|0)>>>16&4;W=Y<<ac;Y=(W+245760|0)>>>16&2;Q=14-(ac|S|Y)+(W<<Y>>>15)|0;aJ=_>>>((Q+7|0)>>>0)&1|Q<<1}}while(0);m=13984+(aJ<<2)|0;c[ad+28>>2]=aJ;c[ad+20>>2]=0;c[ad+16>>2]=0;Z=c[3421]|0;Q=1<<aJ;if((Z&Q|0)==0){c[3421]=Z|Q;c[m>>2]=K;c[ad+24>>2]=m;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}if((aJ|0)==31){aK=0}else{aK=25-(aJ>>>1)|0}Q=_<<aK;Z=c[m>>2]|0;while(1){if((c[Z+4>>2]&-8|0)==(_|0)){break}aL=Z+16+(Q>>>31<<2)|0;m=c[aL>>2]|0;if((m|0)==0){T=951;break}else{Q=Q<<1;Z=m}}if((T|0)==951){if(aL>>>0<(c[3424]|0)>>>0){at();return 0}else{c[aL>>2]=K;c[ad+24>>2]=Z;c[ad+12>>2]=ad;c[ad+8>>2]=ad;break}}Q=Z+8|0;_=c[Q>>2]|0;m=c[3424]|0;if(Z>>>0<m>>>0){at();return 0}if(_>>>0<m>>>0){at();return 0}else{c[_+12>>2]=K;c[Q>>2]=K;c[ad+8>>2]=_;c[ad+12>>2]=Z;c[ad+24>>2]=0;break}}}while(0);ad=c[3423]|0;if(ad>>>0<=o>>>0){break}_=ad-o|0;c[3423]=_;ad=c[3426]|0;Q=ad;c[3426]=Q+o;c[Q+(o+4)>>2]=_|1;c[ad+4>>2]=o|3;n=ad+8|0;return n|0}}while(0);c[(ap()|0)>>2]=12;n=0;return n|0}function bv(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0,N=0,O=0;if((a|0)==0){return}b=a-8|0;d=b;e=c[3424]|0;if(b>>>0<e>>>0){at()}f=c[a-4>>2]|0;g=f&3;if((g|0)==1){at()}h=f&-8;i=a+(h-8)|0;j=i;L1403:do{if((f&1|0)==0){k=c[b>>2]|0;if((g|0)==0){return}l=-8-k|0;m=a+l|0;n=m;o=k+h|0;if(m>>>0<e>>>0){at()}if((n|0)==(c[3425]|0)){p=a+(h-4)|0;if((c[p>>2]&3|0)!=3){q=n;r=o;break}c[3422]=o;c[p>>2]=c[p>>2]&-2;c[a+(l+4)>>2]=o|1;c[i>>2]=o;return}p=k>>>3;if(k>>>0<256){k=c[a+(l+8)>>2]|0;s=c[a+(l+12)>>2]|0;t=13720+(p<<1<<2)|0;do{if((k|0)!=(t|0)){if(k>>>0<e>>>0){at()}if((c[k+12>>2]|0)==(n|0)){break}at()}}while(0);if((s|0)==(k|0)){c[3420]=c[3420]&~(1<<p);q=n;r=o;break}do{if((s|0)==(t|0)){u=s+8|0}else{if(s>>>0<e>>>0){at()}v=s+8|0;if((c[v>>2]|0)==(n|0)){u=v;break}at()}}while(0);c[k+12>>2]=s;c[u>>2]=k;q=n;r=o;break}t=m;p=c[a+(l+24)>>2]|0;v=c[a+(l+12)>>2]|0;do{if((v|0)==(t|0)){w=a+(l+20)|0;x=c[w>>2]|0;if((x|0)==0){y=a+(l+16)|0;z=c[y>>2]|0;if((z|0)==0){A=0;break}else{B=z;C=y}}else{B=x;C=w}while(1){w=B+20|0;x=c[w>>2]|0;if((x|0)!=0){B=x;C=w;continue}w=B+16|0;x=c[w>>2]|0;if((x|0)==0){break}else{B=x;C=w}}if(C>>>0<e>>>0){at()}else{c[C>>2]=0;A=B;break}}else{w=c[a+(l+8)>>2]|0;if(w>>>0<e>>>0){at()}x=w+12|0;if((c[x>>2]|0)!=(t|0)){at()}y=v+8|0;if((c[y>>2]|0)==(t|0)){c[x>>2]=v;c[y>>2]=w;A=v;break}else{at()}}}while(0);if((p|0)==0){q=n;r=o;break}v=a+(l+28)|0;m=13984+(c[v>>2]<<2)|0;do{if((t|0)==(c[m>>2]|0)){c[m>>2]=A;if((A|0)!=0){break}c[3421]=c[3421]&~(1<<c[v>>2]);q=n;r=o;break L1403}else{if(p>>>0<(c[3424]|0)>>>0){at()}k=p+16|0;if((c[k>>2]|0)==(t|0)){c[k>>2]=A}else{c[p+20>>2]=A}if((A|0)==0){q=n;r=o;break L1403}}}while(0);if(A>>>0<(c[3424]|0)>>>0){at()}c[A+24>>2]=p;t=c[a+(l+16)>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3424]|0)>>>0){at()}else{c[A+16>>2]=t;c[t+24>>2]=A;break}}}while(0);t=c[a+(l+20)>>2]|0;if((t|0)==0){q=n;r=o;break}if(t>>>0<(c[3424]|0)>>>0){at()}else{c[A+20>>2]=t;c[t+24>>2]=A;q=n;r=o;break}}else{q=d;r=h}}while(0);d=q;if(d>>>0>=i>>>0){at()}A=a+(h-4)|0;e=c[A>>2]|0;if((e&1|0)==0){at()}do{if((e&2|0)==0){if((j|0)==(c[3426]|0)){B=(c[3423]|0)+r|0;c[3423]=B;c[3426]=q;c[q+4>>2]=B|1;if((q|0)==(c[3425]|0)){c[3425]=0;c[3422]=0}if(B>>>0<=(c[3427]|0)>>>0){return}by(0)|0;return}if((j|0)==(c[3425]|0)){B=(c[3422]|0)+r|0;c[3422]=B;c[3425]=q;c[q+4>>2]=B|1;c[d+B>>2]=B;return}B=(e&-8)+r|0;C=e>>>3;L1509:do{if(e>>>0<256){u=c[a+h>>2]|0;g=c[a+(h|4)>>2]|0;b=13720+(C<<1<<2)|0;do{if((u|0)!=(b|0)){if(u>>>0<(c[3424]|0)>>>0){at()}if((c[u+12>>2]|0)==(j|0)){break}at()}}while(0);if((g|0)==(u|0)){c[3420]=c[3420]&~(1<<C);break}do{if((g|0)==(b|0)){D=g+8|0}else{if(g>>>0<(c[3424]|0)>>>0){at()}f=g+8|0;if((c[f>>2]|0)==(j|0)){D=f;break}at()}}while(0);c[u+12>>2]=g;c[D>>2]=u}else{b=i;f=c[a+(h+16)>>2]|0;t=c[a+(h|4)>>2]|0;do{if((t|0)==(b|0)){p=a+(h+12)|0;v=c[p>>2]|0;if((v|0)==0){m=a+(h+8)|0;k=c[m>>2]|0;if((k|0)==0){E=0;break}else{F=k;G=m}}else{F=v;G=p}while(1){p=F+20|0;v=c[p>>2]|0;if((v|0)!=0){F=v;G=p;continue}p=F+16|0;v=c[p>>2]|0;if((v|0)==0){break}else{F=v;G=p}}if(G>>>0<(c[3424]|0)>>>0){at()}else{c[G>>2]=0;E=F;break}}else{p=c[a+h>>2]|0;if(p>>>0<(c[3424]|0)>>>0){at()}v=p+12|0;if((c[v>>2]|0)!=(b|0)){at()}m=t+8|0;if((c[m>>2]|0)==(b|0)){c[v>>2]=t;c[m>>2]=p;E=t;break}else{at()}}}while(0);if((f|0)==0){break}t=a+(h+20)|0;u=13984+(c[t>>2]<<2)|0;do{if((b|0)==(c[u>>2]|0)){c[u>>2]=E;if((E|0)!=0){break}c[3421]=c[3421]&~(1<<c[t>>2]);break L1509}else{if(f>>>0<(c[3424]|0)>>>0){at()}g=f+16|0;if((c[g>>2]|0)==(b|0)){c[g>>2]=E}else{c[f+20>>2]=E}if((E|0)==0){break L1509}}}while(0);if(E>>>0<(c[3424]|0)>>>0){at()}c[E+24>>2]=f;b=c[a+(h+8)>>2]|0;do{if((b|0)!=0){if(b>>>0<(c[3424]|0)>>>0){at()}else{c[E+16>>2]=b;c[b+24>>2]=E;break}}}while(0);b=c[a+(h+12)>>2]|0;if((b|0)==0){break}if(b>>>0<(c[3424]|0)>>>0){at()}else{c[E+20>>2]=b;c[b+24>>2]=E;break}}}while(0);c[q+4>>2]=B|1;c[d+B>>2]=B;if((q|0)!=(c[3425]|0)){H=B;break}c[3422]=B;return}else{c[A>>2]=e&-2;c[q+4>>2]=r|1;c[d+r>>2]=r;H=r}}while(0);r=H>>>3;if(H>>>0<256){d=r<<1;e=13720+(d<<2)|0;A=c[3420]|0;E=1<<r;do{if((A&E|0)==0){c[3420]=A|E;I=e;J=13720+(d+2<<2)|0}else{r=13720+(d+2<<2)|0;h=c[r>>2]|0;if(h>>>0>=(c[3424]|0)>>>0){I=h;J=r;break}at()}}while(0);c[J>>2]=q;c[I+12>>2]=q;c[q+8>>2]=I;c[q+12>>2]=e;return}e=q;I=H>>>8;do{if((I|0)==0){K=0}else{if(H>>>0>16777215){K=31;break}J=(I+1048320|0)>>>16&8;d=I<<J;E=(d+520192|0)>>>16&4;A=d<<E;d=(A+245760|0)>>>16&2;r=14-(E|J|d)+(A<<d>>>15)|0;K=H>>>((r+7|0)>>>0)&1|r<<1}}while(0);I=13984+(K<<2)|0;c[q+28>>2]=K;c[q+20>>2]=0;c[q+16>>2]=0;r=c[3421]|0;d=1<<K;do{if((r&d|0)==0){c[3421]=r|d;c[I>>2]=e;c[q+24>>2]=I;c[q+12>>2]=q;c[q+8>>2]=q}else{if((K|0)==31){L=0}else{L=25-(K>>>1)|0}A=H<<L;J=c[I>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(H|0)){break}M=J+16+(A>>>31<<2)|0;E=c[M>>2]|0;if((E|0)==0){N=1130;break}else{A=A<<1;J=E}}if((N|0)==1130){if(M>>>0<(c[3424]|0)>>>0){at()}else{c[M>>2]=e;c[q+24>>2]=J;c[q+12>>2]=q;c[q+8>>2]=q;break}}A=J+8|0;B=c[A>>2]|0;E=c[3424]|0;if(J>>>0<E>>>0){at()}if(B>>>0<E>>>0){at()}else{c[B+12>>2]=e;c[A>>2]=e;c[q+8>>2]=B;c[q+12>>2]=J;c[q+24>>2]=0;break}}}while(0);q=(c[3428]|0)-1|0;c[3428]=q;if((q|0)==0){O=14136}else{return}while(1){q=c[O>>2]|0;if((q|0)==0){break}else{O=q+8|0}}c[3428]=-1;return}function bw(a,b){a=a|0;b=b|0;var d=0,e=0;do{if((a|0)==0){d=0}else{e=$(b,a)|0;if((b|a)>>>0<=65535){d=e;break}d=((e>>>0)/(a>>>0)|0|0)==(b|0)?e:-1}}while(0);b=bu(d)|0;if((b|0)==0){return b|0}if((c[b-4>>2]&3|0)==0){return b|0}bC(b|0,0,d|0);return b|0}function bx(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0;if((a|0)==0){d=bu(b)|0;return d|0}if(b>>>0>4294967231){c[(ap()|0)>>2]=12;d=0;return d|0}if(b>>>0<11){e=16}else{e=b+11&-8}f=bz(a-8|0,e)|0;if((f|0)!=0){d=f+8|0;return d|0}f=bu(b)|0;if((f|0)==0){d=0;return d|0}e=c[a-4>>2]|0;g=(e&-8)-((e&3|0)==0?8:4)|0;e=g>>>0<b>>>0?g:b;bB(f|0,a|0,e)|0;bv(a);d=f;return d|0}function by(a){a=a|0;var b=0,d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0;do{if((c[3414]|0)==0){b=am(8)|0;if((b-1&b|0)==0){c[3416]=b;c[3415]=b;c[3417]=-1;c[3418]=2097152;c[3419]=0;c[3531]=0;c[3414]=(aw(0)|0)&-16^1431655768;break}else{at();return 0}}}while(0);if(a>>>0>=4294967232){d=0;return d|0}b=c[3426]|0;if((b|0)==0){d=0;return d|0}e=c[3423]|0;do{if(e>>>0>(a+40|0)>>>0){f=c[3416]|0;g=$((((-40-a-1+e+f|0)>>>0)/(f>>>0)|0)-1|0,f)|0;h=b;i=14128;while(1){j=c[i>>2]|0;if(j>>>0<=h>>>0){if((j+(c[i+4>>2]|0)|0)>>>0>h>>>0){k=i;break}}j=c[i+8>>2]|0;if((j|0)==0){k=0;break}else{i=j}}if((c[k+12>>2]&8|0)!=0){break}i=au(0)|0;h=k+4|0;if((i|0)!=((c[k>>2]|0)+(c[h>>2]|0)|0)){break}j=au(-(g>>>0>2147483646?-2147483648-f|0:g)|0)|0;l=au(0)|0;if(!((j|0)!=-1&l>>>0<i>>>0)){break}j=i-l|0;if((i|0)==(l|0)){break}c[h>>2]=(c[h>>2]|0)-j;c[3528]=(c[3528]|0)-j;h=c[3426]|0;m=(c[3423]|0)-j|0;j=h;n=h+8|0;if((n&7|0)==0){o=0}else{o=-n&7}n=m-o|0;c[3426]=j+o;c[3423]=n;c[j+(o+4)>>2]=n|1;c[j+(m+4)>>2]=40;c[3427]=c[3418];d=(i|0)!=(l|0)|0;return d|0}}while(0);if((c[3423]|0)>>>0<=(c[3427]|0)>>>0){d=0;return d|0}c[3427]=-1;d=0;return d|0}function bz(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0;d=a+4|0;e=c[d>>2]|0;f=e&-8;g=a;h=g+f|0;i=h;j=c[3424]|0;if(g>>>0<j>>>0){at();return 0}k=e&3;if(!((k|0)!=1&g>>>0<h>>>0)){at();return 0}l=g+(f|4)|0;m=c[l>>2]|0;if((m&1|0)==0){at();return 0}if((k|0)==0){if(b>>>0<256){n=0;return n|0}do{if(f>>>0>=(b+4|0)>>>0){if((f-b|0)>>>0>c[3416]<<1>>>0){break}else{n=a}return n|0}}while(0);n=0;return n|0}if(f>>>0>=b>>>0){k=f-b|0;if(k>>>0<=15){n=a;return n|0}c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|3;c[l>>2]=c[l>>2]|1;bA(g+b|0,k);n=a;return n|0}if((i|0)==(c[3426]|0)){k=(c[3423]|0)+f|0;if(k>>>0<=b>>>0){n=0;return n|0}l=k-b|0;c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=l|1;c[3426]=g+b;c[3423]=l;n=a;return n|0}if((i|0)==(c[3425]|0)){l=(c[3422]|0)+f|0;if(l>>>0<b>>>0){n=0;return n|0}k=l-b|0;if(k>>>0>15){c[d>>2]=e&1|b|2;c[g+(b+4)>>2]=k|1;c[g+l>>2]=k;o=g+(l+4)|0;c[o>>2]=c[o>>2]&-2;p=g+b|0;q=k}else{c[d>>2]=e&1|l|2;e=g+(l+4)|0;c[e>>2]=c[e>>2]|1;p=0;q=0}c[3422]=q;c[3425]=p;n=a;return n|0}if((m&2|0)!=0){n=0;return n|0}p=(m&-8)+f|0;if(p>>>0<b>>>0){n=0;return n|0}q=p-b|0;e=m>>>3;L1741:do{if(m>>>0<256){l=c[g+(f+8)>>2]|0;k=c[g+(f+12)>>2]|0;o=13720+(e<<1<<2)|0;do{if((l|0)!=(o|0)){if(l>>>0<j>>>0){at();return 0}if((c[l+12>>2]|0)==(i|0)){break}at();return 0}}while(0);if((k|0)==(l|0)){c[3420]=c[3420]&~(1<<e);break}do{if((k|0)==(o|0)){r=k+8|0}else{if(k>>>0<j>>>0){at();return 0}s=k+8|0;if((c[s>>2]|0)==(i|0)){r=s;break}at();return 0}}while(0);c[l+12>>2]=k;c[r>>2]=l}else{o=h;s=c[g+(f+24)>>2]|0;t=c[g+(f+12)>>2]|0;do{if((t|0)==(o|0)){u=g+(f+20)|0;v=c[u>>2]|0;if((v|0)==0){w=g+(f+16)|0;x=c[w>>2]|0;if((x|0)==0){y=0;break}else{z=x;A=w}}else{z=v;A=u}while(1){u=z+20|0;v=c[u>>2]|0;if((v|0)!=0){z=v;A=u;continue}u=z+16|0;v=c[u>>2]|0;if((v|0)==0){break}else{z=v;A=u}}if(A>>>0<j>>>0){at();return 0}else{c[A>>2]=0;y=z;break}}else{u=c[g+(f+8)>>2]|0;if(u>>>0<j>>>0){at();return 0}v=u+12|0;if((c[v>>2]|0)!=(o|0)){at();return 0}w=t+8|0;if((c[w>>2]|0)==(o|0)){c[v>>2]=t;c[w>>2]=u;y=t;break}else{at();return 0}}}while(0);if((s|0)==0){break}t=g+(f+28)|0;l=13984+(c[t>>2]<<2)|0;do{if((o|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3421]=c[3421]&~(1<<c[t>>2]);break L1741}else{if(s>>>0<(c[3424]|0)>>>0){at();return 0}k=s+16|0;if((c[k>>2]|0)==(o|0)){c[k>>2]=y}else{c[s+20>>2]=y}if((y|0)==0){break L1741}}}while(0);if(y>>>0<(c[3424]|0)>>>0){at();return 0}c[y+24>>2]=s;o=c[g+(f+16)>>2]|0;do{if((o|0)!=0){if(o>>>0<(c[3424]|0)>>>0){at();return 0}else{c[y+16>>2]=o;c[o+24>>2]=y;break}}}while(0);o=c[g+(f+20)>>2]|0;if((o|0)==0){break}if(o>>>0<(c[3424]|0)>>>0){at();return 0}else{c[y+20>>2]=o;c[o+24>>2]=y;break}}}while(0);if(q>>>0<16){c[d>>2]=p|c[d>>2]&1|2;y=g+(p|4)|0;c[y>>2]=c[y>>2]|1;n=a;return n|0}else{c[d>>2]=c[d>>2]&1|b|2;c[g+(b+4)>>2]=q|3;d=g+(p|4)|0;c[d>>2]=c[d>>2]|1;bA(g+b|0,q);n=a;return n|0}return 0}function bA(a,b){a=a|0;b=b|0;var d=0,e=0,f=0,g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,D=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0;d=a;e=d+b|0;f=e;g=c[a+4>>2]|0;L1817:do{if((g&1|0)==0){h=c[a>>2]|0;if((g&3|0)==0){return}i=d+(-h|0)|0;j=i;k=h+b|0;l=c[3424]|0;if(i>>>0<l>>>0){at()}if((j|0)==(c[3425]|0)){m=d+(b+4)|0;if((c[m>>2]&3|0)!=3){n=j;o=k;break}c[3422]=k;c[m>>2]=c[m>>2]&-2;c[d+(4-h)>>2]=k|1;c[e>>2]=k;return}m=h>>>3;if(h>>>0<256){p=c[d+(8-h)>>2]|0;q=c[d+(12-h)>>2]|0;r=13720+(m<<1<<2)|0;do{if((p|0)!=(r|0)){if(p>>>0<l>>>0){at()}if((c[p+12>>2]|0)==(j|0)){break}at()}}while(0);if((q|0)==(p|0)){c[3420]=c[3420]&~(1<<m);n=j;o=k;break}do{if((q|0)==(r|0)){s=q+8|0}else{if(q>>>0<l>>>0){at()}t=q+8|0;if((c[t>>2]|0)==(j|0)){s=t;break}at()}}while(0);c[p+12>>2]=q;c[s>>2]=p;n=j;o=k;break}r=i;m=c[d+(24-h)>>2]|0;t=c[d+(12-h)>>2]|0;do{if((t|0)==(r|0)){u=16-h|0;v=d+(u+4)|0;w=c[v>>2]|0;if((w|0)==0){x=d+u|0;u=c[x>>2]|0;if((u|0)==0){y=0;break}else{z=u;A=x}}else{z=w;A=v}while(1){v=z+20|0;w=c[v>>2]|0;if((w|0)!=0){z=w;A=v;continue}v=z+16|0;w=c[v>>2]|0;if((w|0)==0){break}else{z=w;A=v}}if(A>>>0<l>>>0){at()}else{c[A>>2]=0;y=z;break}}else{v=c[d+(8-h)>>2]|0;if(v>>>0<l>>>0){at()}w=v+12|0;if((c[w>>2]|0)!=(r|0)){at()}x=t+8|0;if((c[x>>2]|0)==(r|0)){c[w>>2]=t;c[x>>2]=v;y=t;break}else{at()}}}while(0);if((m|0)==0){n=j;o=k;break}t=d+(28-h)|0;l=13984+(c[t>>2]<<2)|0;do{if((r|0)==(c[l>>2]|0)){c[l>>2]=y;if((y|0)!=0){break}c[3421]=c[3421]&~(1<<c[t>>2]);n=j;o=k;break L1817}else{if(m>>>0<(c[3424]|0)>>>0){at()}i=m+16|0;if((c[i>>2]|0)==(r|0)){c[i>>2]=y}else{c[m+20>>2]=y}if((y|0)==0){n=j;o=k;break L1817}}}while(0);if(y>>>0<(c[3424]|0)>>>0){at()}c[y+24>>2]=m;r=16-h|0;t=c[d+r>>2]|0;do{if((t|0)!=0){if(t>>>0<(c[3424]|0)>>>0){at()}else{c[y+16>>2]=t;c[t+24>>2]=y;break}}}while(0);t=c[d+(r+4)>>2]|0;if((t|0)==0){n=j;o=k;break}if(t>>>0<(c[3424]|0)>>>0){at()}else{c[y+20>>2]=t;c[t+24>>2]=y;n=j;o=k;break}}else{n=a;o=b}}while(0);a=c[3424]|0;if(e>>>0<a>>>0){at()}y=d+(b+4)|0;z=c[y>>2]|0;do{if((z&2|0)==0){if((f|0)==(c[3426]|0)){A=(c[3423]|0)+o|0;c[3423]=A;c[3426]=n;c[n+4>>2]=A|1;if((n|0)!=(c[3425]|0)){return}c[3425]=0;c[3422]=0;return}if((f|0)==(c[3425]|0)){A=(c[3422]|0)+o|0;c[3422]=A;c[3425]=n;c[n+4>>2]=A|1;c[n+A>>2]=A;return}A=(z&-8)+o|0;s=z>>>3;L1917:do{if(z>>>0<256){g=c[d+(b+8)>>2]|0;t=c[d+(b+12)>>2]|0;h=13720+(s<<1<<2)|0;do{if((g|0)!=(h|0)){if(g>>>0<a>>>0){at()}if((c[g+12>>2]|0)==(f|0)){break}at()}}while(0);if((t|0)==(g|0)){c[3420]=c[3420]&~(1<<s);break}do{if((t|0)==(h|0)){B=t+8|0}else{if(t>>>0<a>>>0){at()}m=t+8|0;if((c[m>>2]|0)==(f|0)){B=m;break}at()}}while(0);c[g+12>>2]=t;c[B>>2]=g}else{h=e;m=c[d+(b+24)>>2]|0;l=c[d+(b+12)>>2]|0;do{if((l|0)==(h|0)){i=d+(b+20)|0;p=c[i>>2]|0;if((p|0)==0){q=d+(b+16)|0;v=c[q>>2]|0;if((v|0)==0){C=0;break}else{D=v;E=q}}else{D=p;E=i}while(1){i=D+20|0;p=c[i>>2]|0;if((p|0)!=0){D=p;E=i;continue}i=D+16|0;p=c[i>>2]|0;if((p|0)==0){break}else{D=p;E=i}}if(E>>>0<a>>>0){at()}else{c[E>>2]=0;C=D;break}}else{i=c[d+(b+8)>>2]|0;if(i>>>0<a>>>0){at()}p=i+12|0;if((c[p>>2]|0)!=(h|0)){at()}q=l+8|0;if((c[q>>2]|0)==(h|0)){c[p>>2]=l;c[q>>2]=i;C=l;break}else{at()}}}while(0);if((m|0)==0){break}l=d+(b+28)|0;g=13984+(c[l>>2]<<2)|0;do{if((h|0)==(c[g>>2]|0)){c[g>>2]=C;if((C|0)!=0){break}c[3421]=c[3421]&~(1<<c[l>>2]);break L1917}else{if(m>>>0<(c[3424]|0)>>>0){at()}t=m+16|0;if((c[t>>2]|0)==(h|0)){c[t>>2]=C}else{c[m+20>>2]=C}if((C|0)==0){break L1917}}}while(0);if(C>>>0<(c[3424]|0)>>>0){at()}c[C+24>>2]=m;h=c[d+(b+16)>>2]|0;do{if((h|0)!=0){if(h>>>0<(c[3424]|0)>>>0){at()}else{c[C+16>>2]=h;c[h+24>>2]=C;break}}}while(0);h=c[d+(b+20)>>2]|0;if((h|0)==0){break}if(h>>>0<(c[3424]|0)>>>0){at()}else{c[C+20>>2]=h;c[h+24>>2]=C;break}}}while(0);c[n+4>>2]=A|1;c[n+A>>2]=A;if((n|0)!=(c[3425]|0)){F=A;break}c[3422]=A;return}else{c[y>>2]=z&-2;c[n+4>>2]=o|1;c[n+o>>2]=o;F=o}}while(0);o=F>>>3;if(F>>>0<256){z=o<<1;y=13720+(z<<2)|0;C=c[3420]|0;b=1<<o;do{if((C&b|0)==0){c[3420]=C|b;G=y;H=13720+(z+2<<2)|0}else{o=13720+(z+2<<2)|0;d=c[o>>2]|0;if(d>>>0>=(c[3424]|0)>>>0){G=d;H=o;break}at()}}while(0);c[H>>2]=n;c[G+12>>2]=n;c[n+8>>2]=G;c[n+12>>2]=y;return}y=n;G=F>>>8;do{if((G|0)==0){I=0}else{if(F>>>0>16777215){I=31;break}H=(G+1048320|0)>>>16&8;z=G<<H;b=(z+520192|0)>>>16&4;C=z<<b;z=(C+245760|0)>>>16&2;o=14-(b|H|z)+(C<<z>>>15)|0;I=F>>>((o+7|0)>>>0)&1|o<<1}}while(0);G=13984+(I<<2)|0;c[n+28>>2]=I;c[n+20>>2]=0;c[n+16>>2]=0;o=c[3421]|0;z=1<<I;if((o&z|0)==0){c[3421]=o|z;c[G>>2]=y;c[n+24>>2]=G;c[n+12>>2]=n;c[n+8>>2]=n;return}if((I|0)==31){J=0}else{J=25-(I>>>1)|0}I=F<<J;J=c[G>>2]|0;while(1){if((c[J+4>>2]&-8|0)==(F|0)){break}K=J+16+(I>>>31<<2)|0;G=c[K>>2]|0;if((G|0)==0){L=1446;break}else{I=I<<1;J=G}}if((L|0)==1446){if(K>>>0<(c[3424]|0)>>>0){at()}c[K>>2]=y;c[n+24>>2]=J;c[n+12>>2]=n;c[n+8>>2]=n;return}K=J+8|0;L=c[K>>2]|0;I=c[3424]|0;if(J>>>0<I>>>0){at()}if(L>>>0<I>>>0){at()}c[L+12>>2]=y;c[K>>2]=y;c[n+8>>2]=L;c[n+12>>2]=J;c[n+24>>2]=0;return}function bB(b,d,e){b=b|0;d=d|0;e=e|0;var f=0;f=b|0;if((b&3)==(d&3)){while(b&3){if((e|0)==0)return f|0;a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}while((e|0)>=4){c[b>>2]=c[d>>2];b=b+4|0;d=d+4|0;e=e-4|0}}while((e|0)>0){a[b]=a[d]|0;b=b+1|0;d=d+1|0;e=e-1|0}return f|0}function bC(b,d,e){b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0;f=b+e|0;if((e|0)>=20){d=d&255;e=b&3;g=d|d<<8|d<<16|d<<24;h=f&~3;if(e){e=b+4-e|0;while((b|0)<(e|0)){a[b]=d;b=b+1|0}}while((b|0)<(h|0)){c[b>>2]=g;b=b+4|0}}while((b|0)<(f|0)){a[b]=d;b=b+1|0}}function bD(b){b=b|0;var c=0;c=b;while(a[c]|0){c=c+1|0}return c-b|0}function bE(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=a+c>>>0;return(D=b+d+(e>>>0<a>>>0|0)>>>0,e|0)|0}function bF(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=b-d>>>0;e=b-d-(c>>>0>a>>>0|0)>>>0;return(D=e,a-c>>>0|0)|0}function bG(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b<<c|(a&(1<<c)-1<<32-c)>>>32-c;return a<<c}D=a<<c-32;return 0}function bH(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=0;return b>>>c-32|0}function bI(a,b,c){a=a|0;b=b|0;c=c|0;if((c|0)<32){D=b>>c;return a>>>c|(b&(1<<c)-1)<<32-c}D=(b|0)<0?-1:0;return b>>c-32|0}function bJ(b){b=b|0;var c=0;c=a[n+(b>>>24)|0]|0;if((c|0)<8)return c|0;c=a[n+(b>>16&255)|0]|0;if((c|0)<8)return c+8|0;c=a[n+(b>>8&255)|0]|0;if((c|0)<8)return c+16|0;return(a[n+(b&255)|0]|0)+24|0}function bK(b){b=b|0;var c=0;c=a[m+(b&255)|0]|0;if((c|0)<8)return c|0;c=a[m+(b>>8&255)|0]|0;if((c|0)<8)return c+8|0;c=a[m+(b>>16&255)|0]|0;if((c|0)<8)return c+16|0;return(a[m+(b>>>24)|0]|0)+24|0}function bL(a,b){a=a|0;b=b|0;var c=0,d=0,e=0,f=0;c=a&65535;d=b&65535;e=$(d,c)|0;f=a>>>16;a=(e>>>16)+($(d,f)|0)|0;d=b>>>16;b=$(d,c)|0;return(D=(a>>>16)+($(d,f)|0)+(((a&65535)+b|0)>>>16)|0,a+b<<16|e&65535|0)|0}function bM(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0,g=0,h=0,i=0;e=b>>31|((b|0)<0?-1:0)<<1;f=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;g=d>>31|((d|0)<0?-1:0)<<1;h=((d|0)<0?-1:0)>>31|((d|0)<0?-1:0)<<1;i=bF(e^a,f^b,e,f)|0;b=D;a=g^e;e=h^f;f=bF((bR(i,b,bF(g^c,h^d,g,h)|0,D,0)|0)^a,D^e,a,e)|0;return(D=D,f)|0}function bN(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0,h=0,j=0,k=0,l=0,m=0;f=i;i=i+8|0;g=f|0;h=b>>31|((b|0)<0?-1:0)<<1;j=((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1;k=e>>31|((e|0)<0?-1:0)<<1;l=((e|0)<0?-1:0)>>31|((e|0)<0?-1:0)<<1;m=bF(h^a,j^b,h,j)|0;b=D;a=bF(k^d,l^e,k,l)|0;bR(m,b,a,D,g)|0;a=bF(c[g>>2]^h,c[g+4>>2]^j,h,j)|0;j=D;i=f;return(D=j,a)|0}function bO(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0,f=0;e=a;a=c;c=bL(e,a)|0;f=D;return(D=($(b,a)|0)+($(d,e)|0)+f|f&0,c|0|0)|0}function bP(a,b,c,d){a=a|0;b=b|0;c=c|0;d=d|0;var e=0;e=bR(a,b,c,d,0)|0;return(D=D,e)|0}function bQ(a,b,d,e){a=a|0;b=b|0;d=d|0;e=e|0;var f=0,g=0;f=i;i=i+8|0;g=f|0;bR(a,b,d,e,g)|0;i=f;return(D=c[g+4>>2]|0,c[g>>2]|0)|0}function bR(a,b,d,e,f){a=a|0;b=b|0;d=d|0;e=e|0;f=f|0;var g=0,h=0,i=0,j=0,k=0,l=0,m=0,n=0,o=0,p=0,q=0,r=0,s=0,t=0,u=0,v=0,w=0,x=0,y=0,z=0,A=0,B=0,C=0,E=0,F=0,G=0,H=0,I=0,J=0,K=0,L=0,M=0;g=a;h=b;i=h;j=d;k=e;l=k;if((i|0)==0){m=(f|0)!=0;if((l|0)==0){if(m){c[f>>2]=(g>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(g>>>0)/(j>>>0)>>>0;return(D=n,o)|0}else{if(!m){n=0;o=0;return(D=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=b&0;n=0;o=0;return(D=n,o)|0}}m=(l|0)==0;do{if((j|0)==0){if(m){if((f|0)!=0){c[f>>2]=(i>>>0)%(j>>>0);c[f+4>>2]=0}n=0;o=(i>>>0)/(j>>>0)>>>0;return(D=n,o)|0}if((g|0)==0){if((f|0)!=0){c[f>>2]=0;c[f+4>>2]=(i>>>0)%(l>>>0)}n=0;o=(i>>>0)/(l>>>0)>>>0;return(D=n,o)|0}p=l-1|0;if((p&l|0)==0){if((f|0)!=0){c[f>>2]=a|0;c[f+4>>2]=p&i|b&0}n=0;o=i>>>((bK(l|0)|0)>>>0);return(D=n,o)|0}p=(bJ(l|0)|0)-(bJ(i|0)|0)|0;if(p>>>0<=30){q=p+1|0;r=31-p|0;s=q;t=i<<r|g>>>(q>>>0);u=i>>>(q>>>0);v=0;w=g<<r;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}else{if(!m){r=(bJ(l|0)|0)-(bJ(i|0)|0)|0;if(r>>>0<=31){q=r+1|0;p=31-r|0;x=r-31>>31;s=q;t=g>>>(q>>>0)&x|i<<p;u=i>>>(q>>>0)&x;v=0;w=g<<p;break}if((f|0)==0){n=0;o=0;return(D=n,o)|0}c[f>>2]=a|0;c[f+4>>2]=h|b&0;n=0;o=0;return(D=n,o)|0}p=j-1|0;if((p&j|0)!=0){x=(bJ(j|0)|0)+33-(bJ(i|0)|0)|0;q=64-x|0;r=32-x|0;y=r>>31;z=x-32|0;A=z>>31;s=x;t=r-1>>31&i>>>(z>>>0)|(i<<r|g>>>(x>>>0))&A;u=A&i>>>(x>>>0);v=g<<q&y;w=(i<<q|g>>>(z>>>0))&y|g<<r&x-33>>31;break}if((f|0)!=0){c[f>>2]=p&g;c[f+4>>2]=0}if((j|0)==1){n=h|b&0;o=a|0|0;return(D=n,o)|0}else{p=bK(j|0)|0;n=i>>>(p>>>0)|0;o=i<<32-p|g>>>(p>>>0)|0;return(D=n,o)|0}}}while(0);if((s|0)==0){B=w;C=v;E=u;F=t;G=0;H=0}else{g=d|0|0;d=k|e&0;e=bE(g,d,-1,-1)|0;k=D;i=w;w=v;v=u;u=t;t=s;s=0;while(1){I=w>>>31|i<<1;J=s|w<<1;j=u<<1|i>>>31|0;a=u>>>31|v<<1|0;bF(e,k,j,a)|0;b=D;h=b>>31|((b|0)<0?-1:0)<<1;K=h&1;L=bF(j,a,h&g,(((b|0)<0?-1:0)>>31|((b|0)<0?-1:0)<<1)&d)|0;M=D;b=t-1|0;if((b|0)==0){break}else{i=I;w=J;v=M;u=L;t=b;s=K}}B=I;C=J;E=M;F=L;G=0;H=K}K=C;C=0;if((f|0)!=0){c[f>>2]=F;c[f+4>>2]=E}n=(K|0)>>>31|(B|C)<<1|(C<<1|K>>>31)&0|G;o=(K<<1|0>>>31)&-2|H;return(D=n,o)|0}function bS(a,b){a=a|0;b=b|0;return ax[a&1](b|0)|0}function bT(a){a=a|0;ay[a&1]()}function bU(a,b,c){a=a|0;b=b|0;c=c|0;return az[a&1](b|0,c|0)|0}function bV(a,b){a=a|0;b=b|0;aA[a&1](b|0)}function bW(a){a=a|0;aa(0);return 0}function bX(){aa(1)}function bY(a,b){a=a|0;b=b|0;aa(2);return 0}function bZ(a){a=a|0;aa(3)}
// EMSCRIPTEN_END_FUNCS
var ax=[bW,bW];var ay=[bX,bX];var az=[bY,bY];var aA=[bZ,bZ];return{_strlen:bD,_free:bv,_shine_check_config:bj,_realloc:bx,_shine_js_init:bt,_memset:bC,_shine_flush:bq,_malloc:bu,_memcpy:bB,_shine_encode_buffer:bp,_shine_close:br,_shine_samples_per_pass:bk,_calloc:bw,runPostSets:aR,stackAlloc:aB,stackSave:aC,stackRestore:aD,setThrew:aE,setTempRet0:aH,setTempRet1:aI,setTempRet2:aJ,setTempRet3:aK,setTempRet4:aL,setTempRet5:aM,setTempRet6:aN,setTempRet7:aO,setTempRet8:aP,setTempRet9:aQ,dynCall_ii:bS,dynCall_v:bT,dynCall_iii:bU,dynCall_vi:bV}})
// EMSCRIPTEN_END_ASM
({ "Math": Math, "Int8Array": Int8Array, "Int16Array": Int16Array, "Int32Array": Int32Array, "Uint8Array": Uint8Array, "Uint16Array": Uint16Array, "Uint32Array": Uint32Array, "Float32Array": Float32Array, "Float64Array": Float64Array }, { "abort": abort, "assert": assert, "asmPrintInt": asmPrintInt, "asmPrintFloat": asmPrintFloat, "min": Math_min, "invoke_ii": invoke_ii, "invoke_v": invoke_v, "invoke_iii": invoke_iii, "invoke_vi": invoke_vi, "_llvm_lifetime_end": _llvm_lifetime_end, "_cos": _cos, "_log": _log, "_sysconf": _sysconf, "___setErrNo": ___setErrNo, "_exp2": _exp2, "___errno_location": ___errno_location, "_sqrt": _sqrt, "_sin": _sin, "_llvm_lifetime_start": _llvm_lifetime_start, "_abort": _abort, "_sbrk": _sbrk, "_modf": _modf, "_time": _time, "STACKTOP": STACKTOP, "STACK_MAX": STACK_MAX, "tempDoublePtr": tempDoublePtr, "ABORT": ABORT, "cttz_i8": cttz_i8, "ctlz_i8": ctlz_i8, "NaN": NaN, "Infinity": Infinity }, buffer);
var _strlen = Module["_strlen"] = asm["_strlen"];
var _free = Module["_free"] = asm["_free"];
var _shine_check_config = Module["_shine_check_config"] = asm["_shine_check_config"];
var _realloc = Module["_realloc"] = asm["_realloc"];
var _shine_js_init = Module["_shine_js_init"] = asm["_shine_js_init"];
var _memset = Module["_memset"] = asm["_memset"];
var _shine_flush = Module["_shine_flush"] = asm["_shine_flush"];
var _malloc = Module["_malloc"] = asm["_malloc"];
var _memcpy = Module["_memcpy"] = asm["_memcpy"];
var _shine_encode_buffer = Module["_shine_encode_buffer"] = asm["_shine_encode_buffer"];
var _shine_close = Module["_shine_close"] = asm["_shine_close"];
var _shine_samples_per_pass = Module["_shine_samples_per_pass"] = asm["_shine_samples_per_pass"];
var _calloc = Module["_calloc"] = asm["_calloc"];
var runPostSets = Module["runPostSets"] = asm["runPostSets"];
var dynCall_ii = Module["dynCall_ii"] = asm["dynCall_ii"];
var dynCall_v = Module["dynCall_v"] = asm["dynCall_v"];
var dynCall_iii = Module["dynCall_iii"] = asm["dynCall_iii"];
var dynCall_vi = Module["dynCall_vi"] = asm["dynCall_vi"];
Runtime.stackAlloc = function(size) { return asm['stackAlloc'](size) };
Runtime.stackSave = function() { return asm['stackSave']() };
Runtime.stackRestore = function(top) { asm['stackRestore'](top) };
// TODO: strip out parts of this we do not need
//======= begin closure i64 code =======
// Copyright 2009 The Closure Library Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.
/**
 * @fileoverview Defines a Long class for representing a 64-bit two's-complement
 * integer value, which faithfully simulates the behavior of a Java "long". This
 * implementation is derived from LongLib in GWT.
 *
 */
var i64Math = (function() { // Emscripten wrapper
  var goog = { math: {} };
  /**
   * Constructs a 64-bit two's-complement integer, given its low and high 32-bit
   * values as *signed* integers.  See the from* functions below for more
   * convenient ways of constructing Longs.
   *
   * The internal representation of a long is the two given signed, 32-bit values.
   * We use 32-bit pieces because these are the size of integers on which
   * Javascript performs bit-operations.  For operations like addition and
   * multiplication, we split each number into 16-bit pieces, which can easily be
   * multiplied within Javascript's floating-point representation without overflow
   * or change in sign.
   *
   * In the algorithms below, we frequently reduce the negative case to the
   * positive case by negating the input(s) and then post-processing the result.
   * Note that we must ALWAYS check specially whether those values are MIN_VALUE
   * (-2^63) because -MIN_VALUE == MIN_VALUE (since 2^63 cannot be represented as
   * a positive number, it overflows back into a negative).  Not handling this
   * case would often result in infinite recursion.
   *
   * @param {number} low  The low (signed) 32 bits of the long.
   * @param {number} high  The high (signed) 32 bits of the long.
   * @constructor
   */
  goog.math.Long = function(low, high) {
    /**
     * @type {number}
     * @private
     */
    this.low_ = low | 0;  // force into 32 signed bits.
    /**
     * @type {number}
     * @private
     */
    this.high_ = high | 0;  // force into 32 signed bits.
  };
  // NOTE: Common constant values ZERO, ONE, NEG_ONE, etc. are defined below the
  // from* methods on which they depend.
  /**
   * A cache of the Long representations of small integer values.
   * @type {!Object}
   * @private
   */
  goog.math.Long.IntCache_ = {};
  /**
   * Returns a Long representing the given (32-bit) integer value.
   * @param {number} value The 32-bit integer in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromInt = function(value) {
    if (-128 <= value && value < 128) {
      var cachedObj = goog.math.Long.IntCache_[value];
      if (cachedObj) {
        return cachedObj;
      }
    }
    var obj = new goog.math.Long(value | 0, value < 0 ? -1 : 0);
    if (-128 <= value && value < 128) {
      goog.math.Long.IntCache_[value] = obj;
    }
    return obj;
  };
  /**
   * Returns a Long representing the given value, provided that it is a finite
   * number.  Otherwise, zero is returned.
   * @param {number} value The number in question.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromNumber = function(value) {
    if (isNaN(value) || !isFinite(value)) {
      return goog.math.Long.ZERO;
    } else if (value <= -goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MIN_VALUE;
    } else if (value + 1 >= goog.math.Long.TWO_PWR_63_DBL_) {
      return goog.math.Long.MAX_VALUE;
    } else if (value < 0) {
      return goog.math.Long.fromNumber(-value).negate();
    } else {
      return new goog.math.Long(
          (value % goog.math.Long.TWO_PWR_32_DBL_) | 0,
          (value / goog.math.Long.TWO_PWR_32_DBL_) | 0);
    }
  };
  /**
   * Returns a Long representing the 64-bit integer that comes by concatenating
   * the given high and low bits.  Each is assumed to use 32 bits.
   * @param {number} lowBits The low 32-bits.
   * @param {number} highBits The high 32-bits.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromBits = function(lowBits, highBits) {
    return new goog.math.Long(lowBits, highBits);
  };
  /**
   * Returns a Long representation of the given string, written using the given
   * radix.
   * @param {string} str The textual representation of the Long.
   * @param {number=} opt_radix The radix in which the text is written.
   * @return {!goog.math.Long} The corresponding Long value.
   */
  goog.math.Long.fromString = function(str, opt_radix) {
    if (str.length == 0) {
      throw Error('number format error: empty string');
    }
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (str.charAt(0) == '-') {
      return goog.math.Long.fromString(str.substring(1), radix).negate();
    } else if (str.indexOf('-') >= 0) {
      throw Error('number format error: interior "-" character: ' + str);
    }
    // Do several (8) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 8));
    var result = goog.math.Long.ZERO;
    for (var i = 0; i < str.length; i += 8) {
      var size = Math.min(8, str.length - i);
      var value = parseInt(str.substring(i, i + size), radix);
      if (size < 8) {
        var power = goog.math.Long.fromNumber(Math.pow(radix, size));
        result = result.multiply(power).add(goog.math.Long.fromNumber(value));
      } else {
        result = result.multiply(radixToPower);
        result = result.add(goog.math.Long.fromNumber(value));
      }
    }
    return result;
  };
  // NOTE: the compiler should inline these constant values below and then remove
  // these variables, so there should be no runtime penalty for these.
  /**
   * Number used repeated below in calculations.  This must appear before the
   * first call to any from* function below.
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_16_DBL_ = 1 << 16;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_24_DBL_ = 1 << 24;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_32_DBL_ =
      goog.math.Long.TWO_PWR_16_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_31_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ / 2;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_48_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_16_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_64_DBL_ =
      goog.math.Long.TWO_PWR_32_DBL_ * goog.math.Long.TWO_PWR_32_DBL_;
  /**
   * @type {number}
   * @private
   */
  goog.math.Long.TWO_PWR_63_DBL_ =
      goog.math.Long.TWO_PWR_64_DBL_ / 2;
  /** @type {!goog.math.Long} */
  goog.math.Long.ZERO = goog.math.Long.fromInt(0);
  /** @type {!goog.math.Long} */
  goog.math.Long.ONE = goog.math.Long.fromInt(1);
  /** @type {!goog.math.Long} */
  goog.math.Long.NEG_ONE = goog.math.Long.fromInt(-1);
  /** @type {!goog.math.Long} */
  goog.math.Long.MAX_VALUE =
      goog.math.Long.fromBits(0xFFFFFFFF | 0, 0x7FFFFFFF | 0);
  /** @type {!goog.math.Long} */
  goog.math.Long.MIN_VALUE = goog.math.Long.fromBits(0, 0x80000000 | 0);
  /**
   * @type {!goog.math.Long}
   * @private
   */
  goog.math.Long.TWO_PWR_24_ = goog.math.Long.fromInt(1 << 24);
  /** @return {number} The value, assuming it is a 32-bit integer. */
  goog.math.Long.prototype.toInt = function() {
    return this.low_;
  };
  /** @return {number} The closest floating-point representation to this value. */
  goog.math.Long.prototype.toNumber = function() {
    return this.high_ * goog.math.Long.TWO_PWR_32_DBL_ +
           this.getLowBitsUnsigned();
  };
  /**
   * @param {number=} opt_radix The radix in which the text should be written.
   * @return {string} The textual representation of this value.
   */
  goog.math.Long.prototype.toString = function(opt_radix) {
    var radix = opt_radix || 10;
    if (radix < 2 || 36 < radix) {
      throw Error('radix out of range: ' + radix);
    }
    if (this.isZero()) {
      return '0';
    }
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        // We need to change the Long value before it can be negated, so we remove
        // the bottom-most digit in this base and then recurse to do the rest.
        var radixLong = goog.math.Long.fromNumber(radix);
        var div = this.div(radixLong);
        var rem = div.multiply(radixLong).subtract(this);
        return div.toString(radix) + rem.toInt().toString(radix);
      } else {
        return '-' + this.negate().toString(radix);
      }
    }
    // Do several (6) digits each time through the loop, so as to
    // minimize the calls to the very expensive emulated div.
    var radixToPower = goog.math.Long.fromNumber(Math.pow(radix, 6));
    var rem = this;
    var result = '';
    while (true) {
      var remDiv = rem.div(radixToPower);
      var intval = rem.subtract(remDiv.multiply(radixToPower)).toInt();
      var digits = intval.toString(radix);
      rem = remDiv;
      if (rem.isZero()) {
        return digits + result;
      } else {
        while (digits.length < 6) {
          digits = '0' + digits;
        }
        result = '' + digits + result;
      }
    }
  };
  /** @return {number} The high 32-bits as a signed value. */
  goog.math.Long.prototype.getHighBits = function() {
    return this.high_;
  };
  /** @return {number} The low 32-bits as a signed value. */
  goog.math.Long.prototype.getLowBits = function() {
    return this.low_;
  };
  /** @return {number} The low 32-bits as an unsigned value. */
  goog.math.Long.prototype.getLowBitsUnsigned = function() {
    return (this.low_ >= 0) ?
        this.low_ : goog.math.Long.TWO_PWR_32_DBL_ + this.low_;
  };
  /**
   * @return {number} Returns the number of bits needed to represent the absolute
   *     value of this Long.
   */
  goog.math.Long.prototype.getNumBitsAbs = function() {
    if (this.isNegative()) {
      if (this.equals(goog.math.Long.MIN_VALUE)) {
        return 64;
      } else {
        return this.negate().getNumBitsAbs();
      }
    } else {
      var val = this.high_ != 0 ? this.high_ : this.low_;
      for (var bit = 31; bit > 0; bit--) {
        if ((val & (1 << bit)) != 0) {
          break;
        }
      }
      return this.high_ != 0 ? bit + 33 : bit + 1;
    }
  };
  /** @return {boolean} Whether this value is zero. */
  goog.math.Long.prototype.isZero = function() {
    return this.high_ == 0 && this.low_ == 0;
  };
  /** @return {boolean} Whether this value is negative. */
  goog.math.Long.prototype.isNegative = function() {
    return this.high_ < 0;
  };
  /** @return {boolean} Whether this value is odd. */
  goog.math.Long.prototype.isOdd = function() {
    return (this.low_ & 1) == 1;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long equals the other.
   */
  goog.math.Long.prototype.equals = function(other) {
    return (this.high_ == other.high_) && (this.low_ == other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long does not equal the other.
   */
  goog.math.Long.prototype.notEquals = function(other) {
    return (this.high_ != other.high_) || (this.low_ != other.low_);
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than the other.
   */
  goog.math.Long.prototype.lessThan = function(other) {
    return this.compare(other) < 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is less than or equal to the other.
   */
  goog.math.Long.prototype.lessThanOrEqual = function(other) {
    return this.compare(other) <= 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than the other.
   */
  goog.math.Long.prototype.greaterThan = function(other) {
    return this.compare(other) > 0;
  };
  /**
   * @param {goog.math.Long} other Long to compare against.
   * @return {boolean} Whether this Long is greater than or equal to the other.
   */
  goog.math.Long.prototype.greaterThanOrEqual = function(other) {
    return this.compare(other) >= 0;
  };
  /**
   * Compares this Long with the given one.
   * @param {goog.math.Long} other Long to compare against.
   * @return {number} 0 if they are the same, 1 if the this is greater, and -1
   *     if the given one is greater.
   */
  goog.math.Long.prototype.compare = function(other) {
    if (this.equals(other)) {
      return 0;
    }
    var thisNeg = this.isNegative();
    var otherNeg = other.isNegative();
    if (thisNeg && !otherNeg) {
      return -1;
    }
    if (!thisNeg && otherNeg) {
      return 1;
    }
    // at this point, the signs are the same, so subtraction will not overflow
    if (this.subtract(other).isNegative()) {
      return -1;
    } else {
      return 1;
    }
  };
  /** @return {!goog.math.Long} The negation of this value. */
  goog.math.Long.prototype.negate = function() {
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.MIN_VALUE;
    } else {
      return this.not().add(goog.math.Long.ONE);
    }
  };
  /**
   * Returns the sum of this and the given Long.
   * @param {goog.math.Long} other Long to add to this one.
   * @return {!goog.math.Long} The sum of this and the given Long.
   */
  goog.math.Long.prototype.add = function(other) {
    // Divide each number into 4 chunks of 16 bits, and then sum the chunks.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 + b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 + b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 + b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 + b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns the difference of this and the given Long.
   * @param {goog.math.Long} other Long to subtract from this.
   * @return {!goog.math.Long} The difference of this and the given Long.
   */
  goog.math.Long.prototype.subtract = function(other) {
    return this.add(other.negate());
  };
  /**
   * Returns the product of this and the given long.
   * @param {goog.math.Long} other Long to multiply with this.
   * @return {!goog.math.Long} The product of this and the other.
   */
  goog.math.Long.prototype.multiply = function(other) {
    if (this.isZero()) {
      return goog.math.Long.ZERO;
    } else if (other.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      return other.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return this.isOdd() ? goog.math.Long.MIN_VALUE : goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().multiply(other.negate());
      } else {
        return this.negate().multiply(other).negate();
      }
    } else if (other.isNegative()) {
      return this.multiply(other.negate()).negate();
    }
    // If both longs are small, use float multiplication
    if (this.lessThan(goog.math.Long.TWO_PWR_24_) &&
        other.lessThan(goog.math.Long.TWO_PWR_24_)) {
      return goog.math.Long.fromNumber(this.toNumber() * other.toNumber());
    }
    // Divide each long into 4 chunks of 16 bits, and then add up 4x4 products.
    // We can skip products that would overflow.
    var a48 = this.high_ >>> 16;
    var a32 = this.high_ & 0xFFFF;
    var a16 = this.low_ >>> 16;
    var a00 = this.low_ & 0xFFFF;
    var b48 = other.high_ >>> 16;
    var b32 = other.high_ & 0xFFFF;
    var b16 = other.low_ >>> 16;
    var b00 = other.low_ & 0xFFFF;
    var c48 = 0, c32 = 0, c16 = 0, c00 = 0;
    c00 += a00 * b00;
    c16 += c00 >>> 16;
    c00 &= 0xFFFF;
    c16 += a16 * b00;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c16 += a00 * b16;
    c32 += c16 >>> 16;
    c16 &= 0xFFFF;
    c32 += a32 * b00;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a16 * b16;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c32 += a00 * b32;
    c48 += c32 >>> 16;
    c32 &= 0xFFFF;
    c48 += a48 * b00 + a32 * b16 + a16 * b32 + a00 * b48;
    c48 &= 0xFFFF;
    return goog.math.Long.fromBits((c16 << 16) | c00, (c48 << 16) | c32);
  };
  /**
   * Returns this Long divided by the given one.
   * @param {goog.math.Long} other Long by which to divide.
   * @return {!goog.math.Long} This Long divided by the given one.
   */
  goog.math.Long.prototype.div = function(other) {
    if (other.isZero()) {
      throw Error('division by zero');
    } else if (this.isZero()) {
      return goog.math.Long.ZERO;
    }
    if (this.equals(goog.math.Long.MIN_VALUE)) {
      if (other.equals(goog.math.Long.ONE) ||
          other.equals(goog.math.Long.NEG_ONE)) {
        return goog.math.Long.MIN_VALUE;  // recall that -MIN_VALUE == MIN_VALUE
      } else if (other.equals(goog.math.Long.MIN_VALUE)) {
        return goog.math.Long.ONE;
      } else {
        // At this point, we have |other| >= 2, so |this/other| < |MIN_VALUE|.
        var halfThis = this.shiftRight(1);
        var approx = halfThis.div(other).shiftLeft(1);
        if (approx.equals(goog.math.Long.ZERO)) {
          return other.isNegative() ? goog.math.Long.ONE : goog.math.Long.NEG_ONE;
        } else {
          var rem = this.subtract(other.multiply(approx));
          var result = approx.add(rem.div(other));
          return result;
        }
      }
    } else if (other.equals(goog.math.Long.MIN_VALUE)) {
      return goog.math.Long.ZERO;
    }
    if (this.isNegative()) {
      if (other.isNegative()) {
        return this.negate().div(other.negate());
      } else {
        return this.negate().div(other).negate();
      }
    } else if (other.isNegative()) {
      return this.div(other.negate()).negate();
    }
    // Repeat the following until the remainder is less than other:  find a
    // floating-point that approximates remainder / other *from below*, add this
    // into the result, and subtract it from the remainder.  It is critical that
    // the approximate value is less than or equal to the real value so that the
    // remainder never becomes negative.
    var res = goog.math.Long.ZERO;
    var rem = this;
    while (rem.greaterThanOrEqual(other)) {
      // Approximate the result of division. This may be a little greater or
      // smaller than the actual value.
      var approx = Math.max(1, Math.floor(rem.toNumber() / other.toNumber()));
      // We will tweak the approximate result by changing it in the 48-th digit or
      // the smallest non-fractional digit, whichever is larger.
      var log2 = Math.ceil(Math.log(approx) / Math.LN2);
      var delta = (log2 <= 48) ? 1 : Math.pow(2, log2 - 48);
      // Decrease the approximation until it is smaller than the remainder.  Note
      // that if it is too large, the product overflows and is negative.
      var approxRes = goog.math.Long.fromNumber(approx);
      var approxRem = approxRes.multiply(other);
      while (approxRem.isNegative() || approxRem.greaterThan(rem)) {
        approx -= delta;
        approxRes = goog.math.Long.fromNumber(approx);
        approxRem = approxRes.multiply(other);
      }
      // We know the answer can't be zero... and actually, zero would cause
      // infinite recursion since we would make no progress.
      if (approxRes.isZero()) {
        approxRes = goog.math.Long.ONE;
      }
      res = res.add(approxRes);
      rem = rem.subtract(approxRem);
    }
    return res;
  };
  /**
   * Returns this Long modulo the given one.
   * @param {goog.math.Long} other Long by which to mod.
   * @return {!goog.math.Long} This Long modulo the given one.
   */
  goog.math.Long.prototype.modulo = function(other) {
    return this.subtract(this.div(other).multiply(other));
  };
  /** @return {!goog.math.Long} The bitwise-NOT of this value. */
  goog.math.Long.prototype.not = function() {
    return goog.math.Long.fromBits(~this.low_, ~this.high_);
  };
  /**
   * Returns the bitwise-AND of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to AND.
   * @return {!goog.math.Long} The bitwise-AND of this and the other.
   */
  goog.math.Long.prototype.and = function(other) {
    return goog.math.Long.fromBits(this.low_ & other.low_,
                                   this.high_ & other.high_);
  };
  /**
   * Returns the bitwise-OR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to OR.
   * @return {!goog.math.Long} The bitwise-OR of this and the other.
   */
  goog.math.Long.prototype.or = function(other) {
    return goog.math.Long.fromBits(this.low_ | other.low_,
                                   this.high_ | other.high_);
  };
  /**
   * Returns the bitwise-XOR of this Long and the given one.
   * @param {goog.math.Long} other The Long with which to XOR.
   * @return {!goog.math.Long} The bitwise-XOR of this and the other.
   */
  goog.math.Long.prototype.xor = function(other) {
    return goog.math.Long.fromBits(this.low_ ^ other.low_,
                                   this.high_ ^ other.high_);
  };
  /**
   * Returns this Long with bits shifted to the left by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the left by the given amount.
   */
  goog.math.Long.prototype.shiftLeft = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var low = this.low_;
      if (numBits < 32) {
        var high = this.high_;
        return goog.math.Long.fromBits(
            low << numBits,
            (high << numBits) | (low >>> (32 - numBits)));
      } else {
        return goog.math.Long.fromBits(0, low << (numBits - 32));
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount.
   */
  goog.math.Long.prototype.shiftRight = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >> numBits);
      } else {
        return goog.math.Long.fromBits(
            high >> (numBits - 32),
            high >= 0 ? 0 : -1);
      }
    }
  };
  /**
   * Returns this Long with bits shifted to the right by the given amount, with
   * the new top bits matching the current sign bit.
   * @param {number} numBits The number of bits by which to shift.
   * @return {!goog.math.Long} This shifted to the right by the given amount, with
   *     zeros placed into the new leading bits.
   */
  goog.math.Long.prototype.shiftRightUnsigned = function(numBits) {
    numBits &= 63;
    if (numBits == 0) {
      return this;
    } else {
      var high = this.high_;
      if (numBits < 32) {
        var low = this.low_;
        return goog.math.Long.fromBits(
            (low >>> numBits) | (high << (32 - numBits)),
            high >>> numBits);
      } else if (numBits == 32) {
        return goog.math.Long.fromBits(high, 0);
      } else {
        return goog.math.Long.fromBits(high >>> (numBits - 32), 0);
      }
    }
  };
  //======= begin jsbn =======
  var navigator = { appName: 'Modern Browser' }; // polyfill a little
  // Copyright (c) 2005  Tom Wu
  // All Rights Reserved.
  // http://www-cs-students.stanford.edu/~tjw/jsbn/
  /*
   * Copyright (c) 2003-2005  Tom Wu
   * All Rights Reserved.
   *
   * Permission is hereby granted, free of charge, to any person obtaining
   * a copy of this software and associated documentation files (the
   * "Software"), to deal in the Software without restriction, including
   * without limitation the rights to use, copy, modify, merge, publish,
   * distribute, sublicense, and/or sell copies of the Software, and to
   * permit persons to whom the Software is furnished to do so, subject to
   * the following conditions:
   *
   * The above copyright notice and this permission notice shall be
   * included in all copies or substantial portions of the Software.
   *
   * THE SOFTWARE IS PROVIDED "AS-IS" AND WITHOUT WARRANTY OF ANY KIND, 
   * EXPRESS, IMPLIED OR OTHERWISE, INCLUDING WITHOUT LIMITATION, ANY 
   * WARRANTY OF MERCHANTABILITY OR FITNESS FOR A PARTICULAR PURPOSE.  
   *
   * IN NO EVENT SHALL TOM WU BE LIABLE FOR ANY SPECIAL, INCIDENTAL,
   * INDIRECT OR CONSEQUENTIAL DAMAGES OF ANY KIND, OR ANY DAMAGES WHATSOEVER
   * RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER OR NOT ADVISED OF
   * THE POSSIBILITY OF DAMAGE, AND ON ANY THEORY OF LIABILITY, ARISING OUT
   * OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
   *
   * In addition, the following condition applies:
   *
   * All redistributions must retain an intact copy of this copyright notice
   * and disclaimer.
   */
  // Basic JavaScript BN library - subset useful for RSA encryption.
  // Bits per digit
  var dbits;
  // JavaScript engine analysis
  var canary = 0xdeadbeefcafe;
  var j_lm = ((canary&0xffffff)==0xefcafe);
  // (public) Constructor
  function BigInteger(a,b,c) {
    if(a != null)
      if("number" == typeof a) this.fromNumber(a,b,c);
      else if(b == null && "string" != typeof a) this.fromString(a,256);
      else this.fromString(a,b);
  }
  // return new, unset BigInteger
  function nbi() { return new BigInteger(null); }
  // am: Compute w_j += (x*this_i), propagate carries,
  // c is initial carry, returns final carry.
  // c < 3*dvalue, x < 2*dvalue, this_i < dvalue
  // We need to select the fastest one that works in this environment.
  // am1: use a single mult and divide to get the high bits,
  // max digit bits should be 26 because
  // max internal value = 2*dvalue^2-2*dvalue (< 2^53)
  function am1(i,x,w,j,c,n) {
    while(--n >= 0) {
      var v = x*this[i++]+w[j]+c;
      c = Math.floor(v/0x4000000);
      w[j++] = v&0x3ffffff;
    }
    return c;
  }
  // am2 avoids a big mult-and-extract completely.
  // Max digit bits should be <= 30 because we do bitwise ops
  // on values up to 2*hdvalue^2-hdvalue-1 (< 2^31)
  function am2(i,x,w,j,c,n) {
    var xl = x&0x7fff, xh = x>>15;
    while(--n >= 0) {
      var l = this[i]&0x7fff;
      var h = this[i++]>>15;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x7fff)<<15)+w[j]+(c&0x3fffffff);
      c = (l>>>30)+(m>>>15)+xh*h+(c>>>30);
      w[j++] = l&0x3fffffff;
    }
    return c;
  }
  // Alternately, set max digit bits to 28 since some
  // browsers slow down when dealing with 32-bit numbers.
  function am3(i,x,w,j,c,n) {
    var xl = x&0x3fff, xh = x>>14;
    while(--n >= 0) {
      var l = this[i]&0x3fff;
      var h = this[i++]>>14;
      var m = xh*l+h*xl;
      l = xl*l+((m&0x3fff)<<14)+w[j]+c;
      c = (l>>28)+(m>>14)+xh*h;
      w[j++] = l&0xfffffff;
    }
    return c;
  }
  if(j_lm && (navigator.appName == "Microsoft Internet Explorer")) {
    BigInteger.prototype.am = am2;
    dbits = 30;
  }
  else if(j_lm && (navigator.appName != "Netscape")) {
    BigInteger.prototype.am = am1;
    dbits = 26;
  }
  else { // Mozilla/Netscape seems to prefer am3
    BigInteger.prototype.am = am3;
    dbits = 28;
  }
  BigInteger.prototype.DB = dbits;
  BigInteger.prototype.DM = ((1<<dbits)-1);
  BigInteger.prototype.DV = (1<<dbits);
  var BI_FP = 52;
  BigInteger.prototype.FV = Math.pow(2,BI_FP);
  BigInteger.prototype.F1 = BI_FP-dbits;
  BigInteger.prototype.F2 = 2*dbits-BI_FP;
  // Digit conversions
  var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
  var BI_RC = new Array();
  var rr,vv;
  rr = "0".charCodeAt(0);
  for(vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
  rr = "a".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  rr = "A".charCodeAt(0);
  for(vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
  function int2char(n) { return BI_RM.charAt(n); }
  function intAt(s,i) {
    var c = BI_RC[s.charCodeAt(i)];
    return (c==null)?-1:c;
  }
  // (protected) copy this to r
  function bnpCopyTo(r) {
    for(var i = this.t-1; i >= 0; --i) r[i] = this[i];
    r.t = this.t;
    r.s = this.s;
  }
  // (protected) set from integer value x, -DV <= x < DV
  function bnpFromInt(x) {
    this.t = 1;
    this.s = (x<0)?-1:0;
    if(x > 0) this[0] = x;
    else if(x < -1) this[0] = x+DV;
    else this.t = 0;
  }
  // return bigint initialized to value
  function nbv(i) { var r = nbi(); r.fromInt(i); return r; }
  // (protected) set from string and radix
  function bnpFromString(s,b) {
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 256) k = 8; // byte array
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else { this.fromRadix(s,b); return; }
    this.t = 0;
    this.s = 0;
    var i = s.length, mi = false, sh = 0;
    while(--i >= 0) {
      var x = (k==8)?s[i]&0xff:intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-") mi = true;
        continue;
      }
      mi = false;
      if(sh == 0)
        this[this.t++] = x;
      else if(sh+k > this.DB) {
        this[this.t-1] |= (x&((1<<(this.DB-sh))-1))<<sh;
        this[this.t++] = (x>>(this.DB-sh));
      }
      else
        this[this.t-1] |= x<<sh;
      sh += k;
      if(sh >= this.DB) sh -= this.DB;
    }
    if(k == 8 && (s[0]&0x80) != 0) {
      this.s = -1;
      if(sh > 0) this[this.t-1] |= ((1<<(this.DB-sh))-1)<<sh;
    }
    this.clamp();
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) clamp off excess high words
  function bnpClamp() {
    var c = this.s&this.DM;
    while(this.t > 0 && this[this.t-1] == c) --this.t;
  }
  // (public) return string representation in given radix
  function bnToString(b) {
    if(this.s < 0) return "-"+this.negate().toString(b);
    var k;
    if(b == 16) k = 4;
    else if(b == 8) k = 3;
    else if(b == 2) k = 1;
    else if(b == 32) k = 5;
    else if(b == 4) k = 2;
    else return this.toRadix(b);
    var km = (1<<k)-1, d, m = false, r = "", i = this.t;
    var p = this.DB-(i*this.DB)%k;
    if(i-- > 0) {
      if(p < this.DB && (d = this[i]>>p) > 0) { m = true; r = int2char(d); }
      while(i >= 0) {
        if(p < k) {
          d = (this[i]&((1<<p)-1))<<(k-p);
          d |= this[--i]>>(p+=this.DB-k);
        }
        else {
          d = (this[i]>>(p-=k))&km;
          if(p <= 0) { p += this.DB; --i; }
        }
        if(d > 0) m = true;
        if(m) r += int2char(d);
      }
    }
    return m?r:"0";
  }
  // (public) -this
  function bnNegate() { var r = nbi(); BigInteger.ZERO.subTo(this,r); return r; }
  // (public) |this|
  function bnAbs() { return (this.s<0)?this.negate():this; }
  // (public) return + if this > a, - if this < a, 0 if equal
  function bnCompareTo(a) {
    var r = this.s-a.s;
    if(r != 0) return r;
    var i = this.t;
    r = i-a.t;
    if(r != 0) return (this.s<0)?-r:r;
    while(--i >= 0) if((r=this[i]-a[i]) != 0) return r;
    return 0;
  }
  // returns bit length of the integer x
  function nbits(x) {
    var r = 1, t;
    if((t=x>>>16) != 0) { x = t; r += 16; }
    if((t=x>>8) != 0) { x = t; r += 8; }
    if((t=x>>4) != 0) { x = t; r += 4; }
    if((t=x>>2) != 0) { x = t; r += 2; }
    if((t=x>>1) != 0) { x = t; r += 1; }
    return r;
  }
  // (public) return the number of bits in "this"
  function bnBitLength() {
    if(this.t <= 0) return 0;
    return this.DB*(this.t-1)+nbits(this[this.t-1]^(this.s&this.DM));
  }
  // (protected) r = this << n*DB
  function bnpDLShiftTo(n,r) {
    var i;
    for(i = this.t-1; i >= 0; --i) r[i+n] = this[i];
    for(i = n-1; i >= 0; --i) r[i] = 0;
    r.t = this.t+n;
    r.s = this.s;
  }
  // (protected) r = this >> n*DB
  function bnpDRShiftTo(n,r) {
    for(var i = n; i < this.t; ++i) r[i-n] = this[i];
    r.t = Math.max(this.t-n,0);
    r.s = this.s;
  }
  // (protected) r = this << n
  function bnpLShiftTo(n,r) {
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<cbs)-1;
    var ds = Math.floor(n/this.DB), c = (this.s<<bs)&this.DM, i;
    for(i = this.t-1; i >= 0; --i) {
      r[i+ds+1] = (this[i]>>cbs)|c;
      c = (this[i]&bm)<<bs;
    }
    for(i = ds-1; i >= 0; --i) r[i] = 0;
    r[ds] = c;
    r.t = this.t+ds+1;
    r.s = this.s;
    r.clamp();
  }
  // (protected) r = this >> n
  function bnpRShiftTo(n,r) {
    r.s = this.s;
    var ds = Math.floor(n/this.DB);
    if(ds >= this.t) { r.t = 0; return; }
    var bs = n%this.DB;
    var cbs = this.DB-bs;
    var bm = (1<<bs)-1;
    r[0] = this[ds]>>bs;
    for(var i = ds+1; i < this.t; ++i) {
      r[i-ds-1] |= (this[i]&bm)<<cbs;
      r[i-ds] = this[i]>>bs;
    }
    if(bs > 0) r[this.t-ds-1] |= (this.s&bm)<<cbs;
    r.t = this.t-ds;
    r.clamp();
  }
  // (protected) r = this - a
  function bnpSubTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]-a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c -= a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c -= a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c -= a.s;
    }
    r.s = (c<0)?-1:0;
    if(c < -1) r[i++] = this.DV+c;
    else if(c > 0) r[i++] = c;
    r.t = i;
    r.clamp();
  }
  // (protected) r = this * a, r != this,a (HAC 14.12)
  // "this" should be the larger one if appropriate.
  function bnpMultiplyTo(a,r) {
    var x = this.abs(), y = a.abs();
    var i = x.t;
    r.t = i+y.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < y.t; ++i) r[i+x.t] = x.am(0,y[i],r,i,0,x.t);
    r.s = 0;
    r.clamp();
    if(this.s != a.s) BigInteger.ZERO.subTo(r,r);
  }
  // (protected) r = this^2, r != this (HAC 14.16)
  function bnpSquareTo(r) {
    var x = this.abs();
    var i = r.t = 2*x.t;
    while(--i >= 0) r[i] = 0;
    for(i = 0; i < x.t-1; ++i) {
      var c = x.am(i,x[i],r,2*i,0,1);
      if((r[i+x.t]+=x.am(i+1,2*x[i],r,2*i+1,c,x.t-i-1)) >= x.DV) {
        r[i+x.t] -= x.DV;
        r[i+x.t+1] = 1;
      }
    }
    if(r.t > 0) r[r.t-1] += x.am(i,x[i],r,2*i,0,1);
    r.s = 0;
    r.clamp();
  }
  // (protected) divide this by m, quotient and remainder to q, r (HAC 14.20)
  // r != q, this != m.  q or r may be null.
  function bnpDivRemTo(m,q,r) {
    var pm = m.abs();
    if(pm.t <= 0) return;
    var pt = this.abs();
    if(pt.t < pm.t) {
      if(q != null) q.fromInt(0);
      if(r != null) this.copyTo(r);
      return;
    }
    if(r == null) r = nbi();
    var y = nbi(), ts = this.s, ms = m.s;
    var nsh = this.DB-nbits(pm[pm.t-1]);	// normalize modulus
    if(nsh > 0) { pm.lShiftTo(nsh,y); pt.lShiftTo(nsh,r); }
    else { pm.copyTo(y); pt.copyTo(r); }
    var ys = y.t;
    var y0 = y[ys-1];
    if(y0 == 0) return;
    var yt = y0*(1<<this.F1)+((ys>1)?y[ys-2]>>this.F2:0);
    var d1 = this.FV/yt, d2 = (1<<this.F1)/yt, e = 1<<this.F2;
    var i = r.t, j = i-ys, t = (q==null)?nbi():q;
    y.dlShiftTo(j,t);
    if(r.compareTo(t) >= 0) {
      r[r.t++] = 1;
      r.subTo(t,r);
    }
    BigInteger.ONE.dlShiftTo(ys,t);
    t.subTo(y,y);	// "negative" y so we can replace sub with am later
    while(y.t < ys) y[y.t++] = 0;
    while(--j >= 0) {
      // Estimate quotient digit
      var qd = (r[--i]==y0)?this.DM:Math.floor(r[i]*d1+(r[i-1]+e)*d2);
      if((r[i]+=y.am(0,qd,r,j,0,ys)) < qd) {	// Try it out
        y.dlShiftTo(j,t);
        r.subTo(t,r);
        while(r[i] < --qd) r.subTo(t,r);
      }
    }
    if(q != null) {
      r.drShiftTo(ys,q);
      if(ts != ms) BigInteger.ZERO.subTo(q,q);
    }
    r.t = ys;
    r.clamp();
    if(nsh > 0) r.rShiftTo(nsh,r);	// Denormalize remainder
    if(ts < 0) BigInteger.ZERO.subTo(r,r);
  }
  // (public) this mod a
  function bnMod(a) {
    var r = nbi();
    this.abs().divRemTo(a,null,r);
    if(this.s < 0 && r.compareTo(BigInteger.ZERO) > 0) a.subTo(r,r);
    return r;
  }
  // Modular reduction using "classic" algorithm
  function Classic(m) { this.m = m; }
  function cConvert(x) {
    if(x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
    else return x;
  }
  function cRevert(x) { return x; }
  function cReduce(x) { x.divRemTo(this.m,null,x); }
  function cMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  function cSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  Classic.prototype.convert = cConvert;
  Classic.prototype.revert = cRevert;
  Classic.prototype.reduce = cReduce;
  Classic.prototype.mulTo = cMulTo;
  Classic.prototype.sqrTo = cSqrTo;
  // (protected) return "-1/this % 2^DB"; useful for Mont. reduction
  // justification:
  //         xy == 1 (mod m)
  //         xy =  1+km
  //   xy(2-xy) = (1+km)(1-km)
  // x[y(2-xy)] = 1-k^2m^2
  // x[y(2-xy)] == 1 (mod m^2)
  // if y is 1/x mod m, then y(2-xy) is 1/x mod m^2
  // should reduce x and y(2-xy) by m^2 at each step to keep size bounded.
  // JS multiply "overflows" differently from C/C++, so care is needed here.
  function bnpInvDigit() {
    if(this.t < 1) return 0;
    var x = this[0];
    if((x&1) == 0) return 0;
    var y = x&3;		// y == 1/x mod 2^2
    y = (y*(2-(x&0xf)*y))&0xf;	// y == 1/x mod 2^4
    y = (y*(2-(x&0xff)*y))&0xff;	// y == 1/x mod 2^8
    y = (y*(2-(((x&0xffff)*y)&0xffff)))&0xffff;	// y == 1/x mod 2^16
    // last step - calculate inverse mod DV directly;
    // assumes 16 < DB <= 32 and assumes ability to handle 48-bit ints
    y = (y*(2-x*y%this.DV))%this.DV;		// y == 1/x mod 2^dbits
    // we really want the negative inverse, and -DV < y < DV
    return (y>0)?this.DV-y:-y;
  }
  // Montgomery reduction
  function Montgomery(m) {
    this.m = m;
    this.mp = m.invDigit();
    this.mpl = this.mp&0x7fff;
    this.mph = this.mp>>15;
    this.um = (1<<(m.DB-15))-1;
    this.mt2 = 2*m.t;
  }
  // xR mod m
  function montConvert(x) {
    var r = nbi();
    x.abs().dlShiftTo(this.m.t,r);
    r.divRemTo(this.m,null,r);
    if(x.s < 0 && r.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r,r);
    return r;
  }
  // x/R mod m
  function montRevert(x) {
    var r = nbi();
    x.copyTo(r);
    this.reduce(r);
    return r;
  }
  // x = x/R mod m (HAC 14.32)
  function montReduce(x) {
    while(x.t <= this.mt2)	// pad x so am has enough room later
      x[x.t++] = 0;
    for(var i = 0; i < this.m.t; ++i) {
      // faster way of calculating u0 = x[i]*mp mod DV
      var j = x[i]&0x7fff;
      var u0 = (j*this.mpl+(((j*this.mph+(x[i]>>15)*this.mpl)&this.um)<<15))&x.DM;
      // use am to combine the multiply-shift-add into one call
      j = i+this.m.t;
      x[j] += this.m.am(0,u0,x,i,0,this.m.t);
      // propagate carry
      while(x[j] >= x.DV) { x[j] -= x.DV; x[++j]++; }
    }
    x.clamp();
    x.drShiftTo(this.m.t,x);
    if(x.compareTo(this.m) >= 0) x.subTo(this.m,x);
  }
  // r = "x^2/R mod m"; x != r
  function montSqrTo(x,r) { x.squareTo(r); this.reduce(r); }
  // r = "xy/R mod m"; x,y != r
  function montMulTo(x,y,r) { x.multiplyTo(y,r); this.reduce(r); }
  Montgomery.prototype.convert = montConvert;
  Montgomery.prototype.revert = montRevert;
  Montgomery.prototype.reduce = montReduce;
  Montgomery.prototype.mulTo = montMulTo;
  Montgomery.prototype.sqrTo = montSqrTo;
  // (protected) true iff this is even
  function bnpIsEven() { return ((this.t>0)?(this[0]&1):this.s) == 0; }
  // (protected) this^e, e < 2^32, doing sqr and mul with "r" (HAC 14.79)
  function bnpExp(e,z) {
    if(e > 0xffffffff || e < 1) return BigInteger.ONE;
    var r = nbi(), r2 = nbi(), g = z.convert(this), i = nbits(e)-1;
    g.copyTo(r);
    while(--i >= 0) {
      z.sqrTo(r,r2);
      if((e&(1<<i)) > 0) z.mulTo(r2,g,r);
      else { var t = r; r = r2; r2 = t; }
    }
    return z.revert(r);
  }
  // (public) this^e % m, 0 <= e < 2^32
  function bnModPowInt(e,m) {
    var z;
    if(e < 256 || m.isEven()) z = new Classic(m); else z = new Montgomery(m);
    return this.exp(e,z);
  }
  // protected
  BigInteger.prototype.copyTo = bnpCopyTo;
  BigInteger.prototype.fromInt = bnpFromInt;
  BigInteger.prototype.fromString = bnpFromString;
  BigInteger.prototype.clamp = bnpClamp;
  BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
  BigInteger.prototype.drShiftTo = bnpDRShiftTo;
  BigInteger.prototype.lShiftTo = bnpLShiftTo;
  BigInteger.prototype.rShiftTo = bnpRShiftTo;
  BigInteger.prototype.subTo = bnpSubTo;
  BigInteger.prototype.multiplyTo = bnpMultiplyTo;
  BigInteger.prototype.squareTo = bnpSquareTo;
  BigInteger.prototype.divRemTo = bnpDivRemTo;
  BigInteger.prototype.invDigit = bnpInvDigit;
  BigInteger.prototype.isEven = bnpIsEven;
  BigInteger.prototype.exp = bnpExp;
  // public
  BigInteger.prototype.toString = bnToString;
  BigInteger.prototype.negate = bnNegate;
  BigInteger.prototype.abs = bnAbs;
  BigInteger.prototype.compareTo = bnCompareTo;
  BigInteger.prototype.bitLength = bnBitLength;
  BigInteger.prototype.mod = bnMod;
  BigInteger.prototype.modPowInt = bnModPowInt;
  // "constants"
  BigInteger.ZERO = nbv(0);
  BigInteger.ONE = nbv(1);
  // jsbn2 stuff
  // (protected) convert from radix string
  function bnpFromRadix(s,b) {
    this.fromInt(0);
    if(b == null) b = 10;
    var cs = this.chunkSize(b);
    var d = Math.pow(b,cs), mi = false, j = 0, w = 0;
    for(var i = 0; i < s.length; ++i) {
      var x = intAt(s,i);
      if(x < 0) {
        if(s.charAt(i) == "-" && this.signum() == 0) mi = true;
        continue;
      }
      w = b*w+x;
      if(++j >= cs) {
        this.dMultiply(d);
        this.dAddOffset(w,0);
        j = 0;
        w = 0;
      }
    }
    if(j > 0) {
      this.dMultiply(Math.pow(b,j));
      this.dAddOffset(w,0);
    }
    if(mi) BigInteger.ZERO.subTo(this,this);
  }
  // (protected) return x s.t. r^x < DV
  function bnpChunkSize(r) { return Math.floor(Math.LN2*this.DB/Math.log(r)); }
  // (public) 0 if this == 0, 1 if this > 0
  function bnSigNum() {
    if(this.s < 0) return -1;
    else if(this.t <= 0 || (this.t == 1 && this[0] <= 0)) return 0;
    else return 1;
  }
  // (protected) this *= n, this >= 0, 1 < n < DV
  function bnpDMultiply(n) {
    this[this.t] = this.am(0,n-1,this,0,0,this.t);
    ++this.t;
    this.clamp();
  }
  // (protected) this += n << w words, this >= 0
  function bnpDAddOffset(n,w) {
    if(n == 0) return;
    while(this.t <= w) this[this.t++] = 0;
    this[w] += n;
    while(this[w] >= this.DV) {
      this[w] -= this.DV;
      if(++w >= this.t) this[this.t++] = 0;
      ++this[w];
    }
  }
  // (protected) convert to radix string
  function bnpToRadix(b) {
    if(b == null) b = 10;
    if(this.signum() == 0 || b < 2 || b > 36) return "0";
    var cs = this.chunkSize(b);
    var a = Math.pow(b,cs);
    var d = nbv(a), y = nbi(), z = nbi(), r = "";
    this.divRemTo(d,y,z);
    while(y.signum() > 0) {
      r = (a+z.intValue()).toString(b).substr(1) + r;
      y.divRemTo(d,y,z);
    }
    return z.intValue().toString(b) + r;
  }
  // (public) return value as integer
  function bnIntValue() {
    if(this.s < 0) {
      if(this.t == 1) return this[0]-this.DV;
      else if(this.t == 0) return -1;
    }
    else if(this.t == 1) return this[0];
    else if(this.t == 0) return 0;
    // assumes 16 < DB < 32
    return ((this[1]&((1<<(32-this.DB))-1))<<this.DB)|this[0];
  }
  // (protected) r = this + a
  function bnpAddTo(a,r) {
    var i = 0, c = 0, m = Math.min(a.t,this.t);
    while(i < m) {
      c += this[i]+a[i];
      r[i++] = c&this.DM;
      c >>= this.DB;
    }
    if(a.t < this.t) {
      c += a.s;
      while(i < this.t) {
        c += this[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += this.s;
    }
    else {
      c += this.s;
      while(i < a.t) {
        c += a[i];
        r[i++] = c&this.DM;
        c >>= this.DB;
      }
      c += a.s;
    }
    r.s = (c<0)?-1:0;
    if(c > 0) r[i++] = c;
    else if(c < -1) r[i++] = this.DV+c;
    r.t = i;
    r.clamp();
  }
  BigInteger.prototype.fromRadix = bnpFromRadix;
  BigInteger.prototype.chunkSize = bnpChunkSize;
  BigInteger.prototype.signum = bnSigNum;
  BigInteger.prototype.dMultiply = bnpDMultiply;
  BigInteger.prototype.dAddOffset = bnpDAddOffset;
  BigInteger.prototype.toRadix = bnpToRadix;
  BigInteger.prototype.intValue = bnIntValue;
  BigInteger.prototype.addTo = bnpAddTo;
  //======= end jsbn =======
  // Emscripten wrapper
  var Wrapper = {
    abs: function(l, h) {
      var x = new goog.math.Long(l, h);
      var ret;
      if (x.isNegative()) {
        ret = x.negate();
      } else {
        ret = x;
      }
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
    },
    ensureTemps: function() {
      if (Wrapper.ensuredTemps) return;
      Wrapper.ensuredTemps = true;
      Wrapper.two32 = new BigInteger();
      Wrapper.two32.fromString('4294967296', 10);
      Wrapper.two64 = new BigInteger();
      Wrapper.two64.fromString('18446744073709551616', 10);
      Wrapper.temp1 = new BigInteger();
      Wrapper.temp2 = new BigInteger();
    },
    lh2bignum: function(l, h) {
      var a = new BigInteger();
      a.fromString(h.toString(), 10);
      var b = new BigInteger();
      a.multiplyTo(Wrapper.two32, b);
      var c = new BigInteger();
      c.fromString(l.toString(), 10);
      var d = new BigInteger();
      c.addTo(b, d);
      return d;
    },
    stringify: function(l, h, unsigned) {
      var ret = new goog.math.Long(l, h).toString();
      if (unsigned && ret[0] == '-') {
        // unsign slowly using jsbn bignums
        Wrapper.ensureTemps();
        var bignum = new BigInteger();
        bignum.fromString(ret, 10);
        ret = new BigInteger();
        Wrapper.two64.addTo(bignum, ret);
        ret = ret.toString(10);
      }
      return ret;
    },
    fromString: function(str, base, min, max, unsigned) {
      Wrapper.ensureTemps();
      var bignum = new BigInteger();
      bignum.fromString(str, base);
      var bigmin = new BigInteger();
      bigmin.fromString(min, 10);
      var bigmax = new BigInteger();
      bigmax.fromString(max, 10);
      if (unsigned && bignum.compareTo(BigInteger.ZERO) < 0) {
        var temp = new BigInteger();
        bignum.addTo(Wrapper.two64, temp);
        bignum = temp;
      }
      var error = false;
      if (bignum.compareTo(bigmin) < 0) {
        bignum = bigmin;
        error = true;
      } else if (bignum.compareTo(bigmax) > 0) {
        bignum = bigmax;
        error = true;
      }
      var ret = goog.math.Long.fromString(bignum.toString()); // min-max checks should have clamped this to a range goog.math.Long can handle well
      HEAP32[tempDoublePtr>>2] = ret.low_;
      HEAP32[tempDoublePtr+4>>2] = ret.high_;
      if (error) throw 'range error';
    }
  };
  return Wrapper;
})();
//======= end closure i64 code =======
// === Auto-generated postamble setup entry stuff ===
var initialStackTop;
var inMain;
Module['callMain'] = Module.callMain = function callMain(args) {
  assert(runDependencies == 0, 'cannot call main when async dependencies remain! (listen on __ATMAIN__)');
  assert(__ATPRERUN__.length == 0, 'cannot call main when preRun functions remain to be called');
  args = args || [];
  ensureInitRuntime();
  var argc = args.length+1;
  function pad() {
    for (var i = 0; i < 4-1; i++) {
      argv.push(0);
    }
  }
  var argv = [allocate(intArrayFromString("/bin/this.program"), 'i8', ALLOC_NORMAL) ];
  pad();
  for (var i = 0; i < argc-1; i = i + 1) {
    argv.push(allocate(intArrayFromString(args[i]), 'i8', ALLOC_NORMAL));
    pad();
  }
  argv.push(0);
  argv = allocate(argv, 'i32', ALLOC_NORMAL);
  initialStackTop = STACKTOP;
  inMain = true;
  var ret;
  try {
    ret = Module['_main'](argc, argv, 0);
  }
  catch(e) {
    if (e && typeof e == 'object' && e.type == 'ExitStatus') {
      // exit() throws this once it's done to make sure execution
      // has been stopped completely
      Module.print('Exit Status: ' + e.value);
      return e.value;
    } else if (e == 'SimulateInfiniteLoop') {
      // running an evented main loop, don't immediately exit
      Module['noExitRuntime'] = true;
    } else {
      throw e;
    }
  } finally {
    inMain = false;
  }
  // if we're not running an evented main loop, it's time to exit
  if (!Module['noExitRuntime']) {
    exit(ret);
  }
}
function run(args) {
  args = args || Module['arguments'];
  if (runDependencies > 0) {
    Module.printErr('run() called, but dependencies remain, so not running');
    return;
  }
  preRun();
  if (runDependencies > 0) {
    // a preRun added a dependency, run will be called later
    return;
  }
  function doRun() {
    ensureInitRuntime();
    preMain();
    calledRun = true;
    if (Module['_main'] && shouldRunNow) {
      Module['callMain'](args);
    }
    postRun();
  }
  if (Module['setStatus']) {
    Module['setStatus']('Running...');
    setTimeout(function() {
      setTimeout(function() {
        Module['setStatus']('');
      }, 1);
      if (!ABORT) doRun();
    }, 1);
  } else {
    doRun();
  }
}
Module['run'] = Module.run = run;
function exit(status) {
  ABORT = true;
  STACKTOP = initialStackTop;
  // TODO call externally added 'exit' callbacks with the status code.
  // It'd be nice to provide the same interface for all Module events (e.g.
  // prerun, premain, postmain). Perhaps an EventEmitter so we can do:
  // Module.on('exit', function (status) {});
  // exit the runtime
  exitRuntime();
  if (inMain) {
    // if we're still inside the callMain's try/catch, we need to throw an
    // exception in order to immediately terminate execution.
    throw { type: 'ExitStatus', value: status };
  }
}
Module['exit'] = Module.exit = exit;
function abort(text) {
  if (text) {
    Module.print(text);
  }
  ABORT = true;
  throw 'abort() at ' + (new Error().stack);
}
Module['abort'] = Module.abort = abort;
// {{PRE_RUN_ADDITIONS}}
if (Module['preInit']) {
  if (typeof Module['preInit'] == 'function') Module['preInit'] = [Module['preInit']];
  while (Module['preInit'].length > 0) {
    Module['preInit'].pop()();
  }
}
// shouldRunNow refers to calling main(), not run().
var shouldRunNow = true;
if (Module['noInitialRun']) {
  shouldRunNow = false;
}
run();
// {{POST_RUN_ADDITIONS}}
// {{MODULE_ADDITIONS}}
// libshine function wrappers
var isNode = typeof process === "object" && typeof require === "function";
var int16Len = Module.HEAP16.BYTES_PER_ELEMENT;
var ptrLen   = Module.HEAP32.BYTES_PER_ELEMENT;
function Shine(args) {
  if (_shine_check_config(args.samplerate, args.bitrate) < 0)
    throw "Invalid configuration";
  var mode;
  if (!args.mode) {
    if (args.channels === 1) {
      mode = Shine.MONO;
    } else {
      mode = Shine.JOINT_STEREO;
    }
  } else {
    mode = args.mode;
  }
  this._handle = _shine_js_init(args.channels, args.samplerate, mode, args.bitrate);
  this._channels = args.channels;
  this._samples_per_pass = _shine_samples_per_pass(this._handle);
  this._buffer = _malloc(this._channels * ptrLen);
  this._pcm = new Array(this._channels);
  this._rem = new Array(this._channels);
  this._written = _malloc(int16Len);
  var _tmp, chan;
  for (chan=0; chan<this._channels; chan++) {
    this._rem[chan] = new Int16Array;
    _tmp = _malloc(this._samples_per_pass * int16Len);
    setValue(this._buffer + chan*ptrLen, _tmp, "*")
    this._pcm[chan] = Module.HEAP16.subarray(_tmp/int16Len, _tmp/int16Len+this._samples_per_pass) 
  }
  return this; 
};
Shine.STEREO = 0;
Shine.JOINT_STEREO = 1;
Shine.DUAL_CHANNEL = 2;
Shine.MONO = 3;
Shine.prototype._encodePass = function (data) {
  if (!this._handle)
    throw "Closed";
  var chan;
  for (chan=0;chan<this._channels;chan++)
    this._pcm[chan].set(data[chan]);
  var _buf = _shine_encode_buffer(this._handle, this._buffer, this._written);
  var written = getValue(this._written, "i16"); 
  return Module.HEAPU8.subarray(_buf, _buf+written);
};
function concat(ctr, a, b) {
  if (typeof b === "undefined") {
    return a;
  }
  var ret = new ctr(a.length+b.length);
  ret.set(a);
  ret.subarray(a.length).set(b);
  return ret;
}
function clip(x) {
  return (x > 1 ? 1 : (x < -1 ? -1 : x));
}
function convertFloat32(buf) {
  var ret = new Array(buf.length);
  var samples = buf[0].length;
  var chan, i;
  for (chan=0;chan<buf.length;chan++) {
    ret[chan] = new Int16Array(samples);
    for (i=0;i<samples;i++) {
      ret[chan][i] = parseInt(clip(buf[chan][i]) * 32767);
    }
  }
  return ret;
}
Shine.prototype.encode = function (data) {
  if (data.length != this._channels)
    throw "Invalid data";
  var encoded = new Uint8Array;  
  var tmp = new Array(this._channels);
  if (data[0] instanceof Float32Array) {
    data = convertFloat32(data);
  }
  var chan;
  for (chan=0;chan<this._channels; chan++) {
    tmp[chan] = new Float32Array;
    this._rem[chan] = concat(Int16Array, this._rem[chan], data[chan]);
  }
  var i, enc;
  for (i=0;i<this._rem[0].length;i+=this._samples_per_pass) {
    for (chan=0; chan<this._channels; chan++) {
      tmp[chan] = this._rem[chan].subarray(i, i+this._samples_per_pass);
    }
    if (tmp[0].length < this._samples_per_pass) {
      break;
    } else {
      enc = this._encodePass(tmp);
      if (enc.length > 0) {
        encoded = concat(Uint8Array, encoded, enc);   
      }
    }
  }
  if (tmp[0].length < this._samples_per_pass) {
    this._rem = tmp;
  } else {
    for (chan=0; chan<this._channels; chan++) {
      this._rem[chan] = new Int16Array;
    }
  }
  return encoded;
};
Shine.prototype.close = function () {
  if (!this._handle) {
    throw "Closed";
  }
  var _buf = _shine_flush(this._handle, this._written);
  var written = getValue(this._written, "i16");
  var encoded = new Uint8Array(written);
  encoded.set(Module.HEAPU8.subarray(_buf, _buf + written));
  _free(this._written);
  _shine_close(this._handle);
  this._handle = null;
  var chan;
  for (chan=0; chan<this._channels; chan++) {
    _free(getValue(this._buffer + chan*ptrLen, "*"));
  }
  _free(this._buffer);
  return encoded;
};
if (isNode) {
  module.exports = Shine;
}
return Shine;
}).call(context)})();
