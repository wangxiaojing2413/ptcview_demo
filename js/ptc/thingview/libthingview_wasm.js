var Module = typeof Module !== "undefined" ? Module: {};
var moduleOverrides = {};
var key;
for (key in Module) {
    if (Module.hasOwnProperty(key)) {
        moduleOverrides[key] = Module[key]
    }
}
var arguments_ = [];
var thisProgram = "./this.program";
var quit_ = function(status, toThrow) {
    throw toThrow
};
var ENVIRONMENT_IS_WEB = false;
var ENVIRONMENT_IS_WORKER = false;
var ENVIRONMENT_IS_NODE = false;
var ENVIRONMENT_HAS_NODE = false;
var ENVIRONMENT_IS_SHELL = false;
ENVIRONMENT_IS_WEB = typeof window === "object";
ENVIRONMENT_IS_WORKER = typeof importScripts === "function";
ENVIRONMENT_HAS_NODE = typeof process === "object" && typeof process.versions === "object" && typeof process.versions.node === "string";
ENVIRONMENT_IS_NODE = ENVIRONMENT_HAS_NODE && !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_WORKER;
ENVIRONMENT_IS_SHELL = !ENVIRONMENT_IS_WEB && !ENVIRONMENT_IS_NODE && !ENVIRONMENT_IS_WORKER;
var scriptDirectory = "";
function locateFile(path) {
    if (Module["locateFile"]) {
        return Module["locateFile"](path, scriptDirectory)
    }
    return scriptDirectory + path
}
var read_, readAsync, readBinary, setWindowTitle;
if (ENVIRONMENT_IS_NODE) {
    scriptDirectory = __dirname + "/";
    var nodeFS;
    var nodePath;
    read_ = function shell_read(filename, binary) {
        var ret;
        if (!nodeFS) nodeFS = require("fs");
        if (!nodePath) nodePath = require("path");
        filename = nodePath["normalize"](filename);
        ret = nodeFS["readFileSync"](filename);
        return binary ? ret: ret.toString()
    };
    readBinary = function readBinary(filename) {
        var ret = read_(filename, true);
        if (!ret.buffer) {
            ret = new Uint8Array(ret)
        }
        assert(ret.buffer);
        return ret
    };
    if (process["argv"].length > 1) {
        thisProgram = process["argv"][1].replace(/\\/g, "/")
    }
    arguments_ = process["argv"].slice(2);
    if (typeof module !== "undefined") {
        module["exports"] = Module
    }
    process["on"]("uncaughtException",
        function(ex) {
            if (! (ex instanceof ExitStatus)) {
                throw ex
            }
        });
    process["on"]("unhandledRejection", abort);
    quit_ = function(status) {
        process["exit"](status)
    };
    Module["inspect"] = function() {
        return "[Emscripten Module object]"
    }
} else if (ENVIRONMENT_IS_SHELL) {
    if (typeof read != "undefined") {
        read_ = function shell_read(f) {
            return read(f)
        }
    }
    readBinary = function readBinary(f) {
        var data;
        if (typeof readbuffer === "function") {
            return new Uint8Array(readbuffer(f))
        }
        data = read(f, "binary");
        assert(typeof data === "object");
        return data
    };
    if (typeof scriptArgs != "undefined") {
        arguments_ = scriptArgs
    } else if (typeof arguments != "undefined") {
        arguments_ = arguments
    }
    if (typeof quit === "function") {
        quit_ = function(status) {
            quit(status)
        }
    }
    if (typeof print !== "undefined") {
        if (typeof console === "undefined") console = {};
        console.log = print;
        console.warn = console.error = typeof printErr !== "undefined" ? printErr: print
    }
} else if (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) {
    if (ENVIRONMENT_IS_WORKER) {
        scriptDirectory = self.location.href
    } else if (document.currentScript) {
        scriptDirectory = document.currentScript.src
    }
    if (scriptDirectory.indexOf("blob:") !== 0) {
        scriptDirectory = scriptDirectory.substr(0, scriptDirectory.lastIndexOf("/") + 1)
    } else {
        scriptDirectory = ""
    }
    read_ = function shell_read(url) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, false);
        xhr.send(null);
        return xhr.responseText
    };
    if (ENVIRONMENT_IS_WORKER) {
        readBinary = function readBinary(url) {
            var xhr = new XMLHttpRequest;
            xhr.open("GET", url, false);
            xhr.responseType = "arraybuffer";
            xhr.send(null);
            return new Uint8Array(xhr.response)
        }
    }
    readAsync = function readAsync(url, onload, onerror) {
        var xhr = new XMLHttpRequest;
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.onload = function xhr_onload() {
            if (xhr.status == 200 || xhr.status == 0 && xhr.response) {
                onload(xhr.response);
                return
            }
            onerror()
        };
        xhr.onerror = onerror;
        xhr.send(null)
    };
    setWindowTitle = function(title) {
        document.title = title
    }
} else {}
var out = Module["print"] || console.log.bind(console);
var err = Module["printErr"] || console.warn.bind(console);
for (key in moduleOverrides) {
    if (moduleOverrides.hasOwnProperty(key)) {
        Module[key] = moduleOverrides[key]
    }
}
moduleOverrides = null;
if (Module["arguments"]) arguments_ = Module["arguments"];
if (Module["thisProgram"]) thisProgram = Module["thisProgram"];
if (Module["quit"]) quit_ = Module["quit"];
function dynamicAlloc(size) {
    var ret = HEAP32[DYNAMICTOP_PTR >> 2];
    var end = ret + size + 15 & -16;
    if (end > _emscripten_get_heap_size()) {
        abort()
    }
    HEAP32[DYNAMICTOP_PTR >> 2] = end;
    return ret
}
function getNativeTypeSize(type) {
    switch (type) {
        case "i1":
        case "i8":
            return 1;
        case "i16":
            return 2;
        case "i32":
            return 4;
        case "i64":
            return 8;
        case "float":
            return 4;
        case "double":
            return 8;
        default:
        {
            if (type[type.length - 1] === "*") {
                return 4
            } else if (type[0] === "i") {
                var bits = parseInt(type.substr(1));
                assert(bits % 8 === 0, "getNativeTypeSize invalid bits " + bits + ", type " + type);
                return bits / 8
            } else {
                return 0
            }
        }
    }
}
function warnOnce(text) {
    if (!warnOnce.shown) warnOnce.shown = {};
    if (!warnOnce.shown[text]) {
        warnOnce.shown[text] = 1;
        err(text)
    }
}
var funcWrappers = {};
function getFuncWrapper(func, sig) {
    if (!func) return;
    assert(sig);
    if (!funcWrappers[sig]) {
        funcWrappers[sig] = {}
    }
    var sigCache = funcWrappers[sig];
    if (!sigCache[func]) {
        if (sig.length === 1) {
            sigCache[func] = function dynCall_wrapper() {
                return dynCall(sig, func)
            }
        } else if (sig.length === 2) {
            sigCache[func] = function dynCall_wrapper(arg) {
                return dynCall(sig, func, [arg])
            }
        } else {
            sigCache[func] = function dynCall_wrapper() {
                return dynCall(sig, func, Array.prototype.slice.call(arguments))
            }
        }
    }
    return sigCache[func]
}
function dynCall(sig, ptr, args) {
    if (args && args.length) {
        return Module["dynCall_" + sig].apply(null, [ptr].concat(args))
    } else {
        return Module["dynCall_" + sig].call(null, ptr)
    }
}
var tempRet0 = 0;
var setTempRet0 = function(value) {
    tempRet0 = value
};
var getTempRet0 = function() {
    return tempRet0
};
var wasmBinary;
if (Module["wasmBinary"]) wasmBinary = Module["wasmBinary"];
var noExitRuntime;
if (Module["noExitRuntime"]) noExitRuntime = Module["noExitRuntime"];
if (typeof WebAssembly !== "object") {
    err("no native wasm support detected")
}
function setValue(ptr, value, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            HEAP8[ptr >> 0] = value;
            break;
        case "i8":
            HEAP8[ptr >> 0] = value;
            break;
        case "i16":
            HEAP16[ptr >> 1] = value;
            break;
        case "i32":
            HEAP32[ptr >> 2] = value;
            break;
        case "i64":
            tempI64 = [value >>> 0, (tempDouble = value, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min( + Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~ + Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
                HEAP32[ptr >> 2] = tempI64[0],
                HEAP32[ptr + 4 >> 2] = tempI64[1];
            break;
        case "float":
            HEAPF32[ptr >> 2] = value;
            break;
        case "double":
            HEAPF64[ptr >> 3] = value;
            break;
        default:
            abort("invalid type for setValue: " + type)
    }
}
function getValue(ptr, type, noSafe) {
    type = type || "i8";
    if (type.charAt(type.length - 1) === "*") type = "i32";
    switch (type) {
        case "i1":
            return HEAP8[ptr >> 0];
        case "i8":
            return HEAP8[ptr >> 0];
        case "i16":
            return HEAP16[ptr >> 1];
        case "i32":
            return HEAP32[ptr >> 2];
        case "i64":
            return HEAP32[ptr >> 2];
        case "float":
            return HEAPF32[ptr >> 2];
        case "double":
            return HEAPF64[ptr >> 3];
        default:
            abort("invalid type for getValue: " + type)
    }
    return null
}
var wasmMemory;
var wasmTable;
var ABORT = false;
var EXITSTATUS = 0;
function assert(condition, text) {
    if (!condition) {
        abort("Assertion failed: " + text)
    }
}
var ALLOC_NORMAL = 0;
var ALLOC_NONE = 3;
function allocate(slab, types, allocator, ptr) {
    var zeroinit, size;
    if (typeof slab === "number") {
        zeroinit = true;
        size = slab
    } else {
        zeroinit = false;
        size = slab.length
    }
    var singleType = typeof types === "string" ? types: null;
    var ret;
    if (allocator == ALLOC_NONE) {
        ret = ptr
    } else {
        ret = [_malloc, stackAlloc, dynamicAlloc][allocator](Math.max(size, singleType ? 1 : types.length))
    }
    if (zeroinit) {
        var stop;
        ptr = ret;
        assert((ret & 3) == 0);
        stop = ret + (size & ~3);
        for (; ptr < stop; ptr += 4) {
            HEAP32[ptr >> 2] = 0
        }
        stop = ret + size;
        while (ptr < stop) {
            HEAP8[ptr++>>0] = 0
        }
        return ret
    }
    if (singleType === "i8") {
        if (slab.subarray || slab.slice) {
            HEAPU8.set(slab, ret)
        } else {
            HEAPU8.set(new Uint8Array(slab), ret)
        }
        return ret
    }
    var i = 0,
        type, typeSize, previousType;
    while (i < size) {
        var curr = slab[i];
        type = singleType || types[i];
        if (type === 0) {
            i++;
            continue
        }
        if (type == "i64") type = "i32";
        setValue(ret + i, curr, type);
        if (previousType !== type) {
            typeSize = getNativeTypeSize(type);
            previousType = type
        }
        i += typeSize
    }
    return ret
}
function getMemory(size) {
    if (!runtimeInitialized) return dynamicAlloc(size);
    return _malloc(size)
}
function AsciiToString(ptr) {
    var str = "";
    while (1) {
        var ch = HEAPU8[ptr++>>0];
        if (!ch) return str;
        str += String.fromCharCode(ch)
    }
}
var UTF8Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf8") : undefined;
function UTF8ArrayToString(u8Array, idx, maxBytesToRead) {
    var endIdx = idx + maxBytesToRead;
    var endPtr = idx;
    while (u8Array[endPtr] && !(endPtr >= endIdx))++endPtr;
    if (endPtr - idx > 16 && u8Array.subarray && UTF8Decoder) {
        return UTF8Decoder.decode(u8Array.subarray(idx, endPtr))
    } else {
        var str = "";
        while (idx < endPtr) {
            var u0 = u8Array[idx++];
            if (! (u0 & 128)) {
                str += String.fromCharCode(u0);
                continue
            }
            var u1 = u8Array[idx++] & 63;
            if ((u0 & 224) == 192) {
                str += String.fromCharCode((u0 & 31) << 6 | u1);
                continue
            }
            var u2 = u8Array[idx++] & 63;
            if ((u0 & 240) == 224) {
                u0 = (u0 & 15) << 12 | u1 << 6 | u2
            } else {
                u0 = (u0 & 7) << 18 | u1 << 12 | u2 << 6 | u8Array[idx++] & 63
            }
            if (u0 < 65536) {
                str += String.fromCharCode(u0)
            } else {
                var ch = u0 - 65536;
                str += String.fromCharCode(55296 | ch >> 10, 56320 | ch & 1023)
            }
        }
    }
    return str
}
function UTF8ToString(ptr, maxBytesToRead) {
    return ptr ? UTF8ArrayToString(HEAPU8, ptr, maxBytesToRead) : ""
}
function stringToUTF8Array(str, outU8Array, outIdx, maxBytesToWrite) {
    if (! (maxBytesToWrite > 0)) return 0;
    var startIdx = outIdx;
    var endIdx = outIdx + maxBytesToWrite - 1;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) {
            var u1 = str.charCodeAt(++i);
            u = 65536 + ((u & 1023) << 10) | u1 & 1023
        }
        if (u <= 127) {
            if (outIdx >= endIdx) break;
            outU8Array[outIdx++] = u
        } else if (u <= 2047) {
            if (outIdx + 1 >= endIdx) break;
            outU8Array[outIdx++] = 192 | u >> 6;
            outU8Array[outIdx++] = 128 | u & 63
        } else if (u <= 65535) {
            if (outIdx + 2 >= endIdx) break;
            outU8Array[outIdx++] = 224 | u >> 12;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        } else {
            if (outIdx + 3 >= endIdx) break;
            outU8Array[outIdx++] = 240 | u >> 18;
            outU8Array[outIdx++] = 128 | u >> 12 & 63;
            outU8Array[outIdx++] = 128 | u >> 6 & 63;
            outU8Array[outIdx++] = 128 | u & 63
        }
    }
    outU8Array[outIdx] = 0;
    return outIdx - startIdx
}
function stringToUTF8(str, outPtr, maxBytesToWrite) {
    return stringToUTF8Array(str, HEAPU8, outPtr, maxBytesToWrite)
}
function lengthBytesUTF8(str) {
    var len = 0;
    for (var i = 0; i < str.length; ++i) {
        var u = str.charCodeAt(i);
        if (u >= 55296 && u <= 57343) u = 65536 + ((u & 1023) << 10) | str.charCodeAt(++i) & 1023;
        if (u <= 127)++len;
        else if (u <= 2047) len += 2;
        else if (u <= 65535) len += 3;
        else len += 4
    }
    return len
}
var UTF16Decoder = typeof TextDecoder !== "undefined" ? new TextDecoder("utf-16le") : undefined;
function allocateUTF8(str) {
    var size = lengthBytesUTF8(str) + 1;
    var ret = _malloc(size);
    if (ret) stringToUTF8Array(str, HEAP8, ret, size);
    return ret
}
function writeArrayToMemory(array, buffer) {
    HEAP8.set(array, buffer)
}
function writeAsciiToMemory(str, buffer, dontAddNull) {
    for (var i = 0; i < str.length; ++i) {
        HEAP8[buffer++>>0] = str.charCodeAt(i)
    }
    if (!dontAddNull) HEAP8[buffer >> 0] = 0
}
var WASM_PAGE_SIZE = 65536;
function alignUp(x, multiple) {
    if (x % multiple > 0) {
        x += multiple - x % multiple
    }
    return x
}
var buffer, HEAP8, HEAPU8, HEAP16, HEAPU16, HEAP32, HEAPU32, HEAPF32, HEAPF64;
function updateGlobalBufferAndViews(buf) {
    buffer = buf;
    Module["HEAP8"] = HEAP8 = new Int8Array(buf);
    Module["HEAP16"] = HEAP16 = new Int16Array(buf);
    Module["HEAP32"] = HEAP32 = new Int32Array(buf);
    Module["HEAPU8"] = HEAPU8 = new Uint8Array(buf);
    Module["HEAPU16"] = HEAPU16 = new Uint16Array(buf);
    Module["HEAPU32"] = HEAPU32 = new Uint32Array(buf);
    Module["HEAPF32"] = HEAPF32 = new Float32Array(buf);
    Module["HEAPF64"] = HEAPF64 = new Float64Array(buf)
}
var DYNAMIC_BASE = 6465744,
    DYNAMICTOP_PTR = 1222848;
var INITIAL_TOTAL_MEMORY = Module["TOTAL_MEMORY"] || 16777216;
if (Module["wasmMemory"]) {
    wasmMemory = Module["wasmMemory"]
} else {
    wasmMemory = new WebAssembly.Memory({
        "initial": INITIAL_TOTAL_MEMORY / WASM_PAGE_SIZE
    })
}
if (wasmMemory) {
    buffer = wasmMemory.buffer
}
INITIAL_TOTAL_MEMORY = buffer.byteLength;
updateGlobalBufferAndViews(buffer);
HEAP32[DYNAMICTOP_PTR >> 2] = DYNAMIC_BASE;
function callRuntimeCallbacks(callbacks) {
    while (callbacks.length > 0) {
        var callback = callbacks.shift();
        if (typeof callback == "function") {
            callback();
            continue
        }
        var func = callback.func;
        if (typeof func === "number") {
            if (callback.arg === undefined) {
                Module["dynCall_v"](func)
            } else {
                Module["dynCall_vi"](func, callback.arg)
            }
        } else {
            func(callback.arg === undefined ? null: callback.arg)
        }
    }
}
var __ATPRERUN__ = [];
var __ATINIT__ = [];
var __ATMAIN__ = [];
var __ATEXIT__ = [];
var __ATPOSTRUN__ = [];
var runtimeInitialized = false;
var runtimeExited = false;
function preRun() {
    if (Module["preRun"]) {
        if (typeof Module["preRun"] == "function") Module["preRun"] = [Module["preRun"]];
        while (Module["preRun"].length) {
            addOnPreRun(Module["preRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPRERUN__)
}
function initRuntime() {
    runtimeInitialized = true;
    if (!Module["noFSInit"] && !FS.init.initialized) FS.init();
    TTY.init();
    callRuntimeCallbacks(__ATINIT__)
}
function preMain() {
    FS.ignorePermissions = false;
    callRuntimeCallbacks(__ATMAIN__)
}
function exitRuntime() {
    runtimeExited = true
}
function postRun() {
    if (Module["postRun"]) {
        if (typeof Module["postRun"] == "function") Module["postRun"] = [Module["postRun"]];
        while (Module["postRun"].length) {
            addOnPostRun(Module["postRun"].shift())
        }
    }
    callRuntimeCallbacks(__ATPOSTRUN__)
}
function addOnPreRun(cb) {
    __ATPRERUN__.unshift(cb)
}
function addOnPostRun(cb) {
    __ATPOSTRUN__.unshift(cb)
}
var Math_abs = Math.abs;
var Math_ceil = Math.ceil;
var Math_floor = Math.floor;
var Math_min = Math.min;
var runDependencies = 0;
var runDependencyWatcher = null;
var dependenciesFulfilled = null;
function getUniqueRunDependency(id) {
    return id
}
function addRunDependency(id) {
    runDependencies++;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
}
function removeRunDependency(id) {
    runDependencies--;
    if (Module["monitorRunDependencies"]) {
        Module["monitorRunDependencies"](runDependencies)
    }
    if (runDependencies == 0) {
        if (runDependencyWatcher !== null) {
            clearInterval(runDependencyWatcher);
            runDependencyWatcher = null
        }
        if (dependenciesFulfilled) {
            var callback = dependenciesFulfilled;
            dependenciesFulfilled = null;
            callback()
        }
    }
}
Module["preloadedImages"] = {};
Module["preloadedAudios"] = {};
var dataURIPrefix = "data:application/octet-stream;base64,";
function isDataURI(filename) {
    return String.prototype.startsWith ? filename.startsWith(dataURIPrefix) : filename.indexOf(dataURIPrefix) === 0
}
var wasmBinaryFile = "libthingview_wasm.wasm";
if (!isDataURI(wasmBinaryFile)) {
    wasmBinaryFile = locateFile(wasmBinaryFile)
}
function getBinary() {
    try {
        if (wasmBinary) {
            return new Uint8Array(wasmBinary)
        }
        if (readBinary) {
            return readBinary(wasmBinaryFile)
        } else {
            throw "both async and sync fetching of the wasm failed"
        }
    } catch(err) {
        abort(err)
    }
}
function getBinaryPromise() {
    if (!wasmBinary && (ENVIRONMENT_IS_WEB || ENVIRONMENT_IS_WORKER) && typeof fetch === "function") {
        return fetch(wasmBinaryFile, {
            credentials: "same-origin"
        }).then(function(response) {
            if (!response["ok"]) {
                throw "failed to load wasm binary file at '" + wasmBinaryFile + "'"
            }
            return response["arrayBuffer"]()
        }).
        catch(function() {
            return getBinary()
        })
    }
    return new Promise(function(resolve, reject) {
        resolve(getBinary())
    })
}
function createWasm(env) {
    var info = {
        "env": env,
        "wasi_unstable": env
    };
    function receiveInstance(instance, module) {
        var exports = instance.exports;
        Module["asm"] = exports;
        removeRunDependency("wasm-instantiate")
    }
    addRunDependency("wasm-instantiate");
    function receiveInstantiatedSource(output) {
        receiveInstance(output["instance"])
    }
    function instantiateArrayBuffer(receiver) {
        return getBinaryPromise().then(function(binary) {
            return WebAssembly.instantiate(binary, info)
        }).then(receiver,
            function(reason) {
                err("failed to asynchronously prepare wasm: " + reason);
                abort(reason)
            })
    }
    function instantiateAsync() {
        if (!wasmBinary && typeof WebAssembly.instantiateStreaming === "function" && !isDataURI(wasmBinaryFile) && typeof fetch === "function") {
            fetch(wasmBinaryFile, {
                credentials: "same-origin"
            }).then(function(response) {
                var result = WebAssembly.instantiateStreaming(response, info);
                return result.then(receiveInstantiatedSource,
                    function(reason) {
                        err("wasm streaming compile failed: " + reason);
                        err("falling back to ArrayBuffer instantiation");
                        instantiateArrayBuffer(receiveInstantiatedSource)
                    })
            })
        } else {
            return instantiateArrayBuffer(receiveInstantiatedSource)
        }
    }
    if (Module["instantiateWasm"]) {
        try {
            var exports = Module["instantiateWasm"](info, receiveInstance);
            return exports
        } catch(e) {
            err("Module.instantiateWasm callback failed with error: " + e);
            return false
        }
    }
    instantiateAsync();
    return {}
}
Module["asm"] = function(global, env, providedBuffer) {
    env["memory"] = wasmMemory;
    env["table"] = wasmTable = new WebAssembly.Table({
        "initial": 34970,
        "maximum": 34970 + 0,
        "element": "anyfunc"
    });
    var exports = createWasm(env);
    return exports
};
var tempDouble;
var tempI64;
var ASM_CONSTS = [function($0, $1, $2, $3) {
    var _text = UTF8ToString($0);
    var _font = UTF8ToString($1);
    var _fontSize = $2;
    var _bbox = $3;
    var d = document.createElement("span");
    d.style.fontSize = _fontSize + "px";
    d.style.fontFamily = _font;
    d.textContent = _text;
    document.body.appendChild(d);
    setValue(_bbox + 0, d.offsetWidth, "i16");
    setValue(_bbox + 2, d.offsetHeight, "i16");
    document.body.removeChild(d)
},
    function($0, $1, $2, $3, $4, $5, $6, $7) {
        var _text = UTF8ToString($0);
        var _textColorR = getValue($1 + 0, "i16");
        var _textColorG = getValue($1 + 2, "i16");
        var _textColorB = getValue($1 + 4, "i16");
        var _textColorA = getValue($1 + 6, "i16");
        var _fillColorR = getValue($2 + 0, "i16");
        var _fillColorG = getValue($2 + 2, "i16");
        var _fillColorB = getValue($2 + 4, "i16");
        var _fillColorA = getValue($2 + 6, "i16");
        var _font = UTF8ToString($3);
        var _fontSize = $4;
        var _textBoxWidth = getValue($5 + 0, "i32");
        var _textBoxHeight = getValue($5 + 4, "i32");
        var _lineHeight = $6;
        var _buf = $7;
        var canvas = document.createElement("canvas");
        canvas.width = _textBoxWidth;
        canvas.height = _textBoxHeight;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "rgba(" + _fillColorR + ", " + _fillColorG + ", " + _fillColorB + ", " + _fillColorA / 255 + ")";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "rgba(" + _textColorR + ", " + _textColorG + ", " + _textColorB + ", " + _textColorA / 255 + ")";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.font = _fontSize + "px " + _font;
        var x = _fontSize / 2;
        var y = _fontSize / 2 + _lineHeight / 2;
        var cars = _text.split("\n");
        for (var line = 0; line < cars.length; line++) {
            ctx.fillText(cars[line], x, y);
            y += _lineHeight
        }
        var imageData = ctx.getImageData(0, 0, _textBoxWidth, _textBoxHeight);
        var nDataBytes = imageData.data.length * imageData.data.BYTES_PER_ELEMENT;
        var dataHeap = new Uint8Array(nDataBytes);
        dataHeap.set(new Uint8Array(imageData.data.buffer));
        writeArrayToMemory(dataHeap, _buf)
    },
    function($0, $1) {
        var _text = UTF8ToString($0);
        var _bbox = $1;
        var d = document.createElement("span");
        d.innerHTML = _text;
        d.style.display = "inline-table";
        document.body.appendChild(d);
        setValue(_bbox + 0, d.offsetWidth, "i16");
        setValue(_bbox + 2, d.offsetHeight, "i16");
        document.body.removeChild(d)
    },
    function($0, $1, $2, $3, $4) {
        var _text = UTF8ToString($0);
        var _textBoxWidth = getValue($1 + 0, "i16");
        var _textBoxHeight = getValue($1 + 2, "i16");
        var _id = getValue($1 + 4, "i16");
        var _buf = $2;
        var _this = $3;
        var _ccallback = $4;
        var data = '<svg xmlns="http://www.w3.org/2000/svg" width="' + _textBoxWidth + '" height="' + _textBoxHeight + '">' + '<foreignObject width="100%" height="100%">' + '<div xmlns="http://www.w3.org/1999/xhtml">\n' + _text + "</div>" + "</foreignObject>" + "</svg>";
        data = encodeURIComponent(data);
        var img = new Image;
        img.src = "data:image/svg+xml," + data;
        img.onload = function() {
            var canvas = document.createElement("canvas");
            canvas.width = _textBoxWidth;
            canvas.height = _textBoxHeight;
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            var imageData = ctx.getImageData(0, 0, _textBoxWidth, _textBoxHeight);
            var nDataBytes = imageData.data.length * imageData.data.BYTES_PER_ELEMENT;
            var dataHeap = new Uint8Array(nDataBytes);
            dataHeap.set(new Uint8Array(imageData.data.buffer));
            writeArrayToMemory(dataHeap, _buf);
            dynCall("vii", _ccallback, [_this, _id])
        }
    },
    function($0, $1, $2, $3, $4, $5, $6) {
        var _request = UTF8ToString($0);
        var _url = UTF8ToString($1);
        var _cross = $2;
        var _arg = $3;
        var _onLoad = $4;
        var _onError = $5;
        var _onProgress = $6;
        var http = new XMLHttpRequest;
        http.open(_request, _url, true);
        http.responseType = "arraybuffer";
        if (_cross) {
            http.withCredentials = true
        }
        var handle = Browser.getNextWgetRequestHandle();
        http.onabort = function http_onabort(e) {
            delete Browser.wgetRequests[handle]
        };
        http.onerror = function http_onerror(e) {
            if (_onError) {
                var header = http.getAllResponseHeaders();
                var statusTextLength = lengthBytesUTF8(http.statusText) + 1;
                var statusTextBuffer = _malloc(statusTextLength);
                stringToUTF8(http.statusText, statusTextBuffer, statusTextLength);
                var headerLength = lengthBytesUTF8(header) + 1;
                var headerBuffer = _malloc(headerLength);
                stringToUTF8(header, headerBuffer, headerLength);
                dynCall("viiii", _onError, [_arg, http.status, statusTextBuffer, headerBuffer]);
                _free(statusTextBuffer);
                _free(headerBuffer)
            }
            delete Browser.wgetRequests[handle]
        };
        http.onprogress = function http_onprogress(e) {
            if (_onProgress) {
                var _total = e.lengthComputable || e.lengthComputable === undefined ? e.total: 0;
                dynCall("viii", _onProgress, [_arg, e.loaded, _total])
            }
        };
        http.onload = function http_onload(e) {
            if (http.status < 400) {
                if (_onLoad) {
                    var contentLength = Number(http.getResponseHeader("Content-Length"));
                    var contentRangeBegin = -1;
                    var contentRangeEnd = -1;
                    var contentRangeTotal = -1;
                    var responseLength = http.response.byteLength;
                    if (http.status == 206) {
                        var contentRange = http.getResponseHeader("Content-Range");
                        if (contentRange && contentRange.beginsWith("bytes ")) {
                            var loc1 = 6;
                            var loc2 = contentRange.indexOf("-");
                            var loc3 = contentRange.indexOf("/");
                            var loc4 = contentRange.length;
                            if (loc1 < loc2 && loc2 < loc3 && loc3 < loc4) {
                                contentRangeBegin = Number(contentRange.slice(loc1, loc2));
                                contentRangeEnd = Number(contentRange.slice(loc2 + 1, loc3));
                                contentRangeTotal = Number(contentRange.slice(loc3 + 1, loc4))
                            }
                        }
                    }
                    var header = http.getAllResponseHeaders();
                    var statusTextLength = lengthBytesUTF8(http.statusText) + 1;
                    var statusTextBuffer = _malloc(statusTextLength);
                    stringToUTF8(http.statusText, statusTextBuffer, statusTextLength);
                    var headerLength = lengthBytesUTF8(header) + 1;
                    var headerBuffer = _malloc(headerLength);
                    stringToUTF8(header, headerBuffer, headerLength);
                    dynCall("viiiiiiiii", _onLoad, [_arg, responseLength, contentLength, contentRangeBegin, contentRangeEnd, contentRangeTotal, http.status, statusTextBuffer, headerBuffer]);
                    _free(statusTextBuffer);
                    _free(headerBuffer)
                }
            } else if (_onError) {
                var header = http.getAllResponseHeaders();
                var statusTextLength = lengthBytesUTF8(http.statusText) + 1;
                var statusTextBuffer = _malloc(statusTextLength);
                stringToUTF8(http.statusText, statusTextBuffer, statusTextLength);
                var headerLength = lengthBytesUTF8(header) + 1;
                var headerBuffer = _malloc(headerLength);
                stringToUTF8(header, headerBuffer, headerLength);
                dynCall("viiii", _onError, [_arg, http.status, statusTextBuffer, headerBuffer]);
                _free(statusTextBuffer);
                _free(headerBuffer)
            }
            delete Browser.wgetRequests[handle]
        };
        try {
            if (http.channel instanceof Ci.nsIHttpChannel) http.channel.redirectionLimit = 0
        } catch(ex) {}
        Browser.wgetRequests[handle] = http;
        return handle
    },
    function($0, $1, $2) {
        var http = Browser.wgetRequests[$0];
        if (http) {
            var _field = UTF8ToString($1);
            var _value = UTF8ToString($2);
            http.setRequestHeader(_field, _value)
        }
    },
    function($0, $1) {
        var http = Browser.wgetRequests[$0];
        if (http) {
            var _requestBody = UTF8ToString($1);
            if (_requestBody & _requestBody.length > 0) {
                http.send(_requestBody)
            } else {
                http.send(null)
            }
        }
    },
    function($0) {
        delete Browser.wgetRequests[$0]
    },
    function($0) {
        var http = Browser.wgetRequests[$0];
        if (http) {
            http.abort();
            delete Browser.wgetRequests[$0]
        }
    },
    function($0, $1) {
        var http = Browser.wgetRequests[$0];
        if (http) {
            var byteArray = new Uint8Array(http.response);
            HEAPU8.set(byteArray, $1);
            return byteArray.length
        }
        return 0
    },
    function($0, $1) {
        console.log("Download Failed : " + UTF8ToString($0) + ": " + UTF8ToString($1))
    },
    function() {
        var ratio = window.devicePixelRatio;
        if (ratio != undefined) return ratio;
        else return 1
    },
    function($0) {
        var canvas = document.getElementById(UTF8ToString($0));
        Module["canvas"] = canvas
    },
    function() {
        var ua = navigator.userAgent.toLowerCase();
        if (ua.indexOf("windows") > -1) {
            return 1
        } else if (ua.indexOf("macintosh") > -1) {
            return 2
        } else if (ua.indexOf("linux") > -1) {
            return 3
        }
    },
    function($0) {
        var re = new RegExp(UTF8ToString($0), "i");
        var match = navigator.userAgent.match(re);
        if (match) return true;
        return false
    },
    function() {
        Module["canvas"] = null
    },
    function($0) {
        var target = __findEventTarget(UTF8ToString($0));
        if (target) return 1;
        return 0
    },
    function($0) {
        var canvas = document.getElementById(UTF8ToString($0));
        if (canvas) {
            var parent = canvas.parentElement;
            if (parent) {
                var ratio = window.devicePixelRatio;
                if (ratio == undefined) ratio = 1;
                canvas.width = parent.clientWidth * ratio;
                canvas.height = parent.clientHeight * ratio;
                return ratio
            }
        }
        return 1
    },
    function($0, $1) {
        var canvas = document.getElementById(UTF8ToString($0));
        if (canvas) {
            canvas.style["cursor"] = UTF8ToString($1)
        }
    },
    function() {
        var isIE = false || !!document.documentMode;
        return isIE
    },
    function($0, $1, $2) {
        var _dbName = "DataCacheDB";
        var _osName = "DataCacheObjectStore";
        var _arg = $0;
        var _collectInfo = $2;
        var _idbVersion = 2;
        window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction;
        window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
        function openDB() {
            var request = window.indexedDB.open(_dbName, _idbVersion);
            request.onerror = function(event) {
                console.warn("Warning: IndexedDB error occurred, file caching in ThingView will not be available");
                Module.indexeddbready = 0;
                if (event.target.error.name == "VersionError") {
                    console.log("Trying to delete IndexedDB");
                    deleteDB()
                }
            };
            request.onupgradeneeded = function(event) {
                var database = request.result;
                if (database.objectStoreNames.contains(_osName)) {
                    var txn = event.target.transaction;
                    var objectstore = txn.objectStore(_osName);
                    var clearReq = objectstore.clear();
                    clearReq.onsuccess = function(evt) {
                        console.log("Cleared DB on version change")
                    }
                } else {
                    database.createObjectStore(_osName, {
                        keyPath: "key"
                    })
                }
            };
            request.onsuccess = function(event) {
                var database = request.result;
                Module.indexedDB = database;
                Module.WFStimeoutFn = null;
                var store = database.transaction(_osName, "readwrite").objectStore(_osName);
                if (store) {
                    var getReq = store.get("cacheinfo_uids");
                    getReq.onerror = function(e) {
                        console.error("IndexedDB Error - Failed to get cacheinfo_uids from IndexedDB");
                        console.error(e.target.error.message)
                    };
                    getReq.onsuccess = function(e) {
                        if (e.target.result) {
                            var cachetimestamps = e.target.result.timestamps;
                            var keys = Object.keys(cachetimestamps);
                            for (var i = 0; i < keys.length; i++) {
                                var timestamp = Number(cachetimestamps[keys[i]]);
                                var diff = Date.now() - timestamp;
                                if (diff >= $1) {
                                    delete cachetimestamps[keys[i]]
                                }
                            }
                            cachetimestamps[Module.uniqueTVID] = Date.now();
                            store.put({
                                key: "cacheinfo_uids",
                                timestamps: cachetimestamps
                            })
                        } else {
                            var myStamp = new Object;
                            myStamp[Module.uniqueTVID] = Date.now();
                            store.put({
                                key: "cacheinfo_uids",
                                timestamps: myStamp
                            })
                        }
                    };
                    var getRequest = store.get("cacheinfo");
                    getRequest.onsuccess = function(e) {
                        if (e.target.result) {
                            var infotimestamp = Number(e.target.result.timestamp);
                            var cachetimestamps = e.target.result.timestamps;
                            var infofileversion = e.target.result.version;
                            var byteLengths = lengthBytesUTF8(cachetimestamps) + 1;
                            var stampBuffer = _malloc(byteLengths);
                            stringToUTF8(cachetimestamps, stampBuffer, byteLengths);
                            var versionLengths = lengthBytesUTF8(infofileversion) + 1;
                            var versionBuffer = _malloc(versionLengths);
                            stringToUTF8(infofileversion, versionBuffer, versionLengths);
                            dynCall("viiii", _collectInfo, [_arg, infotimestamp, stampBuffer, versionBuffer]);
                            _free(stampBuffer);
                            _free(versionBuffer)
                        } else {
                            Module.indexeddbready = 1
                        }
                    }
                }
            }
        }
        function deleteDB() {
            var delReq = window.indexedDB.deleteDatabase(_dbName);
            delReq.onerror = function(ev) {
                console.error("IndexedDB Error - Failed to delete IndexedDB");
                console.error(ev.target.error.message);
                console.error("IndexedDB Error - Please delete IndexedDB '" + _dbName + "' manually")
            };
            delReq.onsuccess = function(ev) {
                console.log("Deleted IndexedDB on version change");
                openDB()
            }
        }
        if (window.indexedDB) {
            var cryptoObj = window.crypto || window.msCrypto;
            function rng(a) {
                return a ? (a ^ cryptoObj.getRandomValues(new Uint8Array(1))[0] % 36 >> a / 4).toString(36) : ([1e7] + -1e3 + -1e3 + -1e3 + -1e11).replace(/[01]/g, rng)
            }
            Module.uniqueTVID = rng();
            openDB()
        } else {
            console.log("indexedDB is not supported")
        }
        Module.indexeddbready = 0
    },
    function($0, $1, $2, $3) {
        if ($1) {
            function flushTimeout() {
                window.clearTimeout(Module.WFSUIDtimeoutFn);
                Module.WFSUIDtimeoutFn = null;
                dynCall("vi", $2, [$0])
            }
            if (!Module.WFSUIDtimeoutFn) {
                Module.WFSUIDtimeoutFn = window.setTimeout(flushTimeout, $3)
            } else {
                window.clearTimeout(Module.WFSUIDtimeoutFn);
                Module.WFSUIDtimeoutFn = window.setTimeout(flushTimeout, $3)
            }
        } else {
            if (Module.WFSUIDtimeoutFn) {
                window.clearTimeout(Module.WFSUIDtimeoutFn);
                Module.WFSUIDtimeoutFn = null
            }
        }
    },
    function() {
        var _key = "cacheinfo_uids";
        var _osName = "DataCacheObjectStore";
        var store = Module.indexedDB.transaction(_osName, "readwrite").objectStore(_osName);
        var getRequest = store.get(_key);
        getRequest.onerror = function(e) {
            console.error("IndexedDB Error - Failed to get '" + _key + "' from IndexedDB");
            console.error(e.target.error.message)
        };
        getRequest.onsuccess = function(e) {
            if (e.target.result) {
                var cachetimestamps = e.target.result.timestamps;
                cachetimestamps[Module.uniqueTVID] = Date.now();
                store.put({
                    key: _key,
                    timestamps: cachetimestamps
                })
            } else {
                var myStamp = new Object;
                myStamp[Module.uniqueTVID] = Date.now();
                store.put({
                    key: _key,
                    timestamps: myStamp
                })
            }
        }
    },
    function() {
        Module.indexeddbready = 1
    },
    function($0, $1) {
        var _key = UTF8ToString($0);
        if (Module[_key]) {
            HEAPU8.set(Module[_key], $1);
            delete Module[_key]
        }
    },
    function($0, $1, $2) {
        var _osName = "DataCacheObjectStore";
        var _arg = $0;
        var _collectInfo = $1;
        var _callLockFile = $2;
        var store = Module.indexedDB.transaction(_osName, "readonly").objectStore(_osName);
        var getRequest = store.get("cacheinfo");
        getRequest.onsuccess = function(e) {
            if (e.target.result) {
                var infotimestamp = Number(e.target.result.timestamp);
                var cachetimestamps = e.target.result.timestamps;
                var infofileversion = e.target.result.version;
                var byteLengths = lengthBytesUTF8(cachetimestamps) + 1;
                var stampBuffer = _malloc(byteLengths);
                stringToUTF8(cachetimestamps, stampBuffer, byteLengths);
                var versionLengths = lengthBytesUTF8(infofileversion) + 1;
                var versionBuffer = _malloc(versionLengths);
                stringToUTF8(infofileversion, versionBuffer, versionLengths);
                dynCall("viiii", _collectInfo, [_arg, infotimestamp, stampBuffer, versionBuffer]);
                _free(stampBuffer);
                _free(versionBuffer)
            }
            dynCall("vi", _callLockFile, [_arg])
        }
    },
    function($0, $1, $2) {
        var _key = "cacheinfo_lock";
        var _osName = "DataCacheObjectStore";
        if (Module.WFSLtimeoutFn) {
            window.clearTimeout(Module.WFSLtimeoutFn);
            Module.WFSLtimeoutFn = null
        }
        var store = Module.indexedDB.transaction(_osName, "readwrite").objectStore(_osName);
        var getRequest = store.get(_key);
        getRequest.onerror = function(e) {
            console.error("IndexedDB Error - Failed to get '" + _key + "' from IndexedDB");
            console.error(e.target.error.message);
            Module.lockTimestamp = undefined;
            dynCall("vii", $1, [$0, -10])
        };
        getRequest.onsuccess = function(e) {
            if (e.target.result) {
                var lockTimestamp = Number(e.target.result.timestamp);
                var diff = Date.now() - lockTimestamp;
                if (diff >= $2) {
                    var curTimestamp = Date.now();
                    putReq = store.put({
                        key: _key,
                        timestamp: curTimestamp
                    });
                    putReq.onsuccess = function() {
                        Module.lockTimestamp = curTimestamp;
                        dynCall("vii", $1, [$0, 2])
                    }
                } else {
                    if (lockTimestamp == Module.lockTimestamp) {
                        dynCall("vii", $1, [$0, -1])
                    } else {
                        Module.lockTimestamp = undefined;
                        dynCall("vii", $1, [$0, 0])
                    }
                }
            } else {
                var curTimestamp = Date.now();
                putReq = store.put({
                    key: _key,
                    timestamp: curTimestamp
                });
                putReq.onsuccess = function() {
                    Module.lockTimestamp = curTimestamp;
                    dynCall("vii", $1, [$0, 1])
                }
            }
        }
    },
    function($0) {
        var _keys = UTF8ToString($0);
        var splitArr = _keys.split(";");
        function delete_key(os, arr) {
            var key = arr.shift();
            if (key) {
                var delReq = os.delete(key);
                delReq.onsuccess = function(e) {
                    delete_key(os, arr)
                };
                delReq.onerror = function(e) {
                    delete_key(os, arr)
                }
            }
        }
        var store = Module.indexedDB.transaction("DataCacheObjectStore", "readwrite").objectStore("DataCacheObjectStore");
        delete_key(store, splitArr)
    },
    function($0, $1) {
        var _key = "cacheinfo";
        var _timestamps = UTF8ToString($0);
        var _version = UTF8ToString($1);
        var timeStamp = Math.floor(Date.now() / 1e3);
        var store = Module.indexedDB.transaction("DataCacheObjectStore", "readwrite").objectStore("DataCacheObjectStore");
        var putReq = store.put({
            key: _key,
            version: _version,
            timestamp: timeStamp,
            timestamps: _timestamps
        });
        putReq.onerror = function(e) {
            console.error("IndexedDB Error - Failed to put '" + _key + "' in IndexedDB");
            console.error(e.target.error.message)
        };
        return timeStamp
    },
    function($0, $1, $2, $3) {
        var _key = UTF8ToString($0);
        var _osName = "DataCacheObjectStore";
        var _arg = $1;
        var _onGetSuccess = $2;
        var _onGetFail = $3;
        try {
            var store = Module.indexedDB.transaction(_osName, "readonly").objectStore(_osName);
            var getRequest = store.get(_key);
            getRequest.onerror = function(e) {
                console.error("IndexedDB Error - Failed to get '" + _key + "' from IndexedDB");
                console.error(e.target.error.message);
                if (_onGetFail) {
                    var byteLength = lengthBytesUTF8(_key) + 1;
                    var keyBuffer = _malloc(byteLength);
                    stringToUTF8(_key, keyBuffer, byteLength);
                    dynCall("vii", _onGetFail, [_arg, keyBuffer]);
                    _free(keyBuffer)
                }
            };
            getRequest.onsuccess = function(e) {
                if (e.target.result) {
                    if (_onGetSuccess) {
                        var data = e.target.result;
                        Module[_key] = data.ds;
                        var byteLength = lengthBytesUTF8(_key) + 1;
                        var keyBuffer = _malloc(byteLength);
                        stringToUTF8(_key, keyBuffer, byteLength);
                        var timeStamp = Math.floor(Date.now() / 1e3);
                        dynCall("viiii", _onGetSuccess, [_arg, keyBuffer, timeStamp, data.ds.length]);
                        _free(keyBuffer)
                    }
                }
            }
        } catch(e) {
            if (_onGetFail) {
                var byteLength = lengthBytesUTF8(_key) + 1;
                var keyBuffer = _malloc(byteLength);
                stringToUTF8(_key, keyBuffer, byteLength);
                dynCall("vii", _onGetFail, [_arg, keyBuffer]);
                _free(keyBuffer)
            }
        }
    },
    function($0) {
        var key = UTF8ToString($0);
        var store = Module.indexedDB.transaction("DataCacheObjectStore", "readwrite").objectStore("DataCacheObjectStore");
        var delReq = store.delete(key);
        delReq.onsuccess = function() {};
        delReq.onerror = function(e) {
            console.error("IndexedDB Error - Failed to delete '" + key + "' from IndexedDB");
            console.error(e.target.error.message)
        }
    },
    function() {
        var timeStamp = Math.floor(Date.now() / 1e3);
        return timeStamp
    },
    function($0, $1, $2, $3, $4, $5) {
        var _key = UTF8ToString($3);
        var data = new Uint8Array(HEAPU8.buffer, $5, $4);
        var cachedCopy = new Uint8Array(data);
        var store = Module.indexedDB.transaction("DataCacheObjectStore", "readwrite").objectStore("DataCacheObjectStore");
        var putReq = store.put({
            key: _key,
            ds: cachedCopy
        });
        putReq.onsuccess = function() {
            var timeStamp = Math.floor(Date.now() / 1e3);
            var byteLength = lengthBytesUTF8(_key) + 1;
            var keyBuffer = _malloc(byteLength);
            stringToUTF8(_key, keyBuffer, byteLength);
            dynCall("viii", $1, [$0, keyBuffer, timeStamp]);
            _free(keyBuffer)
        };
        putReq.onerror = function(e) {
            console.error("IndexedDB Error - Failed to put '" + _key + "' in IndexedDB");
            console.error(e.target.error.message);
            var byteLength = lengthBytesUTF8(_key) + 1;
            var keyBuffer = _malloc(byteLength);
            stringToUTF8(_key, keyBuffer, byteLength);
            dynCall("vii", $2, [$0, keyBuffer]);
            _free(keyBuffer)
        }
    },
    function($0, $1) {
        var store = Module.indexedDB.transaction("DataCacheObjectStore", "readonly").objectStore("DataCacheObjectStore");
        function CallCFunc(keys) {
            var byteLength = lengthBytesUTF8(keys) + 1;
            var keysBuffer = _malloc(byteLength);
            stringToUTF8(keys, keysBuffer, byteLength);
            dynCall("vii", $1, [$0, keysBuffer]);
            _free(keysBuffer)
        }
        if (typeof store.getAllKeys === "function") {
            var allkeyReq = store.getAllKeys();
            allkeyReq.onsuccess = function(event) {
                var res = allkeyReq.result;
                var keys = "";
                for (var i = 0; i < res.length; i++) {
                    if (res[i].indexOf("cacheinfo") == -1) {
                        keys += res[i];
                        keys += ";"
                    }
                }
                CallCFunc(keys)
            }
        } else {
            var keys = "";
            var cursorReq = store.openCursor();
            cursorReq.onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {
                    if (cursor.value.key.indexOf("cacheinfo") == -1) {
                        keys += cursor.value.key;
                        keys += ";"
                    }
                    cursor.
                    continue ()
                } else {
                    CallCFunc(keys)
                }
            }
        }
    },
    function($0, $1) {
        if (Module.lockTimestamp != undefined) {
            if (Date.now() - Module.lockTimestamp > $1) {
                Module.lockTimestamp = undefined;
                return 0
            } else {
                return 1
            }
        } else {
            return 0
        }
    },
    function() {
        var _key = "cacheinfo_lock";
        var _osName = "DataCacheObjectStore";
        var store = Module.indexedDB.transaction(_osName, "readwrite").objectStore(_osName);
        var getRequest = store.get(_key);
        getRequest.onerror = function(e) {
            console.error("IndexedDB Error - Failed to get '" + _key + "' from IndexedDB");
            console.error(e.target.error.message);
            Module.lockTimestamp = undefined
        };
        getRequest.onsuccess = function(e) {
            if (e.target.result) {
                if (Module.lockTimestamp == Number(e.target.result.timestamp)) {
                    var delReq = store.delete(_key);
                    delReq.onsuccess = function(e) {
                        Module.lockTimestamp = undefined
                    }
                } else {
                    Module.lockTimestamp = undefined
                }
            } else {
                Module.lockTimestamp = undefined
            }
        }
    },
    function($0, $1) {
        var _key = "cacheinfo_uids";
        var _osName = "DataCacheObjectStore";
        var store = Module.indexedDB.transaction(_osName, "readwrite").objectStore(_osName);
        var getRequest = store.get(_key);
        getRequest.onerror = function(e) {
            console.error("IndexedDB Error - Failed to get '" + _key + "' from IndexedDB");
            console.error(e.target.error.message)
        };
        getRequest.onsuccess = function(e) {
            if (e.target.result) {
                var cachetimestamps = e.target.result.timestamps;
                delete cachetimestamps[Module.uniqueTVID];
                store.put({
                    key: _key,
                    timestamps: cachetimestamps
                });
                if (Object.keys(cachetimestamps).length == 0) {
                    dynCall("vi", $1, [$0])
                }
            }
        }
    },
    function($0, $1, $2) {
        function flushTimeout() {
            window.clearTimeout(Module.WFSLtimeoutFn);
            Module.WFSLtimeoutFn = null;
            dynCall("vi", $1, [$0])
        }
        if (!Module.WFSLtimeoutFn) {
            Module.WFSLtimeoutFn = window.setTimeout(flushTimeout, $2)
        } else {
            window.clearTimeout(Module.WFSLtimeoutFn);
            Module.WFSLtimeoutFn = window.setTimeout(flushTimeout, $2)
        }
    }];
function _emscripten_asm_const_iii(code, sig_ptr, argbuf) {
    var sig = AsciiToString(sig_ptr);
    var args = [];
    var align_to = function(ptr, align) {
        return ptr + align - 1 & ~ (align - 1)
    };
    var buf = argbuf;
    for (var i = 0; i < sig.length; i++) {
        var c = sig[i];
        if (c == "d" || c == "f") {
            buf = align_to(buf, 8);
            args.push(HEAPF64[buf >> 3]);
            buf += 8
        } else if (c == "i") {
            buf = align_to(buf, 4);
            args.push(HEAP32[buf >> 2]);
            buf += 4
        }
    }
    return ASM_CONSTS[code].apply(null, args)
}
function _emscripten_asm_const_dii(code, sig_ptr, argbuf) {
    var sig = AsciiToString(sig_ptr);
    var args = [];
    var align_to = function(ptr, align) {
        return ptr + align - 1 & ~ (align - 1)
    };
    var buf = argbuf;
    for (var i = 0; i < sig.length; i++) {
        var c = sig[i];
        if (c == "d" || c == "f") {
            buf = align_to(buf, 8);
            args.push(HEAPF64[buf >> 3]);
            buf += 8
        } else if (c == "i") {
            buf = align_to(buf, 4);
            args.push(HEAP32[buf >> 2]);
            buf += 4
        }
    }
    return ASM_CONSTS[code].apply(null, args)
}
__ATINIT__.push({
    func: function() {
        ___wasm_call_ctors()
    }
});
function demangle(func) {
    return func
}
function demangleAll(text) {
    var regex = /\b_Z[\w\d_]+/g;
    return text.replace(regex,
        function(x) {
            var y = demangle(x);
            return x === y ? x: y + " [" + x + "]"
        })
}
function jsStackTrace() {
    var err = new Error;
    if (!err.stack) {
        try {
            throw new Error(0)
        } catch(e) {
            err = e
        }
        if (!err.stack) {
            return "(no stack trace available)"
        }
    }
    return err.stack.toString()
}
function stackTrace() {
    var js = jsStackTrace();
    if (Module["extraStackTrace"]) js += "\n" + Module["extraStackTrace"]();
    return demangleAll(js)
}
var ENV = {};
function ___buildEnvironment(environ) {
    var MAX_ENV_VALUES = 64;
    var TOTAL_ENV_SIZE = 1024;
    var poolPtr;
    var envPtr;
    if (!___buildEnvironment.called) {
        ___buildEnvironment.called = true;
        ENV["USER"] = ENV["LOGNAME"] = "web_user";
        ENV["PATH"] = "/";
        ENV["PWD"] = "/";
        ENV["HOME"] = "/home/web_user";
        ENV["LANG"] = (typeof navigator === "object" && navigator.languages && navigator.languages[0] || "C").replace("-", "_") + ".UTF-8";
        ENV["_"] = thisProgram;
        poolPtr = getMemory(TOTAL_ENV_SIZE);
        envPtr = getMemory(MAX_ENV_VALUES * 4);
        HEAP32[envPtr >> 2] = poolPtr;
        HEAP32[environ >> 2] = envPtr
    } else {
        envPtr = HEAP32[environ >> 2];
        poolPtr = HEAP32[envPtr >> 2]
    }
    var strings = [];
    var totalSize = 0;
    for (var key in ENV) {
        if (typeof ENV[key] === "string") {
            var line = key + "=" + ENV[key];
            strings.push(line);
            totalSize += line.length
        }
    }
    if (totalSize > TOTAL_ENV_SIZE) {
        throw new Error("Environment size exceeded TOTAL_ENV_SIZE!")
    }
    var ptrSize = 4;
    for (var i = 0; i < strings.length; i++) {
        var line = strings[i];
        writeAsciiToMemory(line, poolPtr);
        HEAP32[envPtr + i * ptrSize >> 2] = poolPtr;
        poolPtr += line.length + 1
    }
    HEAP32[envPtr + strings.length * ptrSize >> 2] = 0
}
function ___cxa_allocate_exception(size) {
    return _malloc(size)
}
function _atexit(func, arg) {
    __ATEXIT__.unshift({
        func: func,
        arg: arg
    })
}
var ___exception_infos = {};
var ___exception_caught = [];
function ___exception_addRef(ptr) {
    if (!ptr) return;
    var info = ___exception_infos[ptr];
    info.refcount++
}
function ___exception_deAdjust(adjusted) {
    if (!adjusted || ___exception_infos[adjusted]) return adjusted;
    for (var key in ___exception_infos) {
        var ptr = +key;
        var adj = ___exception_infos[ptr].adjusted;
        var len = adj.length;
        for (var i = 0; i < len; i++) {
            if (adj[i] === adjusted) {
                return ptr
            }
        }
    }
    return adjusted
}
function ___cxa_begin_catch(ptr) {
    var info = ___exception_infos[ptr];
    if (info && !info.caught) {
        info.caught = true;
        __ZSt18uncaught_exceptionv.uncaught_exceptions--
    }
    if (info) info.rethrown = false;
    ___exception_caught.push(ptr);
    ___exception_addRef(___exception_deAdjust(ptr));
    return ptr
}
function ___cxa_current_primary_exception() {
    var ret = ___exception_caught[___exception_caught.length - 1] || 0;
    if (ret) ___exception_addRef(___exception_deAdjust(ret));
    return ret
}
function ___cxa_free_exception(ptr) {
    try {
        return _free(ptr)
    } catch(e) {}
}
function ___exception_decRef(ptr) {
    if (!ptr) return;
    var info = ___exception_infos[ptr];
    info.refcount--;
    if (info.refcount === 0 && !info.rethrown) {
        if (info.destructor) {
            Module["dynCall_ii"](info.destructor, ptr)
        }
        delete ___exception_infos[ptr];
        ___cxa_free_exception(ptr)
    }
}
function ___cxa_decrement_exception_refcount(ptr) {
    ___exception_decRef(___exception_deAdjust(ptr))
}
var ___exception_last = 0;
function ___cxa_end_catch() {
    _setThrew(0);
    var ptr = ___exception_caught.pop();
    if (ptr) {
        ___exception_decRef(___exception_deAdjust(ptr));
        ___exception_last = 0
    }
}
function ___resumeException(ptr) {
    if (!___exception_last) {
        ___exception_last = ptr
    }
    throw ptr
}
function ___cxa_find_matching_catch() {
    var thrown = ___exception_last;
    if (!thrown) {
        return (setTempRet0(0), 0) | 0
    }
    var info = ___exception_infos[thrown];
    var throwntype = info.type;
    if (!throwntype) {
        return (setTempRet0(0), thrown) | 0
    }
    var typeArray = Array.prototype.slice.call(arguments);
    var pointer = ___cxa_is_pointer_type(throwntype);
    var buffer = 1222832;
    HEAP32[buffer >> 2] = thrown;
    thrown = buffer;
    for (var i = 0; i < typeArray.length; i++) {
        if (typeArray[i] && ___cxa_can_catch(typeArray[i], throwntype, thrown)) {
            thrown = HEAP32[thrown >> 2];
            info.adjusted.push(thrown);
            return (setTempRet0(typeArray[i]), thrown) | 0
        }
    }
    thrown = HEAP32[thrown >> 2];
    return (setTempRet0(throwntype), thrown) | 0
}
function ___cxa_find_matching_catch_2(a0, a1) {
    return ___cxa_find_matching_catch(a0, a1)
}
function ___cxa_find_matching_catch_3(a0, a1, a2) {
    return ___cxa_find_matching_catch(a0, a1, a2)
}
function ___cxa_find_matching_catch_4(a0, a1, a2, a3) {
    return ___cxa_find_matching_catch(a0, a1, a2, a3)
}
function ___cxa_get_exception_ptr(ptr) {
    return ptr
}
function ___cxa_increment_exception_refcount(ptr) {
    ___exception_addRef(___exception_deAdjust(ptr))
}
function ___cxa_pure_virtual() {
    ABORT = true;
    throw "Pure virtual function called!"
}
function ___cxa_rethrow() {
    var ptr = ___exception_caught.pop();
    ptr = ___exception_deAdjust(ptr);
    if (!___exception_infos[ptr].rethrown) {
        ___exception_caught.push(ptr);
        ___exception_infos[ptr].rethrown = true
    }
    ___exception_last = ptr;
    throw ptr
}
function ___cxa_rethrow_primary_exception(ptr) {
    if (!ptr) return;
    ptr = ___exception_deAdjust(ptr);
    ___exception_caught.push(ptr);
    ___exception_infos[ptr].rethrown = true;
    ___cxa_rethrow()
}
function ___cxa_throw(ptr, type, destructor) {
    ___exception_infos[ptr] = {
        ptr: ptr,
        adjusted: [ptr],
        type: type,
        destructor: destructor,
        refcount: 0,
        caught: false,
        rethrown: false
    };
    ___exception_last = ptr;
    if (! ("uncaught_exception" in __ZSt18uncaught_exceptionv)) {
        __ZSt18uncaught_exceptionv.uncaught_exceptions = 1
    } else {
        __ZSt18uncaught_exceptionv.uncaught_exceptions++
    }
    throw ptr
}
function ___cxa_uncaught_exceptions() {
    return __ZSt18uncaught_exceptionv.uncaught_exceptions
}
function ___lock() {}
function ___setErrNo(value) {
    if (Module["___errno_location"]) HEAP32[Module["___errno_location"]() >> 2] = value;
    return value
}
function ___map_file(pathname, size) {
    ___setErrNo(1);
    return - 1
}
var PATH = {
    splitPath: function(filename) {
        var splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
        return splitPathRe.exec(filename).slice(1)
    },
    normalizeArray: function(parts, allowAboveRoot) {
        var up = 0;
        for (var i = parts.length - 1; i >= 0; i--) {
            var last = parts[i];
            if (last === ".") {
                parts.splice(i, 1)
            } else if (last === "..") {
                parts.splice(i, 1);
                up++
            } else if (up) {
                parts.splice(i, 1);
                up--
            }
        }
        if (allowAboveRoot) {
            for (; up; up--) {
                parts.unshift("..")
            }
        }
        return parts
    },
    normalize: function(path) {
        var isAbsolute = path.charAt(0) === "/",
            trailingSlash = path.substr( - 1) === "/";
        path = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !! p
        }), !isAbsolute).join("/");
        if (!path && !isAbsolute) {
            path = "."
        }
        if (path && trailingSlash) {
            path += "/"
        }
        return (isAbsolute ? "/": "") + path
    },
    dirname: function(path) {
        var result = PATH.splitPath(path),
            root = result[0],
            dir = result[1];
        if (!root && !dir) {
            return "."
        }
        if (dir) {
            dir = dir.substr(0, dir.length - 1)
        }
        return root + dir
    },
    basename: function(path) {
        if (path === "/") return "/";
        var lastSlash = path.lastIndexOf("/");
        if (lastSlash === -1) return path;
        return path.substr(lastSlash + 1)
    },
    extname: function(path) {
        return PATH.splitPath(path)[3]
    },
    join: function() {
        var paths = Array.prototype.slice.call(arguments, 0);
        return PATH.normalize(paths.join("/"))
    },
    join2: function(l, r) {
        return PATH.normalize(l + "/" + r)
    }
};
var PATH_FS = {
    resolve: function() {
        var resolvedPath = "",
            resolvedAbsolute = false;
        for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
            var path = i >= 0 ? arguments[i] : FS.cwd();
            if (typeof path !== "string") {
                throw new TypeError("Arguments to path.resolve must be strings")
            } else if (!path) {
                return ""
            }
            resolvedPath = path + "/" + resolvedPath;
            resolvedAbsolute = path.charAt(0) === "/"
        }
        resolvedPath = PATH.normalizeArray(resolvedPath.split("/").filter(function(p) {
            return !! p
        }), !resolvedAbsolute).join("/");
        return (resolvedAbsolute ? "/": "") + resolvedPath || "."
    },
    relative: function(from, to) {
        from = PATH_FS.resolve(from).substr(1);
        to = PATH_FS.resolve(to).substr(1);
        function trim(arr) {
            var start = 0;
            for (; start < arr.length; start++) {
                if (arr[start] !== "") break
            }
            var end = arr.length - 1;
            for (; end >= 0; end--) {
                if (arr[end] !== "") break
            }
            if (start > end) return [];
            return arr.slice(start, end - start + 1)
        }
        var fromParts = trim(from.split("/"));
        var toParts = trim(to.split("/"));
        var length = Math.min(fromParts.length, toParts.length);
        var samePartsLength = length;
        for (var i = 0; i < length; i++) {
            if (fromParts[i] !== toParts[i]) {
                samePartsLength = i;
                break
            }
        }
        var outputParts = [];
        for (var i = samePartsLength; i < fromParts.length; i++) {
            outputParts.push("..")
        }
        outputParts = outputParts.concat(toParts.slice(samePartsLength));
        return outputParts.join("/")
    }
};
var TTY = {
    ttys: [],
    init: function() {},
    shutdown: function() {},
    register: function(dev, ops) {
        TTY.ttys[dev] = {
            input: [],
            output: [],
            ops: ops
        };
        FS.registerDevice(dev, TTY.stream_ops)
    },
    stream_ops: {
        open: function(stream) {
            var tty = TTY.ttys[stream.node.rdev];
            if (!tty) {
                throw new FS.ErrnoError(19)
            }
            stream.tty = tty;
            stream.seekable = false
        },
        close: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        flush: function(stream) {
            stream.tty.ops.flush(stream.tty)
        },
        read: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.get_char) {
                throw new FS.ErrnoError(6)
            }
            var bytesRead = 0;
            for (var i = 0; i < length; i++) {
                var result;
                try {
                    result = stream.tty.ops.get_char(stream.tty)
                } catch(e) {
                    throw new FS.ErrnoError(5)
                }
                if (result === undefined && bytesRead === 0) {
                    throw new FS.ErrnoError(11)
                }
                if (result === null || result === undefined) break;
                bytesRead++;
                buffer[offset + i] = result
            }
            if (bytesRead) {
                stream.node.timestamp = Date.now()
            }
            return bytesRead
        },
        write: function(stream, buffer, offset, length, pos) {
            if (!stream.tty || !stream.tty.ops.put_char) {
                throw new FS.ErrnoError(6)
            }
            try {
                for (var i = 0; i < length; i++) {
                    stream.tty.ops.put_char(stream.tty, buffer[offset + i])
                }
            } catch(e) {
                throw new FS.ErrnoError(5)
            }
            if (length) {
                stream.node.timestamp = Date.now()
            }
            return i
        }
    },
    default_tty_ops: {
        get_char: function(tty) {
            if (!tty.input.length) {
                var result = null;
                if (ENVIRONMENT_IS_NODE) {
                    var BUFSIZE = 256;
                    var buf = Buffer.alloc ? Buffer.alloc(BUFSIZE) : new Buffer(BUFSIZE);
                    var bytesRead = 0;
                    var isPosixPlatform = process.platform != "win32";
                    var fd = process.stdin.fd;
                    if (isPosixPlatform) {
                        var usingDevice = false;
                        try {
                            fd = fs.openSync("/dev/stdin", "r");
                            usingDevice = true
                        } catch(e) {}
                    }
                    try {
                        bytesRead = fs.readSync(fd, buf, 0, BUFSIZE, null)
                    } catch(e) {
                        if (e.toString().indexOf("EOF") != -1) bytesRead = 0;
                        else throw e
                    }
                    if (usingDevice) {
                        fs.closeSync(fd)
                    }
                    if (bytesRead > 0) {
                        result = buf.slice(0, bytesRead).toString("utf-8")
                    } else {
                        result = null
                    }
                } else if (typeof window != "undefined" && typeof window.prompt == "function") {
                    result = window.prompt("Input: ");
                    if (result !== null) {
                        result += "\n"
                    }
                } else if (typeof readline == "function") {
                    result = readline();
                    if (result !== null) {
                        result += "\n"
                    }
                }
                if (!result) {
                    return null
                }
                tty.input = intArrayFromString(result, true)
            }
            return tty.input.shift()
        },
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                out(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    },
    default_tty1_ops: {
        put_char: function(tty, val) {
            if (val === null || val === 10) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            } else {
                if (val != 0) tty.output.push(val)
            }
        },
        flush: function(tty) {
            if (tty.output && tty.output.length > 0) {
                err(UTF8ArrayToString(tty.output, 0));
                tty.output = []
            }
        }
    }
};
var MEMFS = {
    ops_table: null,
    mount: function(mount) {
        return MEMFS.createNode(null, "/", 16384 | 511, 0)
    },
    createNode: function(parent, name, mode, dev) {
        if (FS.isBlkdev(mode) || FS.isFIFO(mode)) {
            throw new FS.ErrnoError(1)
        }
        if (!MEMFS.ops_table) {
            MEMFS.ops_table = {
                dir: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        lookup: MEMFS.node_ops.lookup,
                        mknod: MEMFS.node_ops.mknod,
                        rename: MEMFS.node_ops.rename,
                        unlink: MEMFS.node_ops.unlink,
                        rmdir: MEMFS.node_ops.rmdir,
                        readdir: MEMFS.node_ops.readdir,
                        symlink: MEMFS.node_ops.symlink
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek
                    }
                },
                file: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: {
                        llseek: MEMFS.stream_ops.llseek,
                        read: MEMFS.stream_ops.read,
                        write: MEMFS.stream_ops.write,
                        allocate: MEMFS.stream_ops.allocate,
                        mmap: MEMFS.stream_ops.mmap,
                        msync: MEMFS.stream_ops.msync
                    }
                },
                link: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr,
                        readlink: MEMFS.node_ops.readlink
                    },
                    stream: {}
                },
                chrdev: {
                    node: {
                        getattr: MEMFS.node_ops.getattr,
                        setattr: MEMFS.node_ops.setattr
                    },
                    stream: FS.chrdev_stream_ops
                }
            }
        }
        var node = FS.createNode(parent, name, mode, dev);
        if (FS.isDir(node.mode)) {
            node.node_ops = MEMFS.ops_table.dir.node;
            node.stream_ops = MEMFS.ops_table.dir.stream;
            node.contents = {}
        } else if (FS.isFile(node.mode)) {
            node.node_ops = MEMFS.ops_table.file.node;
            node.stream_ops = MEMFS.ops_table.file.stream;
            node.usedBytes = 0;
            node.contents = null
        } else if (FS.isLink(node.mode)) {
            node.node_ops = MEMFS.ops_table.link.node;
            node.stream_ops = MEMFS.ops_table.link.stream
        } else if (FS.isChrdev(node.mode)) {
            node.node_ops = MEMFS.ops_table.chrdev.node;
            node.stream_ops = MEMFS.ops_table.chrdev.stream
        }
        node.timestamp = Date.now();
        if (parent) {
            parent.contents[name] = node
        }
        return node
    },
    getFileDataAsRegularArray: function(node) {
        if (node.contents && node.contents.subarray) {
            var arr = [];
            for (var i = 0; i < node.usedBytes; ++i) arr.push(node.contents[i]);
            return arr
        }
        return node.contents
    },
    getFileDataAsTypedArray: function(node) {
        if (!node.contents) return new Uint8Array;
        if (node.contents.subarray) return node.contents.subarray(0, node.usedBytes);
        return new Uint8Array(node.contents)
    },
    expandFileStorage: function(node, newCapacity) {
        var prevCapacity = node.contents ? node.contents.length: 0;
        if (prevCapacity >= newCapacity) return;
        var CAPACITY_DOUBLING_MAX = 1024 * 1024;
        newCapacity = Math.max(newCapacity, prevCapacity * (prevCapacity < CAPACITY_DOUBLING_MAX ? 2 : 1.125) | 0);
        if (prevCapacity != 0) newCapacity = Math.max(newCapacity, 256);
        var oldContents = node.contents;
        node.contents = new Uint8Array(newCapacity);
        if (node.usedBytes > 0) node.contents.set(oldContents.subarray(0, node.usedBytes), 0);
        return
    },
    resizeFileStorage: function(node, newSize) {
        if (node.usedBytes == newSize) return;
        if (newSize == 0) {
            node.contents = null;
            node.usedBytes = 0;
            return
        }
        if (!node.contents || node.contents.subarray) {
            var oldContents = node.contents;
            node.contents = new Uint8Array(new ArrayBuffer(newSize));
            if (oldContents) {
                node.contents.set(oldContents.subarray(0, Math.min(newSize, node.usedBytes)))
            }
            node.usedBytes = newSize;
            return
        }
        if (!node.contents) node.contents = [];
        if (node.contents.length > newSize) node.contents.length = newSize;
        else while (node.contents.length < newSize) node.contents.push(0);
        node.usedBytes = newSize
    },
    node_ops: {
        getattr: function(node) {
            var attr = {};
            attr.dev = FS.isChrdev(node.mode) ? node.id: 1;
            attr.ino = node.id;
            attr.mode = node.mode;
            attr.nlink = 1;
            attr.uid = 0;
            attr.gid = 0;
            attr.rdev = node.rdev;
            if (FS.isDir(node.mode)) {
                attr.size = 4096
            } else if (FS.isFile(node.mode)) {
                attr.size = node.usedBytes
            } else if (FS.isLink(node.mode)) {
                attr.size = node.link.length
            } else {
                attr.size = 0
            }
            attr.atime = new Date(node.timestamp);
            attr.mtime = new Date(node.timestamp);
            attr.ctime = new Date(node.timestamp);
            attr.blksize = 4096;
            attr.blocks = Math.ceil(attr.size / attr.blksize);
            return attr
        },
        setattr: function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
            if (attr.size !== undefined) {
                MEMFS.resizeFileStorage(node, attr.size)
            }
        },
        lookup: function(parent, name) {
            throw FS.genericErrors[2]
        },
        mknod: function(parent, name, mode, dev) {
            return MEMFS.createNode(parent, name, mode, dev)
        },
        rename: function(old_node, new_dir, new_name) {
            if (FS.isDir(old_node.mode)) {
                var new_node;
                try {
                    new_node = FS.lookupNode(new_dir, new_name)
                } catch(e) {}
                if (new_node) {
                    for (var i in new_node.contents) {
                        throw new FS.ErrnoError(39)
                    }
                }
            }
            delete old_node.parent.contents[old_node.name];
            old_node.name = new_name;
            new_dir.contents[new_name] = old_node;
            old_node.parent = new_dir
        },
        unlink: function(parent, name) {
            delete parent.contents[name]
        },
        rmdir: function(parent, name) {
            var node = FS.lookupNode(parent, name);
            for (var i in node.contents) {
                throw new FS.ErrnoError(39)
            }
            delete parent.contents[name]
        },
        readdir: function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        },
        symlink: function(parent, newname, oldpath) {
            var node = MEMFS.createNode(parent, newname, 511 | 40960, 0);
            node.link = oldpath;
            return node
        },
        readlink: function(node) {
            if (!FS.isLink(node.mode)) {
                throw new FS.ErrnoError(22)
            }
            return node.link
        }
    },
    stream_ops: {
        read: function(stream, buffer, offset, length, position) {
            var contents = stream.node.contents;
            if (position >= stream.node.usedBytes) return 0;
            var size = Math.min(stream.node.usedBytes - position, length);
            if (size > 8 && contents.subarray) {
                buffer.set(contents.subarray(position, position + size), offset)
            } else {
                for (var i = 0; i < size; i++) buffer[offset + i] = contents[position + i]
            }
            return size
        },
        write: function(stream, buffer, offset, length, position, canOwn) {
            canOwn = false;
            if (!length) return 0;
            var node = stream.node;
            node.timestamp = Date.now();
            if (buffer.subarray && (!node.contents || node.contents.subarray)) {
                if (canOwn) {
                    node.contents = buffer.subarray(offset, offset + length);
                    node.usedBytes = length;
                    return length
                } else if (node.usedBytes === 0 && position === 0) {
                    node.contents = new Uint8Array(buffer.subarray(offset, offset + length));
                    node.usedBytes = length;
                    return length
                } else if (position + length <= node.usedBytes) {
                    node.contents.set(buffer.subarray(offset, offset + length), position);
                    return length
                }
            }
            MEMFS.expandFileStorage(node, position + length);
            if (node.contents.subarray && buffer.subarray) node.contents.set(buffer.subarray(offset, offset + length), position);
            else {
                for (var i = 0; i < length; i++) {
                    node.contents[position + i] = buffer[offset + i]
                }
            }
            node.usedBytes = Math.max(node.usedBytes, position + length);
            return length
        },
        llseek: function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.usedBytes
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(22)
            }
            return position
        },
        allocate: function(stream, offset, length) {
            MEMFS.expandFileStorage(stream.node, offset + length);
            stream.node.usedBytes = Math.max(stream.node.usedBytes, offset + length)
        },
        mmap: function(stream, buffer, offset, length, position, prot, flags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(19)
            }
            var ptr;
            var allocated;
            var contents = stream.node.contents;
            if (! (flags & 2) && (contents.buffer === buffer || contents.buffer === buffer.buffer)) {
                allocated = false;
                ptr = contents.byteOffset
            } else {
                if (position > 0 || position + length < stream.node.usedBytes) {
                    if (contents.subarray) {
                        contents = contents.subarray(position, position + length)
                    } else {
                        contents = Array.prototype.slice.call(contents, position, position + length)
                    }
                }
                allocated = true;
                var fromHeap = buffer.buffer == HEAP8.buffer;
                ptr = _malloc(length);
                if (!ptr) {
                    throw new FS.ErrnoError(12)
                } (fromHeap ? HEAP8: buffer).set(contents, ptr)
            }
            return {
                ptr: ptr,
                allocated: allocated
            }
        },
        msync: function(stream, buffer, offset, length, mmapFlags) {
            if (!FS.isFile(stream.node.mode)) {
                throw new FS.ErrnoError(19)
            }
            if (mmapFlags & 2) {
                return 0
            }
            var bytesWritten = MEMFS.stream_ops.write(stream, buffer, 0, length, offset, false);
            return 0
        }
    }
};
var IDBFS = {
    dbs: {},
    indexedDB: function() {
        if (typeof indexedDB !== "undefined") return indexedDB;
        var ret = null;
        if (typeof window === "object") ret = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
        assert(ret, "IDBFS used, but indexedDB not supported");
        return ret
    },
    DB_VERSION: 21,
    DB_STORE_NAME: "FILE_DATA",
    mount: function(mount) {
        return MEMFS.mount.apply(null, arguments)
    },
    syncfs: function(mount, populate, callback) {
        IDBFS.getLocalSet(mount,
            function(err, local) {
                if (err) return callback(err);
                IDBFS.getRemoteSet(mount,
                    function(err, remote) {
                        if (err) return callback(err);
                        var src = populate ? remote: local;
                        var dst = populate ? local: remote;
                        IDBFS.reconcile(src, dst, callback)
                    })
            })
    },
    getDB: function(name, callback) {
        var db = IDBFS.dbs[name];
        if (db) {
            return callback(null, db)
        }
        var req;
        try {
            req = IDBFS.indexedDB().open(name, IDBFS.DB_VERSION)
        } catch(e) {
            return callback(e)
        }
        if (!req) {
            return callback("Unable to connect to IndexedDB")
        }
        req.onupgradeneeded = function(e) {
            var db = e.target.result;
            var transaction = e.target.transaction;
            var fileStore;
            if (db.objectStoreNames.contains(IDBFS.DB_STORE_NAME)) {
                fileStore = transaction.objectStore(IDBFS.DB_STORE_NAME)
            } else {
                fileStore = db.createObjectStore(IDBFS.DB_STORE_NAME)
            }
            if (!fileStore.indexNames.contains("timestamp")) {
                fileStore.createIndex("timestamp", "timestamp", {
                    unique: false
                })
            }
        };
        req.onsuccess = function() {
            db = req.result;
            IDBFS.dbs[name] = db;
            callback(null, db)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    getLocalSet: function(mount, callback) {
        var entries = {};
        function isRealDir(p) {
            return p !== "." && p !== ".."
        }
        function toAbsolute(root) {
            return function(p) {
                return PATH.join2(root, p)
            }
        }
        var check = FS.readdir(mount.mountpoint).filter(isRealDir).map(toAbsolute(mount.mountpoint));
        while (check.length) {
            var path = check.pop();
            var stat;
            try {
                stat = FS.stat(path)
            } catch(e) {
                return callback(e)
            }
            if (FS.isDir(stat.mode)) {
                check.push.apply(check, FS.readdir(path).filter(isRealDir).map(toAbsolute(path)))
            }
            entries[path] = {
                timestamp: stat.mtime
            }
        }
        return callback(null, {
            type: "local",
            entries: entries
        })
    },
    getRemoteSet: function(mount, callback) {
        var entries = {};
        IDBFS.getDB(mount.mountpoint,
            function(err, db) {
                if (err) return callback(err);
                try {
                    var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readonly");
                    transaction.onerror = function(e) {
                        callback(this.error);
                        e.preventDefault()
                    };
                    var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
                    var index = store.index("timestamp");
                    index.openKeyCursor().onsuccess = function(event) {
                        var cursor = event.target.result;
                        if (!cursor) {
                            return callback(null, {
                                type: "remote",
                                db: db,
                                entries: entries
                            })
                        }
                        entries[cursor.primaryKey] = {
                            timestamp: cursor.key
                        };
                        cursor.
                        continue ()
                    }
                } catch(e) {
                    return callback(e)
                }
            })
    },
    loadLocalEntry: function(path, callback) {
        var stat, node;
        try {
            var lookup = FS.lookupPath(path);
            node = lookup.node;
            stat = FS.stat(path)
        } catch(e) {
            return callback(e)
        }
        if (FS.isDir(stat.mode)) {
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode
            })
        } else if (FS.isFile(stat.mode)) {
            node.contents = MEMFS.getFileDataAsTypedArray(node);
            return callback(null, {
                timestamp: stat.mtime,
                mode: stat.mode,
                contents: node.contents
            })
        } else {
            return callback(new Error("node type not supported"))
        }
    },
    storeLocalEntry: function(path, entry, callback) {
        try {
            if (FS.isDir(entry.mode)) {
                FS.mkdir(path, entry.mode)
            } else if (FS.isFile(entry.mode)) {
                FS.writeFile(path, entry.contents, {
                    canOwn: true
                })
            } else {
                return callback(new Error("node type not supported"))
            }
            FS.chmod(path, entry.mode);
            FS.utime(path, entry.timestamp, entry.timestamp)
        } catch(e) {
            return callback(e)
        }
        callback(null)
    },
    removeLocalEntry: function(path, callback) {
        try {
            var lookup = FS.lookupPath(path);
            var stat = FS.stat(path);
            if (FS.isDir(stat.mode)) {
                FS.rmdir(path)
            } else if (FS.isFile(stat.mode)) {
                FS.unlink(path)
            }
        } catch(e) {
            return callback(e)
        }
        callback(null)
    },
    loadRemoteEntry: function(store, path, callback) {
        var req = store.get(path);
        req.onsuccess = function(event) {
            callback(null, event.target.result)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    storeRemoteEntry: function(store, path, entry, callback) {
        var req = store.put(entry, path);
        req.onsuccess = function() {
            callback(null)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    removeRemoteEntry: function(store, path, callback) {
        var req = store.delete(path);
        req.onsuccess = function() {
            callback(null)
        };
        req.onerror = function(e) {
            callback(this.error);
            e.preventDefault()
        }
    },
    reconcile: function(src, dst, callback) {
        var total = 0;
        var create = [];
        Object.keys(src.entries).forEach(function(key) {
            var e = src.entries[key];
            var e2 = dst.entries[key];
            if (!e2 || e.timestamp > e2.timestamp) {
                create.push(key);
                total++
            }
        });
        var remove = [];
        Object.keys(dst.entries).forEach(function(key) {
            var e = dst.entries[key];
            var e2 = src.entries[key];
            if (!e2) {
                remove.push(key);
                total++
            }
        });
        if (!total) {
            return callback(null)
        }
        var errored = false;
        var db = src.type === "remote" ? src.db: dst.db;
        var transaction = db.transaction([IDBFS.DB_STORE_NAME], "readwrite");
        var store = transaction.objectStore(IDBFS.DB_STORE_NAME);
        function done(err) {
            if (err && !errored) {
                errored = true;
                return callback(err)
            }
        }
        transaction.onerror = function(e) {
            done(this.error);
            e.preventDefault()
        };
        transaction.oncomplete = function(e) {
            if (!errored) {
                callback(null)
            }
        };
        create.sort().forEach(function(path) {
            if (dst.type === "local") {
                IDBFS.loadRemoteEntry(store, path,
                    function(err, entry) {
                        if (err) return done(err);
                        IDBFS.storeLocalEntry(path, entry, done)
                    })
            } else {
                IDBFS.loadLocalEntry(path,
                    function(err, entry) {
                        if (err) return done(err);
                        IDBFS.storeRemoteEntry(store, path, entry, done)
                    })
            }
        });
        remove.sort().reverse().forEach(function(path) {
            if (dst.type === "local") {
                IDBFS.removeLocalEntry(path, done)
            } else {
                IDBFS.removeRemoteEntry(store, path, done)
            }
        })
    }
};
var NODEFS = {
    isWindows: false,
    staticInit: function() {
        NODEFS.isWindows = !!process.platform.match(/^win/);
        var flags = process["binding"]("constants");
        if (flags["fs"]) {
            flags = flags["fs"]
        }
        NODEFS.flagsForNodeMap = {
            1024 : flags["O_APPEND"],
            64 : flags["O_CREAT"],
            128 : flags["O_EXCL"],
            0 : flags["O_RDONLY"],
            2 : flags["O_RDWR"],
            4096 : flags["O_SYNC"],
            512 : flags["O_TRUNC"],
            1 : flags["O_WRONLY"]
        }
    },
    bufferFrom: function(arrayBuffer) {
        return Buffer["alloc"] ? Buffer.from(arrayBuffer) : new Buffer(arrayBuffer)
    },
    mount: function(mount) {
        assert(ENVIRONMENT_HAS_NODE);
        return NODEFS.createNode(null, "/", NODEFS.getMode(mount.opts.root), 0)
    },
    createNode: function(parent, name, mode, dev) {
        if (!FS.isDir(mode) && !FS.isFile(mode) && !FS.isLink(mode)) {
            throw new FS.ErrnoError(22)
        }
        var node = FS.createNode(parent, name, mode);
        node.node_ops = NODEFS.node_ops;
        node.stream_ops = NODEFS.stream_ops;
        return node
    },
    getMode: function(path) {
        var stat;
        try {
            stat = fs.lstatSync(path);
            if (NODEFS.isWindows) {
                stat.mode = stat.mode | (stat.mode & 292) >> 2
            }
        } catch(e) {
            if (!e.code) throw e;
            throw new FS.ErrnoError( - e.errno)
        }
        return stat.mode
    },
    realPath: function(node) {
        var parts = [];
        while (node.parent !== node) {
            parts.push(node.name);
            node = node.parent
        }
        parts.push(node.mount.opts.root);
        parts.reverse();
        return PATH.join.apply(null, parts)
    },
    flagsForNode: function(flags) {
        flags &= ~2097152;
        flags &= ~2048;
        flags &= ~32768;
        flags &= ~524288;
        var newFlags = 0;
        for (var k in NODEFS.flagsForNodeMap) {
            if (flags & k) {
                newFlags |= NODEFS.flagsForNodeMap[k];
                flags ^= k
            }
        }
        if (!flags) {
            return newFlags
        } else {
            throw new FS.ErrnoError(22)
        }
    },
    node_ops: {
        getattr: function(node) {
            var path = NODEFS.realPath(node);
            var stat;
            try {
                stat = fs.lstatSync(path)
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
            if (NODEFS.isWindows && !stat.blksize) {
                stat.blksize = 4096
            }
            if (NODEFS.isWindows && !stat.blocks) {
                stat.blocks = (stat.size + stat.blksize - 1) / stat.blksize | 0
            }
            return {
                dev: stat.dev,
                ino: stat.ino,
                mode: stat.mode,
                nlink: stat.nlink,
                uid: stat.uid,
                gid: stat.gid,
                rdev: stat.rdev,
                size: stat.size,
                atime: stat.atime,
                mtime: stat.mtime,
                ctime: stat.ctime,
                blksize: stat.blksize,
                blocks: stat.blocks
            }
        },
        setattr: function(node, attr) {
            var path = NODEFS.realPath(node);
            try {
                if (attr.mode !== undefined) {
                    fs.chmodSync(path, attr.mode);
                    node.mode = attr.mode
                }
                if (attr.timestamp !== undefined) {
                    var date = new Date(attr.timestamp);
                    fs.utimesSync(path, date, date)
                }
                if (attr.size !== undefined) {
                    fs.truncateSync(path, attr.size)
                }
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
        },
        lookup: function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            var mode = NODEFS.getMode(path);
            return NODEFS.createNode(parent, name, mode)
        },
        mknod: function(parent, name, mode, dev) {
            var node = NODEFS.createNode(parent, name, mode, dev);
            var path = NODEFS.realPath(node);
            try {
                if (FS.isDir(node.mode)) {
                    fs.mkdirSync(path, node.mode)
                } else {
                    fs.writeFileSync(path, "", {
                        mode: node.mode
                    })
                }
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
            return node
        },
        rename: function(oldNode, newDir, newName) {
            var oldPath = NODEFS.realPath(oldNode);
            var newPath = PATH.join2(NODEFS.realPath(newDir), newName);
            try {
                fs.renameSync(oldPath, newPath)
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
        },
        unlink: function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.unlinkSync(path)
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
        },
        rmdir: function(parent, name) {
            var path = PATH.join2(NODEFS.realPath(parent), name);
            try {
                fs.rmdirSync(path)
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
        },
        readdir: function(node) {
            var path = NODEFS.realPath(node);
            try {
                return fs.readdirSync(path)
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
        },
        symlink: function(parent, newName, oldPath) {
            var newPath = PATH.join2(NODEFS.realPath(parent), newName);
            try {
                fs.symlinkSync(oldPath, newPath)
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
        },
        readlink: function(node) {
            var path = NODEFS.realPath(node);
            try {
                path = fs.readlinkSync(path);
                path = NODEJS_PATH.relative(NODEJS_PATH.resolve(node.mount.opts.root), path);
                return path
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
        }
    },
    stream_ops: {
        open: function(stream) {
            var path = NODEFS.realPath(stream.node);
            try {
                if (FS.isFile(stream.node.mode)) {
                    stream.nfd = fs.openSync(path, NODEFS.flagsForNode(stream.flags))
                }
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
        },
        close: function(stream) {
            try {
                if (FS.isFile(stream.node.mode) && stream.nfd) {
                    fs.closeSync(stream.nfd)
                }
            } catch(e) {
                if (!e.code) throw e;
                throw new FS.ErrnoError( - e.errno)
            }
        },
        read: function(stream, buffer, offset, length, position) {
            if (length === 0) return 0;
            try {
                return fs.readSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
            } catch(e) {
                throw new FS.ErrnoError( - e.errno)
            }
        },
        write: function(stream, buffer, offset, length, position) {
            try {
                return fs.writeSync(stream.nfd, NODEFS.bufferFrom(buffer.buffer), offset, length, position)
            } catch(e) {
                throw new FS.ErrnoError( - e.errno)
            }
        },
        llseek: function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    try {
                        var stat = fs.fstatSync(stream.nfd);
                        position += stat.size
                    } catch(e) {
                        throw new FS.ErrnoError( - e.errno)
                    }
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(22)
            }
            return position
        }
    }
};
var WORKERFS = {
    DIR_MODE: 16895,
    FILE_MODE: 33279,
    reader: null,
    mount: function(mount) {
        assert(ENVIRONMENT_IS_WORKER);
        if (!WORKERFS.reader) WORKERFS.reader = new FileReaderSync;
        var root = WORKERFS.createNode(null, "/", WORKERFS.DIR_MODE, 0);
        var createdParents = {};
        function ensureParent(path) {
            var parts = path.split("/");
            var parent = root;
            for (var i = 0; i < parts.length - 1; i++) {
                var curr = parts.slice(0, i + 1).join("/");
                if (!createdParents[curr]) {
                    createdParents[curr] = WORKERFS.createNode(parent, parts[i], WORKERFS.DIR_MODE, 0)
                }
                parent = createdParents[curr]
            }
            return parent
        }
        function base(path) {
            var parts = path.split("/");
            return parts[parts.length - 1]
        }
        Array.prototype.forEach.call(mount.opts["files"] || [],
            function(file) {
                WORKERFS.createNode(ensureParent(file.name), base(file.name), WORKERFS.FILE_MODE, 0, file, file.lastModifiedDate)
            }); (mount.opts["blobs"] || []).forEach(function(obj) {
            WORKERFS.createNode(ensureParent(obj["name"]), base(obj["name"]), WORKERFS.FILE_MODE, 0, obj["data"])
        }); (mount.opts["packages"] || []).forEach(function(pack) {
            pack["metadata"].files.forEach(function(file) {
                var name = file.filename.substr(1);
                WORKERFS.createNode(ensureParent(name), base(name), WORKERFS.FILE_MODE, 0, pack["blob"].slice(file.start, file.end))
            })
        });
        return root
    },
    createNode: function(parent, name, mode, dev, contents, mtime) {
        var node = FS.createNode(parent, name, mode);
        node.mode = mode;
        node.node_ops = WORKERFS.node_ops;
        node.stream_ops = WORKERFS.stream_ops;
        node.timestamp = (mtime || new Date).getTime();
        assert(WORKERFS.FILE_MODE !== WORKERFS.DIR_MODE);
        if (mode === WORKERFS.FILE_MODE) {
            node.size = contents.size;
            node.contents = contents
        } else {
            node.size = 4096;
            node.contents = {}
        }
        if (parent) {
            parent.contents[name] = node
        }
        return node
    },
    node_ops: {
        getattr: function(node) {
            return {
                dev: 1,
                ino: undefined,
                mode: node.mode,
                nlink: 1,
                uid: 0,
                gid: 0,
                rdev: undefined,
                size: node.size,
                atime: new Date(node.timestamp),
                mtime: new Date(node.timestamp),
                ctime: new Date(node.timestamp),
                blksize: 4096,
                blocks: Math.ceil(node.size / 4096)
            }
        },
        setattr: function(node, attr) {
            if (attr.mode !== undefined) {
                node.mode = attr.mode
            }
            if (attr.timestamp !== undefined) {
                node.timestamp = attr.timestamp
            }
        },
        lookup: function(parent, name) {
            throw new FS.ErrnoError(2)
        },
        mknod: function(parent, name, mode, dev) {
            throw new FS.ErrnoError(1)
        },
        rename: function(oldNode, newDir, newName) {
            throw new FS.ErrnoError(1)
        },
        unlink: function(parent, name) {
            throw new FS.ErrnoError(1)
        },
        rmdir: function(parent, name) {
            throw new FS.ErrnoError(1)
        },
        readdir: function(node) {
            var entries = [".", ".."];
            for (var key in node.contents) {
                if (!node.contents.hasOwnProperty(key)) {
                    continue
                }
                entries.push(key)
            }
            return entries
        },
        symlink: function(parent, newName, oldPath) {
            throw new FS.ErrnoError(1)
        },
        readlink: function(node) {
            throw new FS.ErrnoError(1)
        }
    },
    stream_ops: {
        read: function(stream, buffer, offset, length, position) {
            if (position >= stream.node.size) return 0;
            var chunk = stream.node.contents.slice(position, position + length);
            var ab = WORKERFS.reader.readAsArrayBuffer(chunk);
            buffer.set(new Uint8Array(ab), offset);
            return chunk.size
        },
        write: function(stream, buffer, offset, length, position) {
            throw new FS.ErrnoError(5)
        },
        llseek: function(stream, offset, whence) {
            var position = offset;
            if (whence === 1) {
                position += stream.position
            } else if (whence === 2) {
                if (FS.isFile(stream.node.mode)) {
                    position += stream.node.size
                }
            }
            if (position < 0) {
                throw new FS.ErrnoError(22)
            }
            return position
        }
    }
};
var FS = {
    root: null,
    mounts: [],
    devices: {},
    streams: [],
    nextInode: 1,
    nameTable: null,
    currentPath: "/",
    initialized: false,
    ignorePermissions: true,
    trackingDelegate: {},
    tracking: {
        openFlags: {
            READ: 1,
            WRITE: 2
        }
    },
    ErrnoError: null,
    genericErrors: {},
    filesystems: null,
    syncFSRequests: 0,
    handleFSError: function(e) {
        if (! (e instanceof FS.ErrnoError)) throw e + " : " + stackTrace();
        return ___setErrNo(e.errno)
    },
    lookupPath: function(path, opts) {
        path = PATH_FS.resolve(FS.cwd(), path);
        opts = opts || {};
        if (!path) return {
            path: "",
            node: null
        };
        var defaults = {
            follow_mount: true,
            recurse_count: 0
        };
        for (var key in defaults) {
            if (opts[key] === undefined) {
                opts[key] = defaults[key]
            }
        }
        if (opts.recurse_count > 8) {
            throw new FS.ErrnoError(40)
        }
        var parts = PATH.normalizeArray(path.split("/").filter(function(p) {
            return !! p
        }), false);
        var current = FS.root;
        var current_path = "/";
        for (var i = 0; i < parts.length; i++) {
            var islast = i === parts.length - 1;
            if (islast && opts.parent) {
                break
            }
            current = FS.lookupNode(current, parts[i]);
            current_path = PATH.join2(current_path, parts[i]);
            if (FS.isMountpoint(current)) {
                if (!islast || islast && opts.follow_mount) {
                    current = current.mounted.root
                }
            }
            if (!islast || opts.follow) {
                var count = 0;
                while (FS.isLink(current.mode)) {
                    var link = FS.readlink(current_path);
                    current_path = PATH_FS.resolve(PATH.dirname(current_path), link);
                    var lookup = FS.lookupPath(current_path, {
                        recurse_count: opts.recurse_count
                    });
                    current = lookup.node;
                    if (count++>40) {
                        throw new FS.ErrnoError(40)
                    }
                }
            }
        }
        return {
            path: current_path,
            node: current
        }
    },
    getPath: function(node) {
        var path;
        while (true) {
            if (FS.isRoot(node)) {
                var mount = node.mount.mountpoint;
                if (!path) return mount;
                return mount[mount.length - 1] !== "/" ? mount + "/" + path: mount + path
            }
            path = path ? node.name + "/" + path: node.name;
            node = node.parent
        }
    },
    hashName: function(parentid, name) {
        var hash = 0;
        for (var i = 0; i < name.length; i++) {
            hash = (hash << 5) - hash + name.charCodeAt(i) | 0
        }
        return (parentid + hash >>> 0) % FS.nameTable.length
    },
    hashAddNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        node.name_next = FS.nameTable[hash];
        FS.nameTable[hash] = node
    },
    hashRemoveNode: function(node) {
        var hash = FS.hashName(node.parent.id, node.name);
        if (FS.nameTable[hash] === node) {
            FS.nameTable[hash] = node.name_next
        } else {
            var current = FS.nameTable[hash];
            while (current) {
                if (current.name_next === node) {
                    current.name_next = node.name_next;
                    break
                }
                current = current.name_next
            }
        }
    },
    lookupNode: function(parent, name) {
        var err = FS.mayLookup(parent);
        if (err) {
            throw new FS.ErrnoError(err, parent)
        }
        var hash = FS.hashName(parent.id, name);
        for (var node = FS.nameTable[hash]; node; node = node.name_next) {
            var nodeName = node.name;
            if (node.parent.id === parent.id && nodeName === name) {
                return node
            }
        }
        return FS.lookup(parent, name)
    },
    createNode: function(parent, name, mode, rdev) {
        if (!FS.FSNode) {
            FS.FSNode = function(parent, name, mode, rdev) {
                if (!parent) {
                    parent = this
                }
                this.parent = parent;
                this.mount = parent.mount;
                this.mounted = null;
                this.id = FS.nextInode++;
                this.name = name;
                this.mode = mode;
                this.node_ops = {};
                this.stream_ops = {};
                this.rdev = rdev
            };
            FS.FSNode.prototype = {};
            var readMode = 292 | 73;
            var writeMode = 146;
            Object.defineProperties(FS.FSNode.prototype, {
                read: {
                    get: function() {
                        return (this.mode & readMode) === readMode
                    },
                    set: function(val) {
                        val ? this.mode |= readMode: this.mode &= ~readMode
                    }
                },
                write: {
                    get: function() {
                        return (this.mode & writeMode) === writeMode
                    },
                    set: function(val) {
                        val ? this.mode |= writeMode: this.mode &= ~writeMode
                    }
                },
                isFolder: {
                    get: function() {
                        return FS.isDir(this.mode)
                    }
                },
                isDevice: {
                    get: function() {
                        return FS.isChrdev(this.mode)
                    }
                }
            })
        }
        var node = new FS.FSNode(parent, name, mode, rdev);
        FS.hashAddNode(node);
        return node
    },
    destroyNode: function(node) {
        FS.hashRemoveNode(node)
    },
    isRoot: function(node) {
        return node === node.parent
    },
    isMountpoint: function(node) {
        return !! node.mounted
    },
    isFile: function(mode) {
        return (mode & 61440) === 32768
    },
    isDir: function(mode) {
        return (mode & 61440) === 16384
    },
    isLink: function(mode) {
        return (mode & 61440) === 40960
    },
    isChrdev: function(mode) {
        return (mode & 61440) === 8192
    },
    isBlkdev: function(mode) {
        return (mode & 61440) === 24576
    },
    isFIFO: function(mode) {
        return (mode & 61440) === 4096
    },
    isSocket: function(mode) {
        return (mode & 49152) === 49152
    },
    flagModes: {
        "r": 0,
        "rs": 1052672,
        "r+": 2,
        "w": 577,
        "wx": 705,
        "xw": 705,
        "w+": 578,
        "wx+": 706,
        "xw+": 706,
        "a": 1089,
        "ax": 1217,
        "xa": 1217,
        "a+": 1090,
        "ax+": 1218,
        "xa+": 1218
    },
    modeStringToFlags: function(str) {
        var flags = FS.flagModes[str];
        if (typeof flags === "undefined") {
            throw new Error("Unknown file open mode: " + str)
        }
        return flags
    },
    flagsToPermissionString: function(flag) {
        var perms = ["r", "w", "rw"][flag & 3];
        if (flag & 512) {
            perms += "w"
        }
        return perms
    },
    nodePermissions: function(node, perms) {
        if (FS.ignorePermissions) {
            return 0
        }
        if (perms.indexOf("r") !== -1 && !(node.mode & 292)) {
            return 13
        } else if (perms.indexOf("w") !== -1 && !(node.mode & 146)) {
            return 13
        } else if (perms.indexOf("x") !== -1 && !(node.mode & 73)) {
            return 13
        }
        return 0
    },
    mayLookup: function(dir) {
        var err = FS.nodePermissions(dir, "x");
        if (err) return err;
        if (!dir.node_ops.lookup) return 13;
        return 0
    },
    mayCreate: function(dir, name) {
        try {
            var node = FS.lookupNode(dir, name);
            return 17
        } catch(e) {}
        return FS.nodePermissions(dir, "wx")
    },
    mayDelete: function(dir, name, isdir) {
        var node;
        try {
            node = FS.lookupNode(dir, name)
        } catch(e) {
            return e.errno
        }
        var err = FS.nodePermissions(dir, "wx");
        if (err) {
            return err
        }
        if (isdir) {
            if (!FS.isDir(node.mode)) {
                return 20
            }
            if (FS.isRoot(node) || FS.getPath(node) === FS.cwd()) {
                return 16
            }
        } else {
            if (FS.isDir(node.mode)) {
                return 21
            }
        }
        return 0
    },
    mayOpen: function(node, flags) {
        if (!node) {
            return 2
        }
        if (FS.isLink(node.mode)) {
            return 40
        } else if (FS.isDir(node.mode)) {
            if (FS.flagsToPermissionString(flags) !== "r" || flags & 512) {
                return 21
            }
        }
        return FS.nodePermissions(node, FS.flagsToPermissionString(flags))
    },
    MAX_OPEN_FDS: 4096,
    nextfd: function(fd_start, fd_end) {
        fd_start = fd_start || 0;
        fd_end = fd_end || FS.MAX_OPEN_FDS;
        for (var fd = fd_start; fd <= fd_end; fd++) {
            if (!FS.streams[fd]) {
                return fd
            }
        }
        throw new FS.ErrnoError(24)
    },
    getStream: function(fd) {
        return FS.streams[fd]
    },
    createStream: function(stream, fd_start, fd_end) {
        if (!FS.FSStream) {
            FS.FSStream = function() {};
            FS.FSStream.prototype = {};
            Object.defineProperties(FS.FSStream.prototype, {
                object: {
                    get: function() {
                        return this.node
                    },
                    set: function(val) {
                        this.node = val
                    }
                },
                isRead: {
                    get: function() {
                        return (this.flags & 2097155) !== 1
                    }
                },
                isWrite: {
                    get: function() {
                        return (this.flags & 2097155) !== 0
                    }
                },
                isAppend: {
                    get: function() {
                        return this.flags & 1024
                    }
                }
            })
        }
        var newStream = new FS.FSStream;
        for (var p in stream) {
            newStream[p] = stream[p]
        }
        stream = newStream;
        var fd = FS.nextfd(fd_start, fd_end);
        stream.fd = fd;
        FS.streams[fd] = stream;
        return stream
    },
    closeStream: function(fd) {
        FS.streams[fd] = null
    },
    chrdev_stream_ops: {
        open: function(stream) {
            var device = FS.getDevice(stream.node.rdev);
            stream.stream_ops = device.stream_ops;
            if (stream.stream_ops.open) {
                stream.stream_ops.open(stream)
            }
        },
        llseek: function() {
            throw new FS.ErrnoError(29)
        }
    },
    major: function(dev) {
        return dev >> 8
    },
    minor: function(dev) {
        return dev & 255
    },
    makedev: function(ma, mi) {
        return ma << 8 | mi
    },
    registerDevice: function(dev, ops) {
        FS.devices[dev] = {
            stream_ops: ops
        }
    },
    getDevice: function(dev) {
        return FS.devices[dev]
    },
    getMounts: function(mount) {
        var mounts = [];
        var check = [mount];
        while (check.length) {
            var m = check.pop();
            mounts.push(m);
            check.push.apply(check, m.mounts)
        }
        return mounts
    },
    syncfs: function(populate, callback) {
        if (typeof populate === "function") {
            callback = populate;
            populate = false
        }
        FS.syncFSRequests++;
        if (FS.syncFSRequests > 1) {
            console.log("warning: " + FS.syncFSRequests + " FS.syncfs operations in flight at once, probably just doing extra work")
        }
        var mounts = FS.getMounts(FS.root.mount);
        var completed = 0;
        function doCallback(err) {
            FS.syncFSRequests--;
            return callback(err)
        }
        function done(err) {
            if (err) {
                if (!done.errored) {
                    done.errored = true;
                    return doCallback(err)
                }
                return
            }
            if (++completed >= mounts.length) {
                doCallback(null)
            }
        }
        mounts.forEach(function(mount) {
            if (!mount.type.syncfs) {
                return done(null)
            }
            mount.type.syncfs(mount, populate, done)
        })
    },
    mount: function(type, opts, mountpoint) {
        var root = mountpoint === "/";
        var pseudo = !mountpoint;
        var node;
        if (root && FS.root) {
            throw new FS.ErrnoError(16)
        } else if (!root && !pseudo) {
            var lookup = FS.lookupPath(mountpoint, {
                follow_mount: false
            });
            mountpoint = lookup.path;
            node = lookup.node;
            if (FS.isMountpoint(node)) {
                throw new FS.ErrnoError(16)
            }
            if (!FS.isDir(node.mode)) {
                throw new FS.ErrnoError(20)
            }
        }
        var mount = {
            type: type,
            opts: opts,
            mountpoint: mountpoint,
            mounts: []
        };
        var mountRoot = type.mount(mount);
        mountRoot.mount = mount;
        mount.root = mountRoot;
        if (root) {
            FS.root = mountRoot
        } else if (node) {
            node.mounted = mount;
            if (node.mount) {
                node.mount.mounts.push(mount)
            }
        }
        return mountRoot
    },
    unmount: function(mountpoint) {
        var lookup = FS.lookupPath(mountpoint, {
            follow_mount: false
        });
        if (!FS.isMountpoint(lookup.node)) {
            throw new FS.ErrnoError(22)
        }
        var node = lookup.node;
        var mount = node.mounted;
        var mounts = FS.getMounts(mount);
        Object.keys(FS.nameTable).forEach(function(hash) {
            var current = FS.nameTable[hash];
            while (current) {
                var next = current.name_next;
                if (mounts.indexOf(current.mount) !== -1) {
                    FS.destroyNode(current)
                }
                current = next
            }
        });
        node.mounted = null;
        var idx = node.mount.mounts.indexOf(mount);
        node.mount.mounts.splice(idx, 1)
    },
    lookup: function(parent, name) {
        return parent.node_ops.lookup(parent, name)
    },
    mknod: function(path, mode, dev) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        if (!name || name === "." || name === "..") {
            throw new FS.ErrnoError(22)
        }
        var err = FS.mayCreate(parent, name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.mknod) {
            throw new FS.ErrnoError(1)
        }
        return parent.node_ops.mknod(parent, name, mode, dev)
    },
    create: function(path, mode) {
        mode = mode !== undefined ? mode: 438;
        mode &= 4095;
        mode |= 32768;
        return FS.mknod(path, mode, 0)
    },
    mkdir: function(path, mode) {
        mode = mode !== undefined ? mode: 511;
        mode &= 511 | 512;
        mode |= 16384;
        return FS.mknod(path, mode, 0)
    },
    mkdirTree: function(path, mode) {
        var dirs = path.split("/");
        var d = "";
        for (var i = 0; i < dirs.length; ++i) {
            if (!dirs[i]) continue;
            d += "/" + dirs[i];
            try {
                FS.mkdir(d, mode)
            } catch(e) {
                if (e.errno != 17) throw e
            }
        }
    },
    mkdev: function(path, mode, dev) {
        if (typeof dev === "undefined") {
            dev = mode;
            mode = 438
        }
        mode |= 8192;
        return FS.mknod(path, mode, dev)
    },
    symlink: function(oldpath, newpath) {
        if (!PATH_FS.resolve(oldpath)) {
            throw new FS.ErrnoError(2)
        }
        var lookup = FS.lookupPath(newpath, {
            parent: true
        });
        var parent = lookup.node;
        if (!parent) {
            throw new FS.ErrnoError(2)
        }
        var newname = PATH.basename(newpath);
        var err = FS.mayCreate(parent, newname);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.symlink) {
            throw new FS.ErrnoError(1)
        }
        return parent.node_ops.symlink(parent, newname, oldpath)
    },
    rename: function(old_path, new_path) {
        var old_dirname = PATH.dirname(old_path);
        var new_dirname = PATH.dirname(new_path);
        var old_name = PATH.basename(old_path);
        var new_name = PATH.basename(new_path);
        var lookup, old_dir, new_dir;
        try {
            lookup = FS.lookupPath(old_path, {
                parent: true
            });
            old_dir = lookup.node;
            lookup = FS.lookupPath(new_path, {
                parent: true
            });
            new_dir = lookup.node
        } catch(e) {
            throw new FS.ErrnoError(16)
        }
        if (!old_dir || !new_dir) throw new FS.ErrnoError(2);
        if (old_dir.mount !== new_dir.mount) {
            throw new FS.ErrnoError(18)
        }
        var old_node = FS.lookupNode(old_dir, old_name);
        var relative = PATH_FS.relative(old_path, new_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(22)
        }
        relative = PATH_FS.relative(new_path, old_dirname);
        if (relative.charAt(0) !== ".") {
            throw new FS.ErrnoError(39)
        }
        var new_node;
        try {
            new_node = FS.lookupNode(new_dir, new_name)
        } catch(e) {}
        if (old_node === new_node) {
            return
        }
        var isdir = FS.isDir(old_node.mode);
        var err = FS.mayDelete(old_dir, old_name, isdir);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        err = new_node ? FS.mayDelete(new_dir, new_name, isdir) : FS.mayCreate(new_dir, new_name);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!old_dir.node_ops.rename) {
            throw new FS.ErrnoError(1)
        }
        if (FS.isMountpoint(old_node) || new_node && FS.isMountpoint(new_node)) {
            throw new FS.ErrnoError(16)
        }
        if (new_dir !== old_dir) {
            err = FS.nodePermissions(old_dir, "w");
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        try {
            if (FS.trackingDelegate["willMovePath"]) {
                FS.trackingDelegate["willMovePath"](old_path, new_path)
            }
        } catch(e) {
            console.log("FS.trackingDelegate['willMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
        FS.hashRemoveNode(old_node);
        try {
            old_dir.node_ops.rename(old_node, new_dir, new_name)
        } catch(e) {
            throw e
        } finally {
            FS.hashAddNode(old_node)
        }
        try {
            if (FS.trackingDelegate["onMovePath"]) FS.trackingDelegate["onMovePath"](old_path, new_path)
        } catch(e) {
            console.log("FS.trackingDelegate['onMovePath']('" + old_path + "', '" + new_path + "') threw an exception: " + e.message)
        }
    },
    rmdir: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, true);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.rmdir) {
            throw new FS.ErrnoError(1)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(16)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch(e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.rmdir(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch(e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        if (!node.node_ops.readdir) {
            throw new FS.ErrnoError(20)
        }
        return node.node_ops.readdir(node)
    },
    unlink: function(path) {
        var lookup = FS.lookupPath(path, {
            parent: true
        });
        var parent = lookup.node;
        var name = PATH.basename(path);
        var node = FS.lookupNode(parent, name);
        var err = FS.mayDelete(parent, name, false);
        if (err) {
            throw new FS.ErrnoError(err)
        }
        if (!parent.node_ops.unlink) {
            throw new FS.ErrnoError(1)
        }
        if (FS.isMountpoint(node)) {
            throw new FS.ErrnoError(16)
        }
        try {
            if (FS.trackingDelegate["willDeletePath"]) {
                FS.trackingDelegate["willDeletePath"](path)
            }
        } catch(e) {
            console.log("FS.trackingDelegate['willDeletePath']('" + path + "') threw an exception: " + e.message)
        }
        parent.node_ops.unlink(parent, name);
        FS.destroyNode(node);
        try {
            if (FS.trackingDelegate["onDeletePath"]) FS.trackingDelegate["onDeletePath"](path)
        } catch(e) {
            console.log("FS.trackingDelegate['onDeletePath']('" + path + "') threw an exception: " + e.message)
        }
    },
    readlink: function(path) {
        var lookup = FS.lookupPath(path);
        var link = lookup.node;
        if (!link) {
            throw new FS.ErrnoError(2)
        }
        if (!link.node_ops.readlink) {
            throw new FS.ErrnoError(22)
        }
        return PATH_FS.resolve(FS.getPath(link.parent), link.node_ops.readlink(link))
    },
    stat: function(path, dontFollow) {
        var lookup = FS.lookupPath(path, {
            follow: !dontFollow
        });
        var node = lookup.node;
        if (!node) {
            throw new FS.ErrnoError(2)
        }
        if (!node.node_ops.getattr) {
            throw new FS.ErrnoError(1)
        }
        return node.node_ops.getattr(node)
    },
    lstat: function(path) {
        return FS.stat(path, true)
    },
    chmod: function(path, mode, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(1)
        }
        node.node_ops.setattr(node, {
            mode: mode & 4095 | node.mode & ~4095,
            timestamp: Date.now()
        })
    },
    lchmod: function(path, mode) {
        FS.chmod(path, mode, true)
    },
    fchmod: function(fd, mode) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(9)
        }
        FS.chmod(stream.node, mode)
    },
    chown: function(path, uid, gid, dontFollow) {
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: !dontFollow
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(1)
        }
        node.node_ops.setattr(node, {
            timestamp: Date.now()
        })
    },
    lchown: function(path, uid, gid) {
        FS.chown(path, uid, gid, true)
    },
    fchown: function(fd, uid, gid) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(9)
        }
        FS.chown(stream.node, uid, gid)
    },
    truncate: function(path, len) {
        if (len < 0) {
            throw new FS.ErrnoError(22)
        }
        var node;
        if (typeof path === "string") {
            var lookup = FS.lookupPath(path, {
                follow: true
            });
            node = lookup.node
        } else {
            node = path
        }
        if (!node.node_ops.setattr) {
            throw new FS.ErrnoError(1)
        }
        if (FS.isDir(node.mode)) {
            throw new FS.ErrnoError(21)
        }
        if (!FS.isFile(node.mode)) {
            throw new FS.ErrnoError(22)
        }
        var err = FS.nodePermissions(node, "w");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        node.node_ops.setattr(node, {
            size: len,
            timestamp: Date.now()
        })
    },
    ftruncate: function(fd, len) {
        var stream = FS.getStream(fd);
        if (!stream) {
            throw new FS.ErrnoError(9)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(22)
        }
        FS.truncate(stream.node, len)
    },
    utime: function(path, atime, mtime) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        var node = lookup.node;
        node.node_ops.setattr(node, {
            timestamp: Math.max(atime, mtime)
        })
    },
    open: function(path, flags, mode, fd_start, fd_end) {
        if (path === "") {
            throw new FS.ErrnoError(2)
        }
        flags = typeof flags === "string" ? FS.modeStringToFlags(flags) : flags;
        mode = typeof mode === "undefined" ? 438 : mode;
        if (flags & 64) {
            mode = mode & 4095 | 32768
        } else {
            mode = 0
        }
        var node;
        if (typeof path === "object") {
            node = path
        } else {
            path = PATH.normalize(path);
            try {
                var lookup = FS.lookupPath(path, {
                    follow: !(flags & 131072)
                });
                node = lookup.node
            } catch(e) {}
        }
        var created = false;
        if (flags & 64) {
            if (node) {
                if (flags & 128) {
                    throw new FS.ErrnoError(17)
                }
            } else {
                node = FS.mknod(path, mode, 0);
                created = true
            }
        }
        if (!node) {
            throw new FS.ErrnoError(2)
        }
        if (FS.isChrdev(node.mode)) {
            flags &= ~512
        }
        if (flags & 65536 && !FS.isDir(node.mode)) {
            throw new FS.ErrnoError(20)
        }
        if (!created) {
            var err = FS.mayOpen(node, flags);
            if (err) {
                throw new FS.ErrnoError(err)
            }
        }
        if (flags & 512) {
            FS.truncate(node, 0)
        }
        flags &= ~ (128 | 512);
        var stream = FS.createStream({
                node: node,
                path: FS.getPath(node),
                flags: flags,
                seekable: true,
                position: 0,
                stream_ops: node.stream_ops,
                ungotten: [],
                error: false
            },
            fd_start, fd_end);
        if (stream.stream_ops.open) {
            stream.stream_ops.open(stream)
        }
        if (Module["logReadFiles"] && !(flags & 1)) {
            if (!FS.readFiles) FS.readFiles = {};
            if (! (path in FS.readFiles)) {
                FS.readFiles[path] = 1;
                console.log("FS.trackingDelegate error on read file: " + path)
            }
        }
        try {
            if (FS.trackingDelegate["onOpenFile"]) {
                var trackingFlags = 0;
                if ((flags & 2097155) !== 1) {
                    trackingFlags |= FS.tracking.openFlags.READ
                }
                if ((flags & 2097155) !== 0) {
                    trackingFlags |= FS.tracking.openFlags.WRITE
                }
                FS.trackingDelegate["onOpenFile"](path, trackingFlags)
            }
        } catch(e) {
            console.log("FS.trackingDelegate['onOpenFile']('" + path + "', flags) threw an exception: " + e.message)
        }
        return stream
    },
    close: function(stream) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9)
        }
        if (stream.getdents) stream.getdents = null;
        try {
            if (stream.stream_ops.close) {
                stream.stream_ops.close(stream)
            }
        } catch(e) {
            throw e
        } finally {
            FS.closeStream(stream.fd)
        }
        stream.fd = null
    },
    isClosed: function(stream) {
        return stream.fd === null
    },
    llseek: function(stream, offset, whence) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9)
        }
        if (!stream.seekable || !stream.stream_ops.llseek) {
            throw new FS.ErrnoError(29)
        }
        if (whence != 0 && whence != 1 && whence != 2) {
            throw new FS.ErrnoError(22)
        }
        stream.position = stream.stream_ops.llseek(stream, offset, whence);
        stream.ungotten = [];
        return stream.position
    },
    read: function(stream, buffer, offset, length, position) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(22)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(9)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(21)
        }
        if (!stream.stream_ops.read) {
            throw new FS.ErrnoError(22)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(29)
        }
        var bytesRead = stream.stream_ops.read(stream, buffer, offset, length, position);
        if (!seeking) stream.position += bytesRead;
        return bytesRead
    },
    write: function(stream, buffer, offset, length, position, canOwn) {
        if (length < 0 || position < 0) {
            throw new FS.ErrnoError(22)
        }
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(9)
        }
        if (FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(21)
        }
        if (!stream.stream_ops.write) {
            throw new FS.ErrnoError(22)
        }
        if (stream.flags & 1024) {
            FS.llseek(stream, 0, 2)
        }
        var seeking = typeof position !== "undefined";
        if (!seeking) {
            position = stream.position
        } else if (!stream.seekable) {
            throw new FS.ErrnoError(29)
        }
        var bytesWritten = stream.stream_ops.write(stream, buffer, offset, length, position, canOwn);
        if (!seeking) stream.position += bytesWritten;
        try {
            if (stream.path && FS.trackingDelegate["onWriteToFile"]) FS.trackingDelegate["onWriteToFile"](stream.path)
        } catch(e) {
            console.log("FS.trackingDelegate['onWriteToFile']('" + stream.path + "') threw an exception: " + e.message)
        }
        return bytesWritten
    },
    allocate: function(stream, offset, length) {
        if (FS.isClosed(stream)) {
            throw new FS.ErrnoError(9)
        }
        if (offset < 0 || length <= 0) {
            throw new FS.ErrnoError(22)
        }
        if ((stream.flags & 2097155) === 0) {
            throw new FS.ErrnoError(9)
        }
        if (!FS.isFile(stream.node.mode) && !FS.isDir(stream.node.mode)) {
            throw new FS.ErrnoError(19)
        }
        if (!stream.stream_ops.allocate) {
            throw new FS.ErrnoError(95)
        }
        stream.stream_ops.allocate(stream, offset, length)
    },
    mmap: function(stream, buffer, offset, length, position, prot, flags) {
        if ((prot & 2) !== 0 && (flags & 2) === 0 && (stream.flags & 2097155) !== 2) {
            throw new FS.ErrnoError(13)
        }
        if ((stream.flags & 2097155) === 1) {
            throw new FS.ErrnoError(13)
        }
        if (!stream.stream_ops.mmap) {
            throw new FS.ErrnoError(19)
        }
        return stream.stream_ops.mmap(stream, buffer, offset, length, position, prot, flags)
    },
    msync: function(stream, buffer, offset, length, mmapFlags) {
        if (!stream || !stream.stream_ops.msync) {
            return 0
        }
        return stream.stream_ops.msync(stream, buffer, offset, length, mmapFlags)
    },
    munmap: function(stream) {
        return 0
    },
    ioctl: function(stream, cmd, arg) {
        if (!stream.stream_ops.ioctl) {
            throw new FS.ErrnoError(25)
        }
        return stream.stream_ops.ioctl(stream, cmd, arg)
    },
    readFile: function(path, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "r";
        opts.encoding = opts.encoding || "binary";
        if (opts.encoding !== "utf8" && opts.encoding !== "binary") {
            throw new Error('Invalid encoding type "' + opts.encoding + '"')
        }
        var ret;
        var stream = FS.open(path, opts.flags);
        var stat = FS.stat(path);
        var length = stat.size;
        var buf = new Uint8Array(length);
        FS.read(stream, buf, 0, length, 0);
        if (opts.encoding === "utf8") {
            ret = UTF8ArrayToString(buf, 0)
        } else if (opts.encoding === "binary") {
            ret = buf
        }
        FS.close(stream);
        return ret
    },
    writeFile: function(path, data, opts) {
        opts = opts || {};
        opts.flags = opts.flags || "w";
        var stream = FS.open(path, opts.flags, opts.mode);
        if (typeof data === "string") {
            var buf = new Uint8Array(lengthBytesUTF8(data) + 1);
            var actualNumBytes = stringToUTF8Array(data, buf, 0, buf.length);
            FS.write(stream, buf, 0, actualNumBytes, undefined, opts.canOwn)
        } else if (ArrayBuffer.isView(data)) {
            FS.write(stream, data, 0, data.byteLength, undefined, opts.canOwn)
        } else {
            throw new Error("Unsupported data type")
        }
        FS.close(stream)
    },
    cwd: function() {
        return FS.currentPath
    },
    chdir: function(path) {
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        if (lookup.node === null) {
            throw new FS.ErrnoError(2)
        }
        if (!FS.isDir(lookup.node.mode)) {
            throw new FS.ErrnoError(20)
        }
        var err = FS.nodePermissions(lookup.node, "x");
        if (err) {
            throw new FS.ErrnoError(err)
        }
        FS.currentPath = lookup.path
    },
    createDefaultDirectories: function() {
        FS.mkdir("/tmp");
        FS.mkdir("/home");
        FS.mkdir("/home/web_user")
    },
    createDefaultDevices: function() {
        FS.mkdir("/dev");
        FS.registerDevice(FS.makedev(1, 3), {
            read: function() {
                return 0
            },
            write: function(stream, buffer, offset, length, pos) {
                return length
            }
        });
        FS.mkdev("/dev/null", FS.makedev(1, 3));
        TTY.register(FS.makedev(5, 0), TTY.default_tty_ops);
        TTY.register(FS.makedev(6, 0), TTY.default_tty1_ops);
        FS.mkdev("/dev/tty", FS.makedev(5, 0));
        FS.mkdev("/dev/tty1", FS.makedev(6, 0));
        var random_device;
        if (typeof crypto === "object" && typeof crypto["getRandomValues"] === "function") {
            var randomBuffer = new Uint8Array(1);
            random_device = function() {
                crypto.getRandomValues(randomBuffer);
                return randomBuffer[0]
            }
        } else if (ENVIRONMENT_IS_NODE) {
            try {
                var crypto_module = require("crypto");
                random_device = function() {
                    return crypto_module["randomBytes"](1)[0]
                }
            } catch(e) {}
        } else {}
        if (!random_device) {
            random_device = function() {
                abort("random_device")
            }
        }
        FS.createDevice("/dev", "random", random_device);
        FS.createDevice("/dev", "urandom", random_device);
        FS.mkdir("/dev/shm");
        FS.mkdir("/dev/shm/tmp")
    },
    createSpecialDirectories: function() {
        FS.mkdir("/proc");
        FS.mkdir("/proc/self");
        FS.mkdir("/proc/self/fd");
        FS.mount({
                mount: function() {
                    var node = FS.createNode("/proc/self", "fd", 16384 | 511, 73);
                    node.node_ops = {
                        lookup: function(parent, name) {
                            var fd = +name;
                            var stream = FS.getStream(fd);
                            if (!stream) throw new FS.ErrnoError(9);
                            var ret = {
                                parent: null,
                                mount: {
                                    mountpoint: "fake"
                                },
                                node_ops: {
                                    readlink: function() {
                                        return stream.path
                                    }
                                }
                            };
                            ret.parent = ret;
                            return ret
                        }
                    };
                    return node
                }
            },
            {},
            "/proc/self/fd")
    },
    createStandardStreams: function() {
        if (Module["stdin"]) {
            FS.createDevice("/dev", "stdin", Module["stdin"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdin")
        }
        if (Module["stdout"]) {
            FS.createDevice("/dev", "stdout", null, Module["stdout"])
        } else {
            FS.symlink("/dev/tty", "/dev/stdout")
        }
        if (Module["stderr"]) {
            FS.createDevice("/dev", "stderr", null, Module["stderr"])
        } else {
            FS.symlink("/dev/tty1", "/dev/stderr")
        }
        var stdin = FS.open("/dev/stdin", "r");
        var stdout = FS.open("/dev/stdout", "w");
        var stderr = FS.open("/dev/stderr", "w")
    },
    ensureErrnoError: function() {
        if (FS.ErrnoError) return;
        FS.ErrnoError = function ErrnoError(errno, node) {
            this.node = node;
            this.setErrno = function(errno) {
                this.errno = errno
            };
            this.setErrno(errno);
            this.message = "FS error"
        };
        FS.ErrnoError.prototype = new Error;
        FS.ErrnoError.prototype.constructor = FS.ErrnoError; [2].forEach(function(code) {
            FS.genericErrors[code] = new FS.ErrnoError(code);
            FS.genericErrors[code].stack = "<generic error, no stack>"
        })
    },
    staticInit: function() {
        FS.ensureErrnoError();
        FS.nameTable = new Array(4096);
        FS.mount(MEMFS, {},
            "/");
        FS.createDefaultDirectories();
        FS.createDefaultDevices();
        FS.createSpecialDirectories();
        FS.filesystems = {
            "MEMFS": MEMFS,
            "IDBFS": IDBFS,
            "NODEFS": NODEFS,
            "WORKERFS": WORKERFS
        }
    },
    init: function(input, output, error) {
        FS.init.initialized = true;
        FS.ensureErrnoError();
        Module["stdin"] = input || Module["stdin"];
        Module["stdout"] = output || Module["stdout"];
        Module["stderr"] = error || Module["stderr"];
        FS.createStandardStreams()
    },
    quit: function() {
        FS.init.initialized = false;
        var fflush = Module["_fflush"];
        if (fflush) fflush(0);
        for (var i = 0; i < FS.streams.length; i++) {
            var stream = FS.streams[i];
            if (!stream) {
                continue
            }
            FS.close(stream)
        }
    },
    getMode: function(canRead, canWrite) {
        var mode = 0;
        if (canRead) mode |= 292 | 73;
        if (canWrite) mode |= 146;
        return mode
    },
    joinPath: function(parts, forceRelative) {
        var path = PATH.join.apply(null, parts);
        if (forceRelative && path[0] == "/") path = path.substr(1);
        return path
    },
    absolutePath: function(relative, base) {
        return PATH_FS.resolve(base, relative)
    },
    standardizePath: function(path) {
        return PATH.normalize(path)
    },
    findObject: function(path, dontResolveLastLink) {
        var ret = FS.analyzePath(path, dontResolveLastLink);
        if (ret.exists) {
            return ret.object
        } else {
            ___setErrNo(ret.error);
            return null
        }
    },
    analyzePath: function(path, dontResolveLastLink) {
        try {
            var lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            path = lookup.path
        } catch(e) {}
        var ret = {
            isRoot: false,
            exists: false,
            error: 0,
            name: null,
            path: null,
            object: null,
            parentExists: false,
            parentPath: null,
            parentObject: null
        };
        try {
            var lookup = FS.lookupPath(path, {
                parent: true
            });
            ret.parentExists = true;
            ret.parentPath = lookup.path;
            ret.parentObject = lookup.node;
            ret.name = PATH.basename(path);
            lookup = FS.lookupPath(path, {
                follow: !dontResolveLastLink
            });
            ret.exists = true;
            ret.path = lookup.path;
            ret.object = lookup.node;
            ret.name = lookup.node.name;
            ret.isRoot = lookup.path === "/"
        } catch(e) {
            ret.error = e.errno
        }
        return ret
    },
    createFolder: function(parent, name, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent: FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.mkdir(path, mode)
    },
    createPath: function(parent, path, canRead, canWrite) {
        parent = typeof parent === "string" ? parent: FS.getPath(parent);
        var parts = path.split("/").reverse();
        while (parts.length) {
            var part = parts.pop();
            if (!part) continue;
            var current = PATH.join2(parent, part);
            try {
                FS.mkdir(current)
            } catch(e) {}
            parent = current
        }
        return current
    },
    createFile: function(parent, name, properties, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent: FS.getPath(parent), name);
        var mode = FS.getMode(canRead, canWrite);
        return FS.create(path, mode)
    },
    createDataFile: function(parent, name, data, canRead, canWrite, canOwn) {
        var path = name ? PATH.join2(typeof parent === "string" ? parent: FS.getPath(parent), name) : parent;
        var mode = FS.getMode(canRead, canWrite);
        var node = FS.create(path, mode);
        if (data) {
            if (typeof data === "string") {
                var arr = new Array(data.length);
                for (var i = 0,
                         len = data.length; i < len; ++i) arr[i] = data.charCodeAt(i);
                data = arr
            }
            FS.chmod(node, mode | 146);
            var stream = FS.open(node, "w");
            FS.write(stream, data, 0, data.length, 0, canOwn);
            FS.close(stream);
            FS.chmod(node, mode)
        }
        return node
    },
    createDevice: function(parent, name, input, output) {
        var path = PATH.join2(typeof parent === "string" ? parent: FS.getPath(parent), name);
        var mode = FS.getMode( !! input, !!output);
        if (!FS.createDevice.major) FS.createDevice.major = 64;
        var dev = FS.makedev(FS.createDevice.major++, 0);
        FS.registerDevice(dev, {
            open: function(stream) {
                stream.seekable = false
            },
            close: function(stream) {
                if (output && output.buffer && output.buffer.length) {
                    output(10)
                }
            },
            read: function(stream, buffer, offset, length, pos) {
                var bytesRead = 0;
                for (var i = 0; i < length; i++) {
                    var result;
                    try {
                        result = input()
                    } catch(e) {
                        throw new FS.ErrnoError(5)
                    }
                    if (result === undefined && bytesRead === 0) {
                        throw new FS.ErrnoError(11)
                    }
                    if (result === null || result === undefined) break;
                    bytesRead++;
                    buffer[offset + i] = result
                }
                if (bytesRead) {
                    stream.node.timestamp = Date.now()
                }
                return bytesRead
            },
            write: function(stream, buffer, offset, length, pos) {
                for (var i = 0; i < length; i++) {
                    try {
                        output(buffer[offset + i])
                    } catch(e) {
                        throw new FS.ErrnoError(5)
                    }
                }
                if (length) {
                    stream.node.timestamp = Date.now()
                }
                return i
            }
        });
        return FS.mkdev(path, mode, dev)
    },
    createLink: function(parent, name, target, canRead, canWrite) {
        var path = PATH.join2(typeof parent === "string" ? parent: FS.getPath(parent), name);
        return FS.symlink(target, path)
    },
    forceLoadFile: function(obj) {
        if (obj.isDevice || obj.isFolder || obj.link || obj.contents) return true;
        var success = true;
        if (typeof XMLHttpRequest !== "undefined") {
            throw new Error("Lazy loading should have been performed (contents set) in createLazyFile, but it was not. Lazy loading only works in web workers. Use --embed-file or --preload-file in emcc on the main thread.")
        } else if (read_) {
            try {
                obj.contents = intArrayFromString(read_(obj.url), true);
                obj.usedBytes = obj.contents.length
            } catch(e) {
                success = false
            }
        } else {
            throw new Error("Cannot load without read() or XMLHttpRequest.")
        }
        if (!success) ___setErrNo(5);
        return success
    },
    createLazyFile: function(parent, name, url, canRead, canWrite) {
        function LazyUint8Array() {
            this.lengthKnown = false;
            this.chunks = []
        }
        LazyUint8Array.prototype.get = function LazyUint8Array_get(idx) {
            if (idx > this.length - 1 || idx < 0) {
                return undefined
            }
            var chunkOffset = idx % this.chunkSize;
            var chunkNum = idx / this.chunkSize | 0;
            return this.getter(chunkNum)[chunkOffset]
        };
        LazyUint8Array.prototype.setDataGetter = function LazyUint8Array_setDataGetter(getter) {
            this.getter = getter
        };
        LazyUint8Array.prototype.cacheLength = function LazyUint8Array_cacheLength() {
            var xhr = new XMLHttpRequest;
            xhr.open("HEAD", url, false);
            xhr.send(null);
            if (! (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
            var datalength = Number(xhr.getResponseHeader("Content-length"));
            var header;
            var hasByteServing = (header = xhr.getResponseHeader("Accept-Ranges")) && header === "bytes";
            var usesGzip = (header = xhr.getResponseHeader("Content-Encoding")) && header === "gzip";
            var chunkSize = 1024 * 1024;
            if (!hasByteServing) chunkSize = datalength;
            var doXHR = function(from, to) {
                if (from > to) throw new Error("invalid range (" + from + ", " + to + ") or no bytes requested!");
                if (to > datalength - 1) throw new Error("only " + datalength + " bytes available! programmer error!");
                var xhr = new XMLHttpRequest;
                xhr.open("GET", url, false);
                if (datalength !== chunkSize) xhr.setRequestHeader("Range", "bytes=" + from + "-" + to);
                if (typeof Uint8Array != "undefined") xhr.responseType = "arraybuffer";
                if (xhr.overrideMimeType) {
                    xhr.overrideMimeType("text/plain; charset=x-user-defined")
                }
                xhr.send(null);
                if (! (xhr.status >= 200 && xhr.status < 300 || xhr.status === 304)) throw new Error("Couldn't load " + url + ". Status: " + xhr.status);
                if (xhr.response !== undefined) {
                    return new Uint8Array(xhr.response || [])
                } else {
                    return intArrayFromString(xhr.responseText || "", true)
                }
            };
            var lazyArray = this;
            lazyArray.setDataGetter(function(chunkNum) {
                var start = chunkNum * chunkSize;
                var end = (chunkNum + 1) * chunkSize - 1;
                end = Math.min(end, datalength - 1);
                if (typeof lazyArray.chunks[chunkNum] === "undefined") {
                    lazyArray.chunks[chunkNum] = doXHR(start, end)
                }
                if (typeof lazyArray.chunks[chunkNum] === "undefined") throw new Error("doXHR failed!");
                return lazyArray.chunks[chunkNum]
            });
            if (usesGzip || !datalength) {
                chunkSize = datalength = 1;
                datalength = this.getter(0).length;
                chunkSize = datalength;
                console.log("LazyFiles on gzip forces download of the whole file when length is accessed")
            }
            this._length = datalength;
            this._chunkSize = chunkSize;
            this.lengthKnown = true
        };
        if (typeof XMLHttpRequest !== "undefined") {
            if (!ENVIRONMENT_IS_WORKER) throw "Cannot do synchronous binary XHRs outside webworkers in modern browsers. Use --embed-file or --preload-file in emcc";
            var lazyArray = new LazyUint8Array;
            Object.defineProperties(lazyArray, {
                length: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._length
                    }
                },
                chunkSize: {
                    get: function() {
                        if (!this.lengthKnown) {
                            this.cacheLength()
                        }
                        return this._chunkSize
                    }
                }
            });
            var properties = {
                isDevice: false,
                contents: lazyArray
            }
        } else {
            var properties = {
                isDevice: false,
                url: url
            }
        }
        var node = FS.createFile(parent, name, properties, canRead, canWrite);
        if (properties.contents) {
            node.contents = properties.contents
        } else if (properties.url) {
            node.contents = null;
            node.url = properties.url
        }
        Object.defineProperties(node, {
            usedBytes: {
                get: function() {
                    return this.contents.length
                }
            }
        });
        var stream_ops = {};
        var keys = Object.keys(node.stream_ops);
        keys.forEach(function(key) {
            var fn = node.stream_ops[key];
            stream_ops[key] = function forceLoadLazyFile() {
                if (!FS.forceLoadFile(node)) {
                    throw new FS.ErrnoError(5)
                }
                return fn.apply(null, arguments)
            }
        });
        stream_ops.read = function stream_ops_read(stream, buffer, offset, length, position) {
            if (!FS.forceLoadFile(node)) {
                throw new FS.ErrnoError(5)
            }
            var contents = stream.node.contents;
            if (position >= contents.length) return 0;
            var size = Math.min(contents.length - position, length);
            if (contents.slice) {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents[position + i]
                }
            } else {
                for (var i = 0; i < size; i++) {
                    buffer[offset + i] = contents.get(position + i)
                }
            }
            return size
        };
        node.stream_ops = stream_ops;
        return node
    },
    createPreloadedFile: function(parent, name, url, canRead, canWrite, onload, onerror, dontCreateFile, canOwn, preFinish) {
        Browser.init();
        var fullname = name ? PATH_FS.resolve(PATH.join2(parent, name)) : parent;
        var dep = getUniqueRunDependency("cp " + fullname);
        function processData(byteArray) {
            function finish(byteArray) {
                if (preFinish) preFinish();
                if (!dontCreateFile) {
                    FS.createDataFile(parent, name, byteArray, canRead, canWrite, canOwn)
                }
                if (onload) onload();
                removeRunDependency(dep)
            }
            var handled = false;
            Module["preloadPlugins"].forEach(function(plugin) {
                if (handled) return;
                if (plugin["canHandle"](fullname)) {
                    plugin["handle"](byteArray, fullname, finish,
                        function() {
                            if (onerror) onerror();
                            removeRunDependency(dep)
                        });
                    handled = true
                }
            });
            if (!handled) finish(byteArray)
        }
        addRunDependency(dep);
        if (typeof url == "string") {
            Browser.asyncLoad(url,
                function(byteArray) {
                    processData(byteArray)
                },
                onerror)
        } else {
            processData(url)
        }
    },
    indexedDB: function() {
        return window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
    },
    DB_NAME: function() {
        return "EM_FS_" + window.location.pathname
    },
    DB_VERSION: 20,
    DB_STORE_NAME: "FILE_DATA",
    saveFilesToDB: function(paths, onload, onerror) {
        onload = onload ||
            function() {};
        onerror = onerror ||
            function() {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch(e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = function openRequest_onupgradeneeded() {
            console.log("creating db");
            var db = openRequest.result;
            db.createObjectStore(FS.DB_STORE_NAME)
        };
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            var transaction = db.transaction([FS.DB_STORE_NAME], "readwrite");
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;
            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function(path) {
                var putRequest = files.put(FS.analyzePath(path).object.contents, path);
                putRequest.onsuccess = function putRequest_onsuccess() {
                    ok++;
                    if (ok + fail == total) finish()
                };
                putRequest.onerror = function putRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    },
    loadFilesFromDB: function(paths, onload, onerror) {
        onload = onload ||
            function() {};
        onerror = onerror ||
            function() {};
        var indexedDB = FS.indexedDB();
        try {
            var openRequest = indexedDB.open(FS.DB_NAME(), FS.DB_VERSION)
        } catch(e) {
            return onerror(e)
        }
        openRequest.onupgradeneeded = onerror;
        openRequest.onsuccess = function openRequest_onsuccess() {
            var db = openRequest.result;
            try {
                var transaction = db.transaction([FS.DB_STORE_NAME], "readonly")
            } catch(e) {
                onerror(e);
                return
            }
            var files = transaction.objectStore(FS.DB_STORE_NAME);
            var ok = 0,
                fail = 0,
                total = paths.length;
            function finish() {
                if (fail == 0) onload();
                else onerror()
            }
            paths.forEach(function(path) {
                var getRequest = files.get(path);
                getRequest.onsuccess = function getRequest_onsuccess() {
                    if (FS.analyzePath(path).exists) {
                        FS.unlink(path)
                    }
                    FS.createDataFile(PATH.dirname(path), PATH.basename(path), getRequest.result, true, true, true);
                    ok++;
                    if (ok + fail == total) finish()
                };
                getRequest.onerror = function getRequest_onerror() {
                    fail++;
                    if (ok + fail == total) finish()
                }
            });
            transaction.onerror = onerror
        };
        openRequest.onerror = onerror
    }
};
var SYSCALLS = {
    DEFAULT_POLLMASK: 5,
    mappings: {},
    umask: 511,
    calculateAt: function(dirfd, path) {
        if (path[0] !== "/") {
            var dir;
            if (dirfd === -100) {
                dir = FS.cwd()
            } else {
                var dirstream = FS.getStream(dirfd);
                if (!dirstream) throw new FS.ErrnoError(9);
                dir = dirstream.path
            }
            path = PATH.join2(dir, path)
        }
        return path
    },
    doStat: function(func, path, buf) {
        try {
            var stat = func(path)
        } catch(e) {
            if (e && e.node && PATH.normalize(path) !== PATH.normalize(FS.getPath(e.node))) {
                return - 20
            }
            throw e
        }
        HEAP32[buf >> 2] = stat.dev;
        HEAP32[buf + 4 >> 2] = 0;
        HEAP32[buf + 8 >> 2] = stat.ino;
        HEAP32[buf + 12 >> 2] = stat.mode;
        HEAP32[buf + 16 >> 2] = stat.nlink;
        HEAP32[buf + 20 >> 2] = stat.uid;
        HEAP32[buf + 24 >> 2] = stat.gid;
        HEAP32[buf + 28 >> 2] = stat.rdev;
        HEAP32[buf + 32 >> 2] = 0;
        tempI64 = [stat.size >>> 0, (tempDouble = stat.size, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min( + Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~ + Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[buf + 40 >> 2] = tempI64[0],
            HEAP32[buf + 44 >> 2] = tempI64[1];
        HEAP32[buf + 48 >> 2] = 4096;
        HEAP32[buf + 52 >> 2] = stat.blocks;
        HEAP32[buf + 56 >> 2] = stat.atime.getTime() / 1e3 | 0;
        HEAP32[buf + 60 >> 2] = 0;
        HEAP32[buf + 64 >> 2] = stat.mtime.getTime() / 1e3 | 0;
        HEAP32[buf + 68 >> 2] = 0;
        HEAP32[buf + 72 >> 2] = stat.ctime.getTime() / 1e3 | 0;
        HEAP32[buf + 76 >> 2] = 0;
        tempI64 = [stat.ino >>> 0, (tempDouble = stat.ino, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min( + Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~ + Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[buf + 80 >> 2] = tempI64[0],
            HEAP32[buf + 84 >> 2] = tempI64[1];
        return 0
    },
    doMsync: function(addr, stream, len, flags) {
        var buffer = new Uint8Array(HEAPU8.subarray(addr, addr + len));
        FS.msync(stream, buffer, 0, len, flags)
    },
    doMkdir: function(path, mode) {
        path = PATH.normalize(path);
        if (path[path.length - 1] === "/") path = path.substr(0, path.length - 1);
        FS.mkdir(path, mode, 0);
        return 0
    },
    doMknod: function(path, mode, dev) {
        switch (mode & 61440) {
            case 32768:
            case 8192:
            case 24576:
            case 4096:
            case 49152:
                break;
            default:
                return - 22
        }
        FS.mknod(path, mode, dev);
        return 0
    },
    doReadlink: function(path, buf, bufsize) {
        if (bufsize <= 0) return - 22;
        var ret = FS.readlink(path);
        var len = Math.min(bufsize, lengthBytesUTF8(ret));
        var endChar = HEAP8[buf + len];
        stringToUTF8(ret, buf, bufsize + 1);
        HEAP8[buf + len] = endChar;
        return len
    },
    doAccess: function(path, amode) {
        if (amode & ~7) {
            return - 22
        }
        var node;
        var lookup = FS.lookupPath(path, {
            follow: true
        });
        node = lookup.node;
        if (!node) {
            return - 2
        }
        var perms = "";
        if (amode & 4) perms += "r";
        if (amode & 2) perms += "w";
        if (amode & 1) perms += "x";
        if (perms && FS.nodePermissions(node, perms)) {
            return - 13
        }
        return 0
    },
    doDup: function(path, flags, suggestFD) {
        var suggest = FS.getStream(suggestFD);
        if (suggest) FS.close(suggest);
        return FS.open(path, flags, 0, suggestFD, suggestFD).fd
    },
    doReadv: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.read(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return - 1;
            ret += curr;
            if (curr < len) break
        }
        return ret
    },
    doWritev: function(stream, iov, iovcnt, offset) {
        var ret = 0;
        for (var i = 0; i < iovcnt; i++) {
            var ptr = HEAP32[iov + i * 8 >> 2];
            var len = HEAP32[iov + (i * 8 + 4) >> 2];
            var curr = FS.write(stream, HEAP8, ptr, len, offset);
            if (curr < 0) return - 1;
            ret += curr
        }
        return ret
    },
    varargs: 0,
    get: function(varargs) {
        SYSCALLS.varargs += 4;
        var ret = HEAP32[SYSCALLS.varargs - 4 >> 2];
        return ret
    },
    getStr: function() {
        var ret = UTF8ToString(SYSCALLS.get());
        return ret
    },
    getStreamFromFD: function() {
        var stream = FS.getStream(SYSCALLS.get());
        if (!stream) throw new FS.ErrnoError(9);
        return stream
    },
    get64: function() {
        var low = SYSCALLS.get(),
            high = SYSCALLS.get();
        return low
    },
    getZero: function() {
        SYSCALLS.get()
    }
};
function ___syscall140(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            offset_high = SYSCALLS.get(),
            offset_low = SYSCALLS.get(),
            result = SYSCALLS.get(),
            whence = SYSCALLS.get();
        var HIGH_OFFSET = 4294967296;
        var offset = offset_high * HIGH_OFFSET + (offset_low >>> 0);
        var DOUBLE_LIMIT = 9007199254740992;
        if (offset <= -DOUBLE_LIMIT || offset >= DOUBLE_LIMIT) {
            return - 75
        }
        FS.llseek(stream, offset, whence);
        tempI64 = [stream.position >>> 0, (tempDouble = stream.position, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min( + Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~ + Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
            HEAP32[result >> 2] = tempI64[0],
            HEAP32[result + 4 >> 2] = tempI64[1];
        if (stream.getdents && offset === 0 && whence === 0) stream.getdents = null;
        return 0
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function ___syscall145(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            iov = SYSCALLS.get(),
            iovcnt = SYSCALLS.get();
        return SYSCALLS.doReadv(stream, iov, iovcnt)
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function ___syscall195(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var path = SYSCALLS.getStr(),
            buf = SYSCALLS.get();
        return SYSCALLS.doStat(FS.stat, path, buf)
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
var PROCINFO = {
    ppid: 1,
    pid: 42,
    sid: 42,
    pgid: 42
};
function ___syscall20(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        return PROCINFO.pid
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function ___syscall221(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            cmd = SYSCALLS.get();
        switch (cmd) {
            case 0:
            {
                var arg = SYSCALLS.get();
                if (arg < 0) {
                    return - 22
                }
                var newStream;
                newStream = FS.open(stream.path, stream.flags, 0, arg);
                return newStream.fd
            }
            case 1:
            case 2:
                return 0;
            case 3:
                return stream.flags;
            case 4:
            {
                var arg = SYSCALLS.get();
                stream.flags |= arg;
                return 0
            }
            case 12:
            {
                var arg = SYSCALLS.get();
                var offset = 0;
                HEAP16[arg + offset >> 1] = 2;
                return 0
            }
            case 13:
            case 14:
                return 0;
            case 16:
            case 8:
                return - 22;
            case 9:
                ___setErrNo(22);
                return - 1;
            default:
            {
                return - 22
            }
        }
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function ___syscall33(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var path = SYSCALLS.getStr(),
            amode = SYSCALLS.get();
        return SYSCALLS.doAccess(path, amode)
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function ___syscall5(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var pathname = SYSCALLS.getStr(),
            flags = SYSCALLS.get(),
            mode = SYSCALLS.get();
        var stream = FS.open(pathname, flags, mode);
        return stream.fd
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function ___syscall54(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD(),
            op = SYSCALLS.get();
        switch (op) {
            case 21509:
            case 21505:
            {
                if (!stream.tty) return - 25;
                return 0
            }
            case 21510:
            case 21511:
            case 21512:
            case 21506:
            case 21507:
            case 21508:
            {
                if (!stream.tty) return - 25;
                return 0
            }
            case 21519:
            {
                if (!stream.tty) return - 25;
                var argp = SYSCALLS.get();
                HEAP32[argp >> 2] = 0;
                return 0
            }
            case 21520:
            {
                if (!stream.tty) return - 25;
                return - 22
            }
            case 21531:
            {
                var argp = SYSCALLS.get();
                return FS.ioctl(stream, op, argp)
            }
            case 21523:
            {
                if (!stream.tty) return - 25;
                return 0
            }
            case 21524:
            {
                if (!stream.tty) return - 25;
                return 0
            }
            default:
                abort("bad ioctl syscall " + op)
        }
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function ___syscall6(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var stream = SYSCALLS.getStreamFromFD();
        FS.close(stream);
        return 0
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function __emscripten_syscall_munmap(addr, len) {
    if (addr === -1 || len === 0) {
        return - 22
    }
    var info = SYSCALLS.mappings[addr];
    if (!info) return 0;
    if (len === info.len) {
        var stream = FS.getStream(info.fd);
        SYSCALLS.doMsync(addr, stream, len, info.flags);
        FS.munmap(stream);
        SYSCALLS.mappings[addr] = null;
        if (info.allocated) {
            _free(info.malloc)
        }
    }
    return 0
}
function ___syscall91(which, varargs) {
    SYSCALLS.varargs = varargs;
    try {
        var addr = SYSCALLS.get(),
            len = SYSCALLS.get();
        return __emscripten_syscall_munmap(addr, len)
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function ___unlock() {}
var char_0 = 48;
var char_9 = 57;
function makeLegalFunctionName(name) {
    if (undefined === name) {
        return "_unknown"
    }
    name = name.replace(/[^a-zA-Z0-9_]/g, "$");
    var f = name.charCodeAt(0);
    if (f >= char_0 && f <= char_9) {
        return "_" + name
    } else {
        return name
    }
}
function createNamedFunction(name, body) {
    name = makeLegalFunctionName(name);
    return new Function("body", "return function " + name + "() {\n" + '    "use strict";' + "    return body.apply(this, arguments);\n" + "};\n")(body)
}
var emval_free_list = [];
var emval_handle_array = [{},
    {
        value: undefined
    },
    {
        value: null
    },
    {
        value: true
    },
    {
        value: false
    }];
function count_emval_handles() {
    var count = 0;
    for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {++count
        }
    }
    return count
}
function get_first_emval() {
    for (var i = 5; i < emval_handle_array.length; ++i) {
        if (emval_handle_array[i] !== undefined) {
            return emval_handle_array[i]
        }
    }
    return null
}
function init_emval() {
    Module["count_emval_handles"] = count_emval_handles;
    Module["get_first_emval"] = get_first_emval
}
function __emval_register(value) {
    switch (value) {
        case undefined:
        {
            return 1
        }
        case null:
        {
            return 2
        }
        case true:
        {
            return 3
        }
        case false:
        {
            return 4
        }
        default:
        {
            var handle = emval_free_list.length ? emval_free_list.pop() : emval_handle_array.length;
            emval_handle_array[handle] = {
                refcount: 1,
                value: value
            };
            return handle
        }
    }
}
function extendError(baseErrorType, errorName) {
    var errorClass = createNamedFunction(errorName,
        function(message) {
            this.name = errorName;
            this.message = message;
            var stack = new Error(message).stack;
            if (stack !== undefined) {
                this.stack = this.toString() + "\n" + stack.replace(/^Error(:[^\n]*)?\n/, "")
            }
        });
    errorClass.prototype = Object.create(baseErrorType.prototype);
    errorClass.prototype.constructor = errorClass;
    errorClass.prototype.toString = function() {
        if (this.message === undefined) {
            return this.name
        } else {
            return this.name + ": " + this.message
        }
    };
    return errorClass
}
var PureVirtualError = undefined;
function embind_init_charCodes() {
    var codes = new Array(256);
    for (var i = 0; i < 256; ++i) {
        codes[i] = String.fromCharCode(i)
    }
    embind_charCodes = codes
}
var embind_charCodes = undefined;
function readLatin1String(ptr) {
    var ret = "";
    var c = ptr;
    while (HEAPU8[c]) {
        ret += embind_charCodes[HEAPU8[c++]]
    }
    return ret
}
function getInheritedInstanceCount() {
    return Object.keys(registeredInstances).length
}
function getLiveInheritedInstances() {
    var rv = [];
    for (var k in registeredInstances) {
        if (registeredInstances.hasOwnProperty(k)) {
            rv.push(registeredInstances[k])
        }
    }
    return rv
}
var deletionQueue = [];
function flushPendingDeletes() {
    while (deletionQueue.length) {
        var obj = deletionQueue.pop();
        obj.$$.deleteScheduled = false;
        obj["delete"]()
    }
}
var delayFunction = undefined;
function setDelayFunction(fn) {
    delayFunction = fn;
    if (deletionQueue.length && delayFunction) {
        delayFunction(flushPendingDeletes)
    }
}
function init_embind() {
    Module["getInheritedInstanceCount"] = getInheritedInstanceCount;
    Module["getLiveInheritedInstances"] = getLiveInheritedInstances;
    Module["flushPendingDeletes"] = flushPendingDeletes;
    Module["setDelayFunction"] = setDelayFunction
}
var registeredInstances = {};
var BindingError = undefined;
function throwBindingError(message) {
    throw new BindingError(message)
}
function getBasestPointer(class_, ptr) {
    if (ptr === undefined) {
        throwBindingError("ptr should not be undefined")
    }
    while (class_.baseClass) {
        ptr = class_.upcast(ptr);
        class_ = class_.baseClass
    }
    return ptr
}
function registerInheritedInstance(class_, ptr, instance) {
    ptr = getBasestPointer(class_, ptr);
    if (registeredInstances.hasOwnProperty(ptr)) {
        throwBindingError("Tried to register registered instance: " + ptr)
    } else {
        registeredInstances[ptr] = instance
    }
}
function requireHandle(handle) {
    if (!handle) {
        throwBindingError("Cannot use deleted val. handle = " + handle)
    }
    return emval_handle_array[handle].value
}
var registeredTypes = {};
function getTypeName(type) {
    var ptr = ___getTypeName(type);
    var rv = readLatin1String(ptr);
    _free(ptr);
    return rv
}
function requireRegisteredType(rawType, humanName) {
    var impl = registeredTypes[rawType];
    if (undefined === impl) {
        throwBindingError(humanName + " has unknown type " + getTypeName(rawType))
    }
    return impl
}
function unregisterInheritedInstance(class_, ptr) {
    ptr = getBasestPointer(class_, ptr);
    if (registeredInstances.hasOwnProperty(ptr)) {
        delete registeredInstances[ptr]
    } else {
        throwBindingError("Tried to unregister unregistered instance: " + ptr)
    }
}
function detachFinalizer(handle) {}
var finalizationGroup = false;
function runDestructor($$) {
    if ($$.smartPtr) {
        $$.smartPtrType.rawDestructor($$.smartPtr)
    } else {
        $$.ptrType.registeredClass.rawDestructor($$.ptr)
    }
}
function releaseClassHandle($$) {
    $$.count.value -= 1;
    var toDelete = 0 === $$.count.value;
    if (toDelete) {
        runDestructor($$)
    }
}
function attachFinalizer(handle) {
    if ("undefined" === typeof FinalizationGroup) {
        attachFinalizer = function(handle) {
            return handle
        };
        return handle
    }
    finalizationGroup = new FinalizationGroup(function(iter) {
        for (var result = iter.next(); ! result.done; result = iter.next()) {
            var $$ = result.value;
            if (!$$.ptr) {
                console.warn("object already deleted: " + $$.ptr)
            } else {
                releaseClassHandle($$)
            }
        }
    });
    attachFinalizer = function(handle) {
        finalizationGroup.register(handle, handle.$$, handle.$$);
        return handle
    };
    detachFinalizer = function(handle) {
        finalizationGroup.unregister(handle.$$)
    };
    return attachFinalizer(handle)
}
function __embind_create_inheriting_constructor(constructorName, wrapperType, properties) {
    constructorName = readLatin1String(constructorName);
    wrapperType = requireRegisteredType(wrapperType, "wrapper");
    properties = requireHandle(properties);
    var arraySlice = [].slice;
    var registeredClass = wrapperType.registeredClass;
    var wrapperPrototype = registeredClass.instancePrototype;
    var baseClass = registeredClass.baseClass;
    var baseClassPrototype = baseClass.instancePrototype;
    var baseConstructor = registeredClass.baseClass.constructor;
    var ctor = createNamedFunction(constructorName,
        function() {
            registeredClass.baseClass.pureVirtualFunctions.forEach(function(name) {
                if (this[name] === baseClassPrototype[name]) {
                    throw new PureVirtualError("Pure virtual function " + name + " must be implemented in JavaScript")
                }
            }.bind(this));
            Object.defineProperty(this, "__parent", {
                value: wrapperPrototype
            });
            this["__construct"].apply(this, arraySlice.call(arguments))
        });
    wrapperPrototype["__construct"] = function __construct() {
        if (this === wrapperPrototype) {
            throwBindingError("Pass correct 'this' to __construct")
        }
        var inner = baseConstructor["implement"].apply(undefined, [this].concat(arraySlice.call(arguments)));
        detachFinalizer(inner);
        var $$ = inner.$$;
        inner["notifyOnDestruction"]();
        $$.preservePointerOnDelete = true;
        Object.defineProperties(this, {
            $$: {
                value: $$
            }
        });
        attachFinalizer(this);
        registerInheritedInstance(registeredClass, $$.ptr, this)
    };
    wrapperPrototype["__destruct"] = function __destruct() {
        if (this === wrapperPrototype) {
            throwBindingError("Pass correct 'this' to __destruct")
        }
        detachFinalizer(this);
        unregisterInheritedInstance(registeredClass, this.$$.ptr)
    };
    ctor.prototype = Object.create(wrapperPrototype);
    for (var p in properties) {
        ctor.prototype[p] = properties[p]
    }
    return __emval_register(ctor)
}
var tupleRegistrations = {};
function runDestructors(destructors) {
    while (destructors.length) {
        var ptr = destructors.pop();
        var del = destructors.pop();
        del(ptr)
    }
}
function simpleReadValueFromPointer(pointer) {
    return this["fromWireType"](HEAPU32[pointer >> 2])
}
var awaitingDependencies = {};
var typeDependencies = {};
var InternalError = undefined;
function throwInternalError(message) {
    throw new InternalError(message)
}
function whenDependentTypesAreResolved(myTypes, dependentTypes, getTypeConverters) {
    myTypes.forEach(function(type) {
        typeDependencies[type] = dependentTypes
    });
    function onComplete(typeConverters) {
        var myTypeConverters = getTypeConverters(typeConverters);
        if (myTypeConverters.length !== myTypes.length) {
            throwInternalError("Mismatched type converter count")
        }
        for (var i = 0; i < myTypes.length; ++i) {
            registerType(myTypes[i], myTypeConverters[i])
        }
    }
    var typeConverters = new Array(dependentTypes.length);
    var unregisteredTypes = [];
    var registered = 0;
    dependentTypes.forEach(function(dt, i) {
        if (registeredTypes.hasOwnProperty(dt)) {
            typeConverters[i] = registeredTypes[dt]
        } else {
            unregisteredTypes.push(dt);
            if (!awaitingDependencies.hasOwnProperty(dt)) {
                awaitingDependencies[dt] = []
            }
            awaitingDependencies[dt].push(function() {
                typeConverters[i] = registeredTypes[dt]; ++registered;
                if (registered === unregisteredTypes.length) {
                    onComplete(typeConverters)
                }
            })
        }
    });
    if (0 === unregisteredTypes.length) {
        onComplete(typeConverters)
    }
}
function __embind_finalize_value_array(rawTupleType) {
    var reg = tupleRegistrations[rawTupleType];
    delete tupleRegistrations[rawTupleType];
    var elements = reg.elements;
    var elementsLength = elements.length;
    var elementTypes = elements.map(function(elt) {
        return elt.getterReturnType
    }).concat(elements.map(function(elt) {
        return elt.setterArgumentType
    }));
    var rawConstructor = reg.rawConstructor;
    var rawDestructor = reg.rawDestructor;
    whenDependentTypesAreResolved([rawTupleType], elementTypes,
        function(elementTypes) {
            elements.forEach(function(elt, i) {
                var getterReturnType = elementTypes[i];
                var getter = elt.getter;
                var getterContext = elt.getterContext;
                var setterArgumentType = elementTypes[i + elementsLength];
                var setter = elt.setter;
                var setterContext = elt.setterContext;
                elt.read = function(ptr) {
                    return getterReturnType["fromWireType"](getter(getterContext, ptr))
                };
                elt.write = function(ptr, o) {
                    var destructors = [];
                    setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
                    runDestructors(destructors)
                }
            });
            return [{
                name: reg.name,
                "fromWireType": function(ptr) {
                    var rv = new Array(elementsLength);
                    for (var i = 0; i < elementsLength; ++i) {
                        rv[i] = elements[i].read(ptr)
                    }
                    rawDestructor(ptr);
                    return rv
                },
                "toWireType": function(destructors, o) {
                    if (elementsLength !== o.length) {
                        throw new TypeError("Incorrect number of tuple elements for " + reg.name + ": expected=" + elementsLength + ", actual=" + o.length)
                    }
                    var ptr = rawConstructor();
                    for (var i = 0; i < elementsLength; ++i) {
                        elements[i].write(ptr, o[i])
                    }
                    if (destructors !== null) {
                        destructors.push(rawDestructor, ptr)
                    }
                    return ptr
                },
                "argPackAdvance": 8,
                "readValueFromPointer": simpleReadValueFromPointer,
                destructorFunction: rawDestructor
            }]
        })
}
var structRegistrations = {};
function __embind_finalize_value_object(structType) {
    var reg = structRegistrations[structType];
    delete structRegistrations[structType];
    var rawConstructor = reg.rawConstructor;
    var rawDestructor = reg.rawDestructor;
    var fieldRecords = reg.fields;
    var fieldTypes = fieldRecords.map(function(field) {
        return field.getterReturnType
    }).concat(fieldRecords.map(function(field) {
        return field.setterArgumentType
    }));
    whenDependentTypesAreResolved([structType], fieldTypes,
        function(fieldTypes) {
            var fields = {};
            fieldRecords.forEach(function(field, i) {
                var fieldName = field.fieldName;
                var getterReturnType = fieldTypes[i];
                var getter = field.getter;
                var getterContext = field.getterContext;
                var setterArgumentType = fieldTypes[i + fieldRecords.length];
                var setter = field.setter;
                var setterContext = field.setterContext;
                fields[fieldName] = {
                    read: function(ptr) {
                        return getterReturnType["fromWireType"](getter(getterContext, ptr))
                    },
                    write: function(ptr, o) {
                        var destructors = [];
                        setter(setterContext, ptr, setterArgumentType["toWireType"](destructors, o));
                        runDestructors(destructors)
                    }
                }
            });
            return [{
                name: reg.name,
                "fromWireType": function(ptr) {
                    var rv = {};
                    for (var i in fields) {
                        rv[i] = fields[i].read(ptr)
                    }
                    rawDestructor(ptr);
                    return rv
                },
                "toWireType": function(destructors, o) {
                    for (var fieldName in fields) {
                        if (! (fieldName in o)) {
                            throw new TypeError("Missing field")
                        }
                    }
                    var ptr = rawConstructor();
                    for (fieldName in fields) {
                        fields[fieldName].write(ptr, o[fieldName])
                    }
                    if (destructors !== null) {
                        destructors.push(rawDestructor, ptr)
                    }
                    return ptr
                },
                "argPackAdvance": 8,
                "readValueFromPointer": simpleReadValueFromPointer,
                destructorFunction: rawDestructor
            }]
        })
}
function getShiftFromSize(size) {
    switch (size) {
        case 1:
            return 0;
        case 2:
            return 1;
        case 4:
            return 2;
        case 8:
            return 3;
        default:
            throw new TypeError("Unknown type size: " + size)
    }
}
function registerType(rawType, registeredInstance, options) {
    options = options || {};
    if (! ("argPackAdvance" in registeredInstance)) {
        throw new TypeError("registerType registeredInstance requires argPackAdvance")
    }
    var name = registeredInstance.name;
    if (!rawType) {
        throwBindingError('type "' + name + '" must have a positive integer typeid pointer')
    }
    if (registeredTypes.hasOwnProperty(rawType)) {
        if (options.ignoreDuplicateRegistrations) {
            return
        } else {
            throwBindingError("Cannot register type '" + name + "' twice")
        }
    }
    registeredTypes[rawType] = registeredInstance;
    delete typeDependencies[rawType];
    if (awaitingDependencies.hasOwnProperty(rawType)) {
        var callbacks = awaitingDependencies[rawType];
        delete awaitingDependencies[rawType];
        callbacks.forEach(function(cb) {
            cb()
        })
    }
}
function __embind_register_bool(rawType, name, size, trueValue, falseValue) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": function(wt) {
            return !! wt
        },
        "toWireType": function(destructors, o) {
            return o ? trueValue: falseValue
        },
        "argPackAdvance": 8,
        "readValueFromPointer": function(pointer) {
            var heap;
            if (size === 1) {
                heap = HEAP8
            } else if (size === 2) {
                heap = HEAP16
            } else if (size === 4) {
                heap = HEAP32
            } else {
                throw new TypeError("Unknown boolean type size: " + name)
            }
            return this["fromWireType"](heap[pointer >> shift])
        },
        destructorFunction: null
    })
}
function ClassHandle_isAliasOf(other) {
    if (! (this instanceof ClassHandle)) {
        return false
    }
    if (! (other instanceof ClassHandle)) {
        return false
    }
    var leftClass = this.$$.ptrType.registeredClass;
    var left = this.$$.ptr;
    var rightClass = other.$$.ptrType.registeredClass;
    var right = other.$$.ptr;
    while (leftClass.baseClass) {
        left = leftClass.upcast(left);
        leftClass = leftClass.baseClass
    }
    while (rightClass.baseClass) {
        right = rightClass.upcast(right);
        rightClass = rightClass.baseClass
    }
    return leftClass === rightClass && left === right
}
function shallowCopyInternalPointer(o) {
    return {
        count: o.count,
        deleteScheduled: o.deleteScheduled,
        preservePointerOnDelete: o.preservePointerOnDelete,
        ptr: o.ptr,
        ptrType: o.ptrType,
        smartPtr: o.smartPtr,
        smartPtrType: o.smartPtrType
    }
}
function throwInstanceAlreadyDeleted(obj) {
    function getInstanceTypeName(handle) {
        return handle.$$.ptrType.registeredClass.name
    }
    throwBindingError(getInstanceTypeName(obj) + " instance already deleted")
}
function ClassHandle_clone() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this)
    }
    if (this.$$.preservePointerOnDelete) {
        this.$$.count.value += 1;
        return this
    } else {
        var clone = attachFinalizer(Object.create(Object.getPrototypeOf(this), {
            $$: {
                value: shallowCopyInternalPointer(this.$$)
            }
        }));
        clone.$$.count.value += 1;
        clone.$$.deleteScheduled = false;
        return clone
    }
}
function ClassHandle_delete() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this)
    }
    if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError("Object already scheduled for deletion")
    }
    detachFinalizer(this);
    releaseClassHandle(this.$$);
    if (!this.$$.preservePointerOnDelete) {
        this.$$.smartPtr = undefined;
        this.$$.ptr = undefined
    }
}
function ClassHandle_isDeleted() {
    return ! this.$$.ptr
}
function ClassHandle_deleteLater() {
    if (!this.$$.ptr) {
        throwInstanceAlreadyDeleted(this)
    }
    if (this.$$.deleteScheduled && !this.$$.preservePointerOnDelete) {
        throwBindingError("Object already scheduled for deletion")
    }
    deletionQueue.push(this);
    if (deletionQueue.length === 1 && delayFunction) {
        delayFunction(flushPendingDeletes)
    }
    this.$$.deleteScheduled = true;
    return this
}
function init_ClassHandle() {
    ClassHandle.prototype["isAliasOf"] = ClassHandle_isAliasOf;
    ClassHandle.prototype["clone"] = ClassHandle_clone;
    ClassHandle.prototype["delete"] = ClassHandle_delete;
    ClassHandle.prototype["isDeleted"] = ClassHandle_isDeleted;
    ClassHandle.prototype["deleteLater"] = ClassHandle_deleteLater
}
function ClassHandle() {}
var registeredPointers = {};
function ensureOverloadTable(proto, methodName, humanName) {
    if (undefined === proto[methodName].overloadTable) {
        var prevFunc = proto[methodName];
        proto[methodName] = function() {
            if (!proto[methodName].overloadTable.hasOwnProperty(arguments.length)) {
                throwBindingError("Function '" + humanName + "' called with an invalid number of arguments (" + arguments.length + ") - expects one of (" + proto[methodName].overloadTable + ")!")
            }
            return proto[methodName].overloadTable[arguments.length].apply(this, arguments)
        };
        proto[methodName].overloadTable = [];
        proto[methodName].overloadTable[prevFunc.argCount] = prevFunc
    }
}
function exposePublicSymbol(name, value, numArguments) {
    if (Module.hasOwnProperty(name)) {
        if (undefined === numArguments || undefined !== Module[name].overloadTable && undefined !== Module[name].overloadTable[numArguments]) {
            throwBindingError("Cannot register public name '" + name + "' twice")
        }
        ensureOverloadTable(Module, name, name);
        if (Module.hasOwnProperty(numArguments)) {
            throwBindingError("Cannot register multiple overloads of a function with the same number of arguments (" + numArguments + ")!")
        }
        Module[name].overloadTable[numArguments] = value
    } else {
        Module[name] = value;
        if (undefined !== numArguments) {
            Module[name].numArguments = numArguments
        }
    }
}
function RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast) {
    this.name = name;
    this.constructor = constructor;
    this.instancePrototype = instancePrototype;
    this.rawDestructor = rawDestructor;
    this.baseClass = baseClass;
    this.getActualType = getActualType;
    this.upcast = upcast;
    this.downcast = downcast;
    this.pureVirtualFunctions = []
}
function upcastPointer(ptr, ptrClass, desiredClass) {
    while (ptrClass !== desiredClass) {
        if (!ptrClass.upcast) {
            throwBindingError("Expected null or instance of " + desiredClass.name + ", got an instance of " + ptrClass.name)
        }
        ptr = ptrClass.upcast(ptr);
        ptrClass = ptrClass.baseClass
    }
    return ptr
}
function constNoSmartPtrRawPointerToWireType(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError("null is not a valid " + this.name)
        }
        return 0
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
    }
    if (!handle.$$.ptr) {
        throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr
}
function genericPointerToWireType(destructors, handle) {
    var ptr;
    if (handle === null) {
        if (this.isReference) {
            throwBindingError("null is not a valid " + this.name)
        }
        if (this.isSmartPointer) {
            ptr = this.rawConstructor();
            if (destructors !== null) {
                destructors.push(this.rawDestructor, ptr)
            }
            return ptr
        } else {
            return 0
        }
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
    }
    if (!handle.$$.ptr) {
        throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
    }
    if (!this.isConst && handle.$$.ptrType.isConst) {
        throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name: handle.$$.ptrType.name) + " to parameter type " + this.name)
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    if (this.isSmartPointer) {
        if (undefined === handle.$$.smartPtr) {
            throwBindingError("Passing raw pointer to smart pointer is illegal")
        }
        switch (this.sharingPolicy) {
            case 0:
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr
                } else {
                    throwBindingError("Cannot convert argument of type " + (handle.$$.smartPtrType ? handle.$$.smartPtrType.name: handle.$$.ptrType.name) + " to parameter type " + this.name)
                }
                break;
            case 1:
                ptr = handle.$$.smartPtr;
                break;
            case 2:
                if (handle.$$.smartPtrType === this) {
                    ptr = handle.$$.smartPtr
                } else {
                    var clonedHandle = handle["clone"]();
                    ptr = this.rawShare(ptr, __emval_register(function() {
                        clonedHandle["delete"]()
                    }));
                    if (destructors !== null) {
                        destructors.push(this.rawDestructor, ptr)
                    }
                }
                break;
            default:
                throwBindingError("Unsupporting sharing policy")
        }
    }
    return ptr
}
function nonConstNoSmartPtrRawPointerToWireType(destructors, handle) {
    if (handle === null) {
        if (this.isReference) {
            throwBindingError("null is not a valid " + this.name)
        }
        return 0
    }
    if (!handle.$$) {
        throwBindingError('Cannot pass "' + _embind_repr(handle) + '" as a ' + this.name)
    }
    if (!handle.$$.ptr) {
        throwBindingError("Cannot pass deleted object as a pointer of type " + this.name)
    }
    if (handle.$$.ptrType.isConst) {
        throwBindingError("Cannot convert argument of type " + handle.$$.ptrType.name + " to parameter type " + this.name)
    }
    var handleClass = handle.$$.ptrType.registeredClass;
    var ptr = upcastPointer(handle.$$.ptr, handleClass, this.registeredClass);
    return ptr
}
function RegisteredPointer_getPointee(ptr) {
    if (this.rawGetPointee) {
        ptr = this.rawGetPointee(ptr)
    }
    return ptr
}
function RegisteredPointer_destructor(ptr) {
    if (this.rawDestructor) {
        this.rawDestructor(ptr)
    }
}
function RegisteredPointer_deleteObject(handle) {
    if (handle !== null) {
        handle["delete"]()
    }
}
function downcastPointer(ptr, ptrClass, desiredClass) {
    if (ptrClass === desiredClass) {
        return ptr
    }
    if (undefined === desiredClass.baseClass) {
        return null
    }
    var rv = downcastPointer(ptr, ptrClass, desiredClass.baseClass);
    if (rv === null) {
        return null
    }
    return desiredClass.downcast(rv)
}
function getInheritedInstance(class_, ptr) {
    ptr = getBasestPointer(class_, ptr);
    return registeredInstances[ptr]
}
function makeClassHandle(prototype, record) {
    if (!record.ptrType || !record.ptr) {
        throwInternalError("makeClassHandle requires ptr and ptrType")
    }
    var hasSmartPtrType = !!record.smartPtrType;
    var hasSmartPtr = !!record.smartPtr;
    if (hasSmartPtrType !== hasSmartPtr) {
        throwInternalError("Both smartPtrType and smartPtr must be specified")
    }
    record.count = {
        value: 1
    };
    return attachFinalizer(Object.create(prototype, {
        $$: {
            value: record
        }
    }))
}
function RegisteredPointer_fromWireType(ptr) {
    var rawPointer = this.getPointee(ptr);
    if (!rawPointer) {
        this.destructor(ptr);
        return null
    }
    var registeredInstance = getInheritedInstance(this.registeredClass, rawPointer);
    if (undefined !== registeredInstance) {
        if (0 === registeredInstance.$$.count.value) {
            registeredInstance.$$.ptr = rawPointer;
            registeredInstance.$$.smartPtr = ptr;
            return registeredInstance["clone"]()
        } else {
            var rv = registeredInstance["clone"]();
            this.destructor(ptr);
            return rv
        }
    }
    function makeDefaultHandle() {
        if (this.isSmartPointer) {
            return makeClassHandle(this.registeredClass.instancePrototype, {
                ptrType: this.pointeeType,
                ptr: rawPointer,
                smartPtrType: this,
                smartPtr: ptr
            })
        } else {
            return makeClassHandle(this.registeredClass.instancePrototype, {
                ptrType: this,
                ptr: ptr
            })
        }
    }
    var actualType = this.registeredClass.getActualType(rawPointer);
    var registeredPointerRecord = registeredPointers[actualType];
    if (!registeredPointerRecord) {
        return makeDefaultHandle.call(this)
    }
    var toType;
    if (this.isConst) {
        toType = registeredPointerRecord.constPointerType
    } else {
        toType = registeredPointerRecord.pointerType
    }
    var dp = downcastPointer(rawPointer, this.registeredClass, toType.registeredClass);
    if (dp === null) {
        return makeDefaultHandle.call(this)
    }
    if (this.isSmartPointer) {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
            ptrType: toType,
            ptr: dp,
            smartPtrType: this,
            smartPtr: ptr
        })
    } else {
        return makeClassHandle(toType.registeredClass.instancePrototype, {
            ptrType: toType,
            ptr: dp
        })
    }
}
function init_RegisteredPointer() {
    RegisteredPointer.prototype.getPointee = RegisteredPointer_getPointee;
    RegisteredPointer.prototype.destructor = RegisteredPointer_destructor;
    RegisteredPointer.prototype["argPackAdvance"] = 8;
    RegisteredPointer.prototype["readValueFromPointer"] = simpleReadValueFromPointer;
    RegisteredPointer.prototype["deleteObject"] = RegisteredPointer_deleteObject;
    RegisteredPointer.prototype["fromWireType"] = RegisteredPointer_fromWireType
}
function RegisteredPointer(name, registeredClass, isReference, isConst, isSmartPointer, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor) {
    this.name = name;
    this.registeredClass = registeredClass;
    this.isReference = isReference;
    this.isConst = isConst;
    this.isSmartPointer = isSmartPointer;
    this.pointeeType = pointeeType;
    this.sharingPolicy = sharingPolicy;
    this.rawGetPointee = rawGetPointee;
    this.rawConstructor = rawConstructor;
    this.rawShare = rawShare;
    this.rawDestructor = rawDestructor;
    if (!isSmartPointer && registeredClass.baseClass === undefined) {
        if (isConst) {
            this["toWireType"] = constNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null
        } else {
            this["toWireType"] = nonConstNoSmartPtrRawPointerToWireType;
            this.destructorFunction = null
        }
    } else {
        this["toWireType"] = genericPointerToWireType
    }
}
function replacePublicSymbol(name, value, numArguments) {
    if (!Module.hasOwnProperty(name)) {
        throwInternalError("Replacing nonexistant public symbol")
    }
    if (undefined !== Module[name].overloadTable && undefined !== numArguments) {
        Module[name].overloadTable[numArguments] = value
    } else {
        Module[name] = value;
        Module[name].argCount = numArguments
    }
}
function embind__requireFunction(signature, rawFunction) {
    signature = readLatin1String(signature);
    function makeDynCaller(dynCall) {
        var args = [];
        for (var i = 1; i < signature.length; ++i) {
            args.push("a" + i)
        }
        var name = "dynCall_" + signature + "_" + rawFunction;
        var body = "return function " + name + "(" + args.join(", ") + ") {\n";
        body += "    return dynCall(rawFunction" + (args.length ? ", ": "") + args.join(", ") + ");\n";
        body += "};\n";
        return new Function("dynCall", "rawFunction", body)(dynCall, rawFunction)
    }
    var fp;
    if (Module["FUNCTION_TABLE_" + signature] !== undefined) {
        fp = Module["FUNCTION_TABLE_" + signature][rawFunction]
    } else if (typeof FUNCTION_TABLE !== "undefined") {
        fp = FUNCTION_TABLE[rawFunction]
    } else {
        var dc = Module["dynCall_" + signature];
        if (dc === undefined) {
            dc = Module["dynCall_" + signature.replace(/f/g, "d")];
            if (dc === undefined) {
                throwBindingError("No dynCall invoker for signature: " + signature)
            }
        }
        fp = makeDynCaller(dc)
    }
    if (typeof fp !== "function") {
        throwBindingError("unknown function pointer with signature " + signature + ": " + rawFunction)
    }
    return fp
}
var UnboundTypeError = undefined;
function throwUnboundTypeError(message, types) {
    var unboundTypes = [];
    var seen = {};
    function visit(type) {
        if (seen[type]) {
            return
        }
        if (registeredTypes[type]) {
            return
        }
        if (typeDependencies[type]) {
            typeDependencies[type].forEach(visit);
            return
        }
        unboundTypes.push(type);
        seen[type] = true
    }
    types.forEach(visit);
    throw new UnboundTypeError(message + ": " + unboundTypes.map(getTypeName).join([", "]))
}
function __embind_register_class(rawType, rawPointerType, rawConstPointerType, baseClassRawType, getActualTypeSignature, getActualType, upcastSignature, upcast, downcastSignature, downcast, name, destructorSignature, rawDestructor) {
    name = readLatin1String(name);
    getActualType = embind__requireFunction(getActualTypeSignature, getActualType);
    if (upcast) {
        upcast = embind__requireFunction(upcastSignature, upcast)
    }
    if (downcast) {
        downcast = embind__requireFunction(downcastSignature, downcast)
    }
    rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
    var legalFunctionName = makeLegalFunctionName(name);
    exposePublicSymbol(legalFunctionName,
        function() {
            throwUnboundTypeError("Cannot construct " + name + " due to unbound types", [baseClassRawType])
        });
    whenDependentTypesAreResolved([rawType, rawPointerType, rawConstPointerType], baseClassRawType ? [baseClassRawType] : [],
        function(base) {
            base = base[0];
            var baseClass;
            var basePrototype;
            if (baseClassRawType) {
                baseClass = base.registeredClass;
                basePrototype = baseClass.instancePrototype
            } else {
                basePrototype = ClassHandle.prototype
            }
            var constructor = createNamedFunction(legalFunctionName,
                function() {
                    if (Object.getPrototypeOf(this) !== instancePrototype) {
                        throw new BindingError("Use 'new' to construct " + name)
                    }
                    if (undefined === registeredClass.constructor_body) {
                        throw new BindingError(name + " has no accessible constructor")
                    }
                    var body = registeredClass.constructor_body[arguments.length];
                    if (undefined === body) {
                        throw new BindingError("Tried to invoke ctor of " + name + " with invalid number of parameters (" + arguments.length + ") - expected (" + Object.keys(registeredClass.constructor_body).toString() + ") parameters instead!")
                    }
                    return body.apply(this, arguments)
                });
            var instancePrototype = Object.create(basePrototype, {
                constructor: {
                    value: constructor
                }
            });
            constructor.prototype = instancePrototype;
            var registeredClass = new RegisteredClass(name, constructor, instancePrototype, rawDestructor, baseClass, getActualType, upcast, downcast);
            var referenceConverter = new RegisteredPointer(name, registeredClass, true, false, false);
            var pointerConverter = new RegisteredPointer(name + "*", registeredClass, false, false, false);
            var constPointerConverter = new RegisteredPointer(name + " const*", registeredClass, false, true, false);
            registeredPointers[rawType] = {
                pointerType: pointerConverter,
                constPointerType: constPointerConverter
            };
            replacePublicSymbol(legalFunctionName, constructor);
            return [referenceConverter, pointerConverter, constPointerConverter]
        })
}
function new_(constructor, argumentList) {
    if (! (constructor instanceof Function)) {
        throw new TypeError("new_ called with constructor type " + typeof constructor + " which is not a function")
    }
    var dummy = createNamedFunction(constructor.name || "unknownFunctionName",
        function() {});
    dummy.prototype = constructor.prototype;
    var obj = new dummy;
    var r = constructor.apply(obj, argumentList);
    return r instanceof Object ? r: obj
}
function craftInvokerFunction(humanName, argTypes, classType, cppInvokerFunc, cppTargetFunc) {
    var argCount = argTypes.length;
    if (argCount < 2) {
        throwBindingError("argTypes array size mismatch! Must at least get return value and 'this' types!")
    }
    var isClassMethodFunc = argTypes[1] !== null && classType !== null;
    var needsDestructorStack = false;
    for (var i = 1; i < argTypes.length; ++i) {
        if (argTypes[i] !== null && argTypes[i].destructorFunction === undefined) {
            needsDestructorStack = true;
            break
        }
    }
    var returns = argTypes[0].name !== "void";
    var argsList = "";
    var argsListWired = "";
    for (var i = 0; i < argCount - 2; ++i) {
        argsList += (i !== 0 ? ", ": "") + "arg" + i;
        argsListWired += (i !== 0 ? ", ": "") + "arg" + i + "Wired"
    }
    var invokerFnBody = "return function " + makeLegalFunctionName(humanName) + "(" + argsList + ") {\n" + "if (arguments.length !== " + (argCount - 2) + ") {\n" + "throwBindingError('function " + humanName + " called with ' + arguments.length + ' arguments, expected " + (argCount - 2) + " args!');\n" + "}\n";
    if (needsDestructorStack) {
        invokerFnBody += "var destructors = [];\n"
    }
    var dtorStack = needsDestructorStack ? "destructors": "null";
    var args1 = ["throwBindingError", "invoker", "fn", "runDestructors", "retType", "classParam"];
    var args2 = [throwBindingError, cppInvokerFunc, cppTargetFunc, runDestructors, argTypes[0], argTypes[1]];
    if (isClassMethodFunc) {
        invokerFnBody += "var thisWired = classParam.toWireType(" + dtorStack + ", this);\n"
    }
    for (var i = 0; i < argCount - 2; ++i) {
        invokerFnBody += "var arg" + i + "Wired = argType" + i + ".toWireType(" + dtorStack + ", arg" + i + "); // " + argTypes[i + 2].name + "\n";
        args1.push("argType" + i);
        args2.push(argTypes[i + 2])
    }
    if (isClassMethodFunc) {
        argsListWired = "thisWired" + (argsListWired.length > 0 ? ", ": "") + argsListWired
    }
    invokerFnBody += (returns ? "var rv = ": "") + "invoker(fn" + (argsListWired.length > 0 ? ", ": "") + argsListWired + ");\n";
    if (needsDestructorStack) {
        invokerFnBody += "runDestructors(destructors);\n"
    } else {
        for (var i = isClassMethodFunc ? 1 : 2; i < argTypes.length; ++i) {
            var paramName = i === 1 ? "thisWired": "arg" + (i - 2) + "Wired";
            if (argTypes[i].destructorFunction !== null) {
                invokerFnBody += paramName + "_dtor(" + paramName + "); // " + argTypes[i].name + "\n";
                args1.push(paramName + "_dtor");
                args2.push(argTypes[i].destructorFunction)
            }
        }
    }
    if (returns) {
        invokerFnBody += "var ret = retType.fromWireType(rv);\n" + "return ret;\n"
    } else {}
    invokerFnBody += "}\n";
    args1.push(invokerFnBody);
    var invokerFunction = new_(Function, args1).apply(null, args2);
    return invokerFunction
}
function heap32VectorToArray(count, firstElement) {
    var array = [];
    for (var i = 0; i < count; i++) {
        array.push(HEAP32[(firstElement >> 2) + i])
    }
    return array
}
function __embind_register_class_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, fn) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
    whenDependentTypesAreResolved([], [rawClassType],
        function(classType) {
            classType = classType[0];
            var humanName = classType.name + "." + methodName;
            function unboundTypesHandler() {
                throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
            }
            var proto = classType.registeredClass.constructor;
            if (undefined === proto[methodName]) {
                unboundTypesHandler.argCount = argCount - 1;
                proto[methodName] = unboundTypesHandler
            } else {
                ensureOverloadTable(proto, methodName, humanName);
                proto[methodName].overloadTable[argCount - 1] = unboundTypesHandler
            }
            whenDependentTypesAreResolved([], rawArgTypes,
                function(argTypes) {
                    var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
                    var func = craftInvokerFunction(humanName, invokerArgsArray, null, rawInvoker, fn);
                    if (undefined === proto[methodName].overloadTable) {
                        func.argCount = argCount - 1;
                        proto[methodName] = func
                    } else {
                        proto[methodName].overloadTable[argCount - 1] = func
                    }
                    return []
                });
            return []
        })
}
function __embind_register_class_constructor(rawClassType, argCount, rawArgTypesAddr, invokerSignature, invoker, rawConstructor) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    invoker = embind__requireFunction(invokerSignature, invoker);
    whenDependentTypesAreResolved([], [rawClassType],
        function(classType) {
            classType = classType[0];
            var humanName = "constructor " + classType.name;
            if (undefined === classType.registeredClass.constructor_body) {
                classType.registeredClass.constructor_body = []
            }
            if (undefined !== classType.registeredClass.constructor_body[argCount - 1]) {
                throw new BindingError("Cannot register multiple constructors with identical number of parameters (" + (argCount - 1) + ") for class '" + classType.name + "'! Overload resolution is currently only performed using the parameter count, not actual type info!")
            }
            classType.registeredClass.constructor_body[argCount - 1] = function unboundTypeHandler() {
                throwUnboundTypeError("Cannot construct " + classType.name + " due to unbound types", rawArgTypes)
            };
            whenDependentTypesAreResolved([], rawArgTypes,
                function(argTypes) {
                    classType.registeredClass.constructor_body[argCount - 1] = function constructor_body() {
                        if (arguments.length !== argCount - 1) {
                            throwBindingError(humanName + " called with " + arguments.length + " arguments, expected " + (argCount - 1))
                        }
                        var destructors = [];
                        var args = new Array(argCount);
                        args[0] = rawConstructor;
                        for (var i = 1; i < argCount; ++i) {
                            args[i] = argTypes[i]["toWireType"](destructors, arguments[i - 1])
                        }
                        var ptr = invoker.apply(null, args);
                        runDestructors(destructors);
                        return argTypes[0]["fromWireType"](ptr)
                    };
                    return []
                });
            return []
        })
}
function __embind_register_class_function(rawClassType, methodName, argCount, rawArgTypesAddr, invokerSignature, rawInvoker, context, isPureVirtual) {
    var rawArgTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    methodName = readLatin1String(methodName);
    rawInvoker = embind__requireFunction(invokerSignature, rawInvoker);
    whenDependentTypesAreResolved([], [rawClassType],
        function(classType) {
            classType = classType[0];
            var humanName = classType.name + "." + methodName;
            if (isPureVirtual) {
                classType.registeredClass.pureVirtualFunctions.push(methodName)
            }
            function unboundTypesHandler() {
                throwUnboundTypeError("Cannot call " + humanName + " due to unbound types", rawArgTypes)
            }
            var proto = classType.registeredClass.instancePrototype;
            var method = proto[methodName];
            if (undefined === method || undefined === method.overloadTable && method.className !== classType.name && method.argCount === argCount - 2) {
                unboundTypesHandler.argCount = argCount - 2;
                unboundTypesHandler.className = classType.name;
                proto[methodName] = unboundTypesHandler
            } else {
                ensureOverloadTable(proto, methodName, humanName);
                proto[methodName].overloadTable[argCount - 2] = unboundTypesHandler
            }
            whenDependentTypesAreResolved([], rawArgTypes,
                function(argTypes) {
                    var memberFunction = craftInvokerFunction(humanName, argTypes, classType, rawInvoker, context);
                    if (undefined === proto[methodName].overloadTable) {
                        memberFunction.argCount = argCount - 2;
                        proto[methodName] = memberFunction
                    } else {
                        proto[methodName].overloadTable[argCount - 2] = memberFunction
                    }
                    return []
                });
            return []
        })
}
function __embind_register_constant(name, type, value) {
    name = readLatin1String(name);
    whenDependentTypesAreResolved([], [type],
        function(type) {
            type = type[0];
            Module[name] = type["fromWireType"](value);
            return []
        })
}
function __emval_decref(handle) {
    if (handle > 4 && 0 === --emval_handle_array[handle].refcount) {
        emval_handle_array[handle] = undefined;
        emval_free_list.push(handle)
    }
}
function __embind_register_emval(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": function(handle) {
            var rv = emval_handle_array[handle].value;
            __emval_decref(handle);
            return rv
        },
        "toWireType": function(destructors, value) {
            return __emval_register(value)
        },
        "argPackAdvance": 8,
        "readValueFromPointer": simpleReadValueFromPointer,
        destructorFunction: null
    })
}
function enumReadValueFromPointer(name, shift, signed) {
    switch (shift) {
        case 0:
            return function(pointer) {
                var heap = signed ? HEAP8: HEAPU8;
                return this["fromWireType"](heap[pointer])
            };
        case 1:
            return function(pointer) {
                var heap = signed ? HEAP16: HEAPU16;
                return this["fromWireType"](heap[pointer >> 1])
            };
        case 2:
            return function(pointer) {
                var heap = signed ? HEAP32: HEAPU32;
                return this["fromWireType"](heap[pointer >> 2])
            };
        default:
            throw new TypeError("Unknown integer type: " + name)
    }
}
function __embind_register_enum(rawType, name, size, isSigned) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    function ctor() {}
    ctor.values = {};
    registerType(rawType, {
        name: name,
        constructor: ctor,
        "fromWireType": function(c) {
            return this.constructor.values[c]
        },
        "toWireType": function(destructors, c) {
            return c.value
        },
        "argPackAdvance": 8,
        "readValueFromPointer": enumReadValueFromPointer(name, shift, isSigned),
        destructorFunction: null
    });
    exposePublicSymbol(name, ctor)
}
function __embind_register_enum_value(rawEnumType, name, enumValue) {
    var enumType = requireRegisteredType(rawEnumType, "enum");
    name = readLatin1String(name);
    var Enum = enumType.constructor;
    var Value = Object.create(enumType.constructor.prototype, {
        value: {
            value: enumValue
        },
        constructor: {
            value: createNamedFunction(enumType.name + "_" + name,
                function() {})
        }
    });
    Enum.values[enumValue] = Value;
    Enum[name] = Value
}
function _embind_repr(v) {
    if (v === null) {
        return "null"
    }
    var t = typeof v;
    if (t === "object" || t === "array" || t === "function") {
        return v.toString()
    } else {
        return "" + v
    }
}
function floatReadValueFromPointer(name, shift) {
    switch (shift) {
        case 2:
            return function(pointer) {
                return this["fromWireType"](HEAPF32[pointer >> 2])
            };
        case 3:
            return function(pointer) {
                return this["fromWireType"](HEAPF64[pointer >> 3])
            };
        default:
            throw new TypeError("Unknown float type: " + name)
    }
}
function __embind_register_float(rawType, name, size) {
    var shift = getShiftFromSize(size);
    name = readLatin1String(name);
    registerType(rawType, {
        name: name,
        "fromWireType": function(value) {
            return value
        },
        "toWireType": function(destructors, value) {
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
            }
            return value
        },
        "argPackAdvance": 8,
        "readValueFromPointer": floatReadValueFromPointer(name, shift),
        destructorFunction: null
    })
}
function __embind_register_function(name, argCount, rawArgTypesAddr, signature, rawInvoker, fn) {
    var argTypes = heap32VectorToArray(argCount, rawArgTypesAddr);
    name = readLatin1String(name);
    rawInvoker = embind__requireFunction(signature, rawInvoker);
    exposePublicSymbol(name,
        function() {
            throwUnboundTypeError("Cannot call " + name + " due to unbound types", argTypes)
        },
        argCount - 1);
    whenDependentTypesAreResolved([], argTypes,
        function(argTypes) {
            var invokerArgsArray = [argTypes[0], null].concat(argTypes.slice(1));
            replacePublicSymbol(name, craftInvokerFunction(name, invokerArgsArray, null, rawInvoker, fn), argCount - 1);
            return []
        })
}
function integerReadValueFromPointer(name, shift, signed) {
    switch (shift) {
        case 0:
            return signed ?
                function readS8FromPointer(pointer) {
                    return HEAP8[pointer]
                }: function readU8FromPointer(pointer) {
                    return HEAPU8[pointer]
                };
        case 1:
            return signed ?
                function readS16FromPointer(pointer) {
                    return HEAP16[pointer >> 1]
                }: function readU16FromPointer(pointer) {
                    return HEAPU16[pointer >> 1]
                };
        case 2:
            return signed ?
                function readS32FromPointer(pointer) {
                    return HEAP32[pointer >> 2]
                }: function readU32FromPointer(pointer) {
                    return HEAPU32[pointer >> 2]
                };
        default:
            throw new TypeError("Unknown integer type: " + name)
    }
}
function __embind_register_integer(primitiveType, name, size, minRange, maxRange) {
    name = readLatin1String(name);
    if (maxRange === -1) {
        maxRange = 4294967295
    }
    var shift = getShiftFromSize(size);
    var fromWireType = function(value) {
        return value
    };
    if (minRange === 0) {
        var bitshift = 32 - 8 * size;
        fromWireType = function(value) {
            return value << bitshift >>> bitshift
        }
    }
    var isUnsignedType = name.indexOf("unsigned") != -1;
    registerType(primitiveType, {
        name: name,
        "fromWireType": fromWireType,
        "toWireType": function(destructors, value) {
            if (typeof value !== "number" && typeof value !== "boolean") {
                throw new TypeError('Cannot convert "' + _embind_repr(value) + '" to ' + this.name)
            }
            if (value < minRange || value > maxRange) {
                throw new TypeError('Passing a number "' + _embind_repr(value) + '" from JS side to C/C++ side to an argument of type "' + name + '", which is outside the valid range [' + minRange + ", " + maxRange + "]!")
            }
            return isUnsignedType ? value >>> 0 : value | 0
        },
        "argPackAdvance": 8,
        "readValueFromPointer": integerReadValueFromPointer(name, shift, minRange !== 0),
        destructorFunction: null
    })
}
function __embind_register_memory_view(rawType, dataTypeIndex, name) {
    var typeMapping = [Int8Array, Uint8Array, Int16Array, Uint16Array, Int32Array, Uint32Array, Float32Array, Float64Array];
    var TA = typeMapping[dataTypeIndex];
    function decodeMemoryView(handle) {
        handle = handle >> 2;
        var heap = HEAPU32;
        var size = heap[handle];
        var data = heap[handle + 1];
        return new TA(heap["buffer"], data, size)
    }
    name = readLatin1String(name);
    registerType(rawType, {
            name: name,
            "fromWireType": decodeMemoryView,
            "argPackAdvance": 8,
            "readValueFromPointer": decodeMemoryView
        },
        {
            ignoreDuplicateRegistrations: true
        })
}
function __embind_register_smart_ptr(rawType, rawPointeeType, name, sharingPolicy, getPointeeSignature, rawGetPointee, constructorSignature, rawConstructor, shareSignature, rawShare, destructorSignature, rawDestructor) {
    name = readLatin1String(name);
    rawGetPointee = embind__requireFunction(getPointeeSignature, rawGetPointee);
    rawConstructor = embind__requireFunction(constructorSignature, rawConstructor);
    rawShare = embind__requireFunction(shareSignature, rawShare);
    rawDestructor = embind__requireFunction(destructorSignature, rawDestructor);
    whenDependentTypesAreResolved([rawType], [rawPointeeType],
        function(pointeeType) {
            pointeeType = pointeeType[0];
            var registeredPointer = new RegisteredPointer(name, pointeeType.registeredClass, false, false, true, pointeeType, sharingPolicy, rawGetPointee, rawConstructor, rawShare, rawDestructor);
            return [registeredPointer]
        })
}
function __embind_register_std_string(rawType, name) {
    name = readLatin1String(name);
    var stdStringIsUTF8 = false;
    registerType(rawType, {
        name: name,
        "fromWireType": function(value) {
            var length = HEAPU32[value >> 2];
            var str;
            if (stdStringIsUTF8) {
                var endChar = HEAPU8[value + 4 + length];
                var endCharSwap = 0;
                if (endChar != 0) {
                    endCharSwap = endChar;
                    HEAPU8[value + 4 + length] = 0
                }
                var decodeStartPtr = value + 4;
                for (var i = 0; i <= length; ++i) {
                    var currentBytePtr = value + 4 + i;
                    if (HEAPU8[currentBytePtr] == 0) {
                        var stringSegment = UTF8ToString(decodeStartPtr);
                        if (str === undefined) str = stringSegment;
                        else {
                            str += String.fromCharCode(0);
                            str += stringSegment
                        }
                        decodeStartPtr = currentBytePtr + 1
                    }
                }
                if (endCharSwap != 0) HEAPU8[value + 4 + length] = endCharSwap
            } else {
                var a = new Array(length);
                for (var i = 0; i < length; ++i) {
                    a[i] = String.fromCharCode(HEAPU8[value + 4 + i])
                }
                str = a.join("")
            }
            _free(value);
            return str
        },
        "toWireType": function(destructors, value) {
            if (value instanceof ArrayBuffer) {
                value = new Uint8Array(value)
            }
            var getLength;
            var valueIsOfTypeString = typeof value === "string";
            if (! (valueIsOfTypeString || value instanceof Uint8Array || value instanceof Uint8ClampedArray || value instanceof Int8Array)) {
                throwBindingError("Cannot pass non-string to std::string")
            }
            if (stdStringIsUTF8 && valueIsOfTypeString) {
                getLength = function() {
                    return lengthBytesUTF8(value)
                }
            } else {
                getLength = function() {
                    return value.length
                }
            }
            var length = getLength();
            var ptr = _malloc(4 + length + 1);
            HEAPU32[ptr >> 2] = length;
            if (stdStringIsUTF8 && valueIsOfTypeString) {
                stringToUTF8(value, ptr + 4, length + 1)
            } else {
                if (valueIsOfTypeString) {
                    for (var i = 0; i < length; ++i) {
                        var charCode = value.charCodeAt(i);
                        if (charCode > 255) {
                            _free(ptr);
                            throwBindingError("String has UTF-16 code units that do not fit in 8 bits")
                        }
                        HEAPU8[ptr + 4 + i] = charCode
                    }
                } else {
                    for (var i = 0; i < length; ++i) {
                        HEAPU8[ptr + 4 + i] = value[i]
                    }
                }
            }
            if (destructors !== null) {
                destructors.push(_free, ptr)
            }
            return ptr
        },
        "argPackAdvance": 8,
        "readValueFromPointer": simpleReadValueFromPointer,
        destructorFunction: function(ptr) {
            _free(ptr)
        }
    })
}
function __embind_register_std_wstring(rawType, charSize, name) {
    name = readLatin1String(name);
    var getHeap, shift;
    if (charSize === 2) {
        getHeap = function() {
            return HEAPU16
        };
        shift = 1
    } else if (charSize === 4) {
        getHeap = function() {
            return HEAPU32
        };
        shift = 2
    }
    registerType(rawType, {
        name: name,
        "fromWireType": function(value) {
            var HEAP = getHeap();
            var length = HEAPU32[value >> 2];
            var a = new Array(length);
            var start = value + 4 >> shift;
            for (var i = 0; i < length; ++i) {
                a[i] = String.fromCharCode(HEAP[start + i])
            }
            _free(value);
            return a.join("")
        },
        "toWireType": function(destructors, value) {
            var HEAP = getHeap();
            var length = value.length;
            var ptr = _malloc(4 + length * charSize);
            HEAPU32[ptr >> 2] = length;
            var start = ptr + 4 >> shift;
            for (var i = 0; i < length; ++i) {
                HEAP[start + i] = value.charCodeAt(i)
            }
            if (destructors !== null) {
                destructors.push(_free, ptr)
            }
            return ptr
        },
        "argPackAdvance": 8,
        "readValueFromPointer": simpleReadValueFromPointer,
        destructorFunction: function(ptr) {
            _free(ptr)
        }
    })
}
function __embind_register_value_array(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
    tupleRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
        rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
        elements: []
    }
}
function __embind_register_value_array_element(rawTupleType, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
    tupleRegistrations[rawTupleType].elements.push({
        getterReturnType: getterReturnType,
        getter: embind__requireFunction(getterSignature, getter),
        getterContext: getterContext,
        setterArgumentType: setterArgumentType,
        setter: embind__requireFunction(setterSignature, setter),
        setterContext: setterContext
    })
}
function __embind_register_value_object(rawType, name, constructorSignature, rawConstructor, destructorSignature, rawDestructor) {
    structRegistrations[rawType] = {
        name: readLatin1String(name),
        rawConstructor: embind__requireFunction(constructorSignature, rawConstructor),
        rawDestructor: embind__requireFunction(destructorSignature, rawDestructor),
        fields: []
    }
}
function __embind_register_value_object_field(structType, fieldName, getterReturnType, getterSignature, getter, getterContext, setterArgumentType, setterSignature, setter, setterContext) {
    structRegistrations[structType].fields.push({
        fieldName: readLatin1String(fieldName),
        getterReturnType: getterReturnType,
        getter: embind__requireFunction(getterSignature, getter),
        getterContext: getterContext,
        setterArgumentType: setterArgumentType,
        setter: embind__requireFunction(setterSignature, setter),
        setterContext: setterContext
    })
}
function __embind_register_void(rawType, name) {
    name = readLatin1String(name);
    registerType(rawType, {
        isVoid: true,
        name: name,
        "argPackAdvance": 0,
        "fromWireType": function() {
            return undefined
        },
        "toWireType": function(destructors, o) {
            return undefined
        }
    })
}
function __emval_lookupTypes(argCount, argTypes, argWireTypes) {
    var a = new Array(argCount);
    for (var i = 0; i < argCount; ++i) {
        a[i] = requireRegisteredType(HEAP32[(argTypes >> 2) + i], "parameter " + i)
    }
    return a
}
function __emval_call(handle, argCount, argTypes, argv) {
    handle = requireHandle(handle);
    var types = __emval_lookupTypes(argCount, argTypes);
    var args = new Array(argCount);
    for (var i = 0; i < argCount; ++i) {
        var type = types[i];
        args[i] = type["readValueFromPointer"](argv);
        argv += type["argPackAdvance"]
    }
    var rv = handle.apply(undefined, args);
    return __emval_register(rv)
}
function __emval_allocateDestructors(destructorsRef) {
    var destructors = [];
    HEAP32[destructorsRef >> 2] = __emval_register(destructors);
    return destructors
}
var emval_symbols = {};
function getStringOrSymbol(address) {
    var symbol = emval_symbols[address];
    if (symbol === undefined) {
        return readLatin1String(address)
    } else {
        return symbol
    }
}
var emval_methodCallers = [];
function __emval_call_method(caller, handle, methodName, destructorsRef, args) {
    caller = emval_methodCallers[caller];
    handle = requireHandle(handle);
    methodName = getStringOrSymbol(methodName);
    return caller(handle, methodName, __emval_allocateDestructors(destructorsRef), args)
}
function __emval_call_void_method(caller, handle, methodName, args) {
    caller = emval_methodCallers[caller];
    handle = requireHandle(handle);
    methodName = getStringOrSymbol(methodName);
    caller(handle, methodName, null, args)
}
function __emval_addMethodCaller(caller) {
    var id = emval_methodCallers.length;
    emval_methodCallers.push(caller);
    return id
}
function __emval_get_method_caller(argCount, argTypes) {
    var types = __emval_lookupTypes(argCount, argTypes);
    var retType = types[0];
    var signatureName = retType.name + "_$" + types.slice(1).map(function(t) {
        return t.name
    }).join("_") + "$";
    var params = ["retType"];
    var args = [retType];
    var argsList = "";
    for (var i = 0; i < argCount - 1; ++i) {
        argsList += (i !== 0 ? ", ": "") + "arg" + i;
        params.push("argType" + i);
        args.push(types[1 + i])
    }
    var functionName = makeLegalFunctionName("methodCaller_" + signatureName);
    var functionBody = "return function " + functionName + "(handle, name, destructors, args) {\n";
    var offset = 0;
    for (var i = 0; i < argCount - 1; ++i) {
        functionBody += "    var arg" + i + " = argType" + i + ".readValueFromPointer(args" + (offset ? "+" + offset: "") + ");\n";
        offset += types[i + 1]["argPackAdvance"]
    }
    functionBody += "    var rv = handle[name](" + argsList + ");\n";
    for (var i = 0; i < argCount - 1; ++i) {
        if (types[i + 1]["deleteObject"]) {
            functionBody += "    argType" + i + ".deleteObject(arg" + i + ");\n"
        }
    }
    if (!retType.isVoid) {
        functionBody += "    return retType.toWireType(destructors, rv);\n"
    }
    functionBody += "};\n";
    params.push(functionBody);
    var invokerFunction = new_(Function, params).apply(null, args);
    return __emval_addMethodCaller(invokerFunction)
}
function __emval_incref(handle) {
    if (handle > 4) {
        emval_handle_array[handle].refcount += 1
    }
}
function __emval_new_cstring(v) {
    return __emval_register(getStringOrSymbol(v))
}
function __emval_not(object) {
    object = requireHandle(object);
    return ! object
}
function __emval_run_destructors(handle) {
    var destructors = emval_handle_array[handle].value;
    runDestructors(destructors);
    __emval_decref(handle)
}
function __emval_take_value(type, argv) {
    type = requireRegisteredType(type, "_emval_take_value");
    var v = type["readValueFromPointer"](argv);
    return __emval_register(v)
}
function _abort() {
    Module["abort"]()
}
function _emscripten_get_now() {
    abort()
}
function _emscripten_get_now_is_monotonic() {
    return 0 || ENVIRONMENT_IS_NODE || typeof dateNow !== "undefined" || typeof performance === "object" && performance && typeof performance["now"] === "function"
}
function _clock_gettime(clk_id, tp) {
    var now;
    if (clk_id === 0) {
        now = Date.now()
    } else if (clk_id === 1 && _emscripten_get_now_is_monotonic()) {
        now = _emscripten_get_now()
    } else {
        ___setErrNo(22);
        return - 1
    }
    HEAP32[tp >> 2] = now / 1e3 | 0;
    HEAP32[tp + 4 >> 2] = now % 1e3 * 1e3 * 1e3 | 0;
    return 0
}
function _dlopen() {
    abort("To use dlopen, you need to use Emscripten's linking support, see https://github.com/emscripten-core/emscripten/wiki/Linking")
}
function _dlclose() {
    return _dlopen.apply(null, arguments)
}
function _dlerror() {
    return _dlopen.apply(null, arguments)
}
function _emscripten_set_main_loop_timing(mode, value) {
    Browser.mainLoop.timingMode = mode;
    Browser.mainLoop.timingValue = value;
    if (!Browser.mainLoop.func) {
        return 1
    }
    if (mode == 0) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setTimeout() {
            var timeUntilNextTick = Math.max(0, Browser.mainLoop.tickStartTime + value - _emscripten_get_now()) | 0;
            setTimeout(Browser.mainLoop.runner, timeUntilNextTick)
        };
        Browser.mainLoop.method = "timeout"
    } else if (mode == 1) {
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_rAF() {
            Browser.requestAnimationFrame(Browser.mainLoop.runner)
        };
        Browser.mainLoop.method = "rAF"
    } else if (mode == 2) {
        if (typeof setImmediate === "undefined") {
            var setImmediates = [];
            var emscriptenMainLoopMessageId = "setimmediate";
            var Browser_setImmediate_messageHandler = function(event) {
                if (event.data === emscriptenMainLoopMessageId || event.data.target === emscriptenMainLoopMessageId) {
                    event.stopPropagation();
                    setImmediates.shift()()
                }
            };
            addEventListener("message", Browser_setImmediate_messageHandler, true);
            setImmediate = function Browser_emulated_setImmediate(func) {
                setImmediates.push(func);
                if (ENVIRONMENT_IS_WORKER) {
                    if (Module["setImmediates"] === undefined) Module["setImmediates"] = [];
                    Module["setImmediates"].push(func);
                    postMessage({
                        target: emscriptenMainLoopMessageId
                    })
                } else postMessage(emscriptenMainLoopMessageId, "*")
            }
        }
        Browser.mainLoop.scheduler = function Browser_mainLoop_scheduler_setImmediate() {
            setImmediate(Browser.mainLoop.runner)
        };
        Browser.mainLoop.method = "immediate"
    }
    return 0
}
function _emscripten_set_main_loop(func, fps, simulateInfiniteLoop, arg, noSetTiming) {
    noExitRuntime = true;
    assert(!Browser.mainLoop.func, "emscripten_set_main_loop: there can only be one main loop function at once: call emscripten_cancel_main_loop to cancel the previous one before setting a new one with different parameters.");
    Browser.mainLoop.func = func;
    Browser.mainLoop.arg = arg;
    var browserIterationFunc;
    if (typeof arg !== "undefined") {
        browserIterationFunc = function() {
            Module["dynCall_vi"](func, arg)
        }
    } else {
        browserIterationFunc = function() {
            Module["dynCall_v"](func)
        }
    }
    var thisMainLoopId = Browser.mainLoop.currentlyRunningMainloop;
    Browser.mainLoop.runner = function Browser_mainLoop_runner() {
        if (ABORT) return;
        if (Browser.mainLoop.queue.length > 0) {
            var start = Date.now();
            var blocker = Browser.mainLoop.queue.shift();
            blocker.func(blocker.arg);
            if (Browser.mainLoop.remainingBlockers) {
                var remaining = Browser.mainLoop.remainingBlockers;
                var next = remaining % 1 == 0 ? remaining - 1 : Math.floor(remaining);
                if (blocker.counted) {
                    Browser.mainLoop.remainingBlockers = next
                } else {
                    next = next + .5;
                    Browser.mainLoop.remainingBlockers = (8 * remaining + next) / 9
                }
            }
            console.log('main loop blocker "' + blocker.name + '" took ' + (Date.now() - start) + " ms");
            Browser.mainLoop.updateStatus();
            if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
            setTimeout(Browser.mainLoop.runner, 0);
            return
        }
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        Browser.mainLoop.currentFrameNumber = Browser.mainLoop.currentFrameNumber + 1 | 0;
        if (Browser.mainLoop.timingMode == 1 && Browser.mainLoop.timingValue > 1 && Browser.mainLoop.currentFrameNumber % Browser.mainLoop.timingValue != 0) {
            Browser.mainLoop.scheduler();
            return
        } else if (Browser.mainLoop.timingMode == 0) {
            Browser.mainLoop.tickStartTime = _emscripten_get_now()
        }
        GL.newRenderingFrameStarted();
        if (Browser.mainLoop.method === "timeout" && Module.ctx) {
            err("Looks like you are rendering without using requestAnimationFrame for the main loop. You should use 0 for the frame rate in emscripten_set_main_loop in order to use requestAnimationFrame, as that can greatly improve your frame rates!");
            Browser.mainLoop.method = ""
        }
        Browser.mainLoop.runIter(browserIterationFunc);
        if (thisMainLoopId < Browser.mainLoop.currentlyRunningMainloop) return;
        if (typeof SDL === "object" && SDL.audio && SDL.audio.queueNewAudioData) SDL.audio.queueNewAudioData();
        Browser.mainLoop.scheduler()
    };
    if (!noSetTiming) {
        if (fps && fps > 0) _emscripten_set_main_loop_timing(0, 1e3 / fps);
        else _emscripten_set_main_loop_timing(1, 1);
        Browser.mainLoop.scheduler()
    }
    if (simulateInfiniteLoop) {
        throw "SimulateInfiniteLoop"
    }
}
var Browser = {
    mainLoop: {
        scheduler: null,
        method: "",
        currentlyRunningMainloop: 0,
        func: null,
        arg: 0,
        timingMode: 0,
        timingValue: 0,
        currentFrameNumber: 0,
        queue: [],
        pause: function() {
            Browser.mainLoop.scheduler = null;
            Browser.mainLoop.currentlyRunningMainloop++
        },
        resume: function() {
            Browser.mainLoop.currentlyRunningMainloop++;
            var timingMode = Browser.mainLoop.timingMode;
            var timingValue = Browser.mainLoop.timingValue;
            var func = Browser.mainLoop.func;
            Browser.mainLoop.func = null;
            _emscripten_set_main_loop(func, 0, false, Browser.mainLoop.arg, true);
            _emscripten_set_main_loop_timing(timingMode, timingValue);
            Browser.mainLoop.scheduler()
        },
        updateStatus: function() {
            if (Module["setStatus"]) {
                var message = Module["statusMessage"] || "Please wait...";
                var remaining = Browser.mainLoop.remainingBlockers;
                var expected = Browser.mainLoop.expectedBlockers;
                if (remaining) {
                    if (remaining < expected) {
                        Module["setStatus"](message + " (" + (expected - remaining) + "/" + expected + ")")
                    } else {
                        Module["setStatus"](message)
                    }
                } else {
                    Module["setStatus"]("")
                }
            }
        },
        runIter: function(func) {
            if (ABORT) return;
            if (Module["preMainLoop"]) {
                var preRet = Module["preMainLoop"]();
                if (preRet === false) {
                    return
                }
            }
            try {
                func()
            } catch(e) {
                if (e instanceof ExitStatus) {
                    return
                } else {
                    if (e && typeof e === "object" && e.stack) err("exception thrown: " + [e, e.stack]);
                    throw e
                }
            }
            if (Module["postMainLoop"]) Module["postMainLoop"]()
        }
    },
    isFullscreen: false,
    pointerLock: false,
    moduleContextCreatedCallbacks: [],
    workers: [],
    init: function() {
        if (!Module["preloadPlugins"]) Module["preloadPlugins"] = [];
        if (Browser.initted) return;
        Browser.initted = true;
        try {
            new Blob;
            Browser.hasBlobConstructor = true
        } catch(e) {
            Browser.hasBlobConstructor = false;
            console.log("warning: no blob constructor, cannot create blobs with mimetypes")
        }
        Browser.BlobBuilder = typeof MozBlobBuilder != "undefined" ? MozBlobBuilder: typeof WebKitBlobBuilder != "undefined" ? WebKitBlobBuilder: !Browser.hasBlobConstructor ? console.log("warning: no BlobBuilder") : null;
        Browser.URLObject = typeof window != "undefined" ? window.URL ? window.URL: window.webkitURL: undefined;
        if (!Module.noImageDecoding && typeof Browser.URLObject === "undefined") {
            console.log("warning: Browser does not support creating object URLs. Built-in browser image decoding will not be available.");
            Module.noImageDecoding = true
        }
        var imagePlugin = {};
        imagePlugin["canHandle"] = function imagePlugin_canHandle(name) {
            return ! Module.noImageDecoding && /\.(jpg|jpeg|png|bmp)$/i.test(name)
        };
        imagePlugin["handle"] = function imagePlugin_handle(byteArray, name, onload, onerror) {
            var b = null;
            if (Browser.hasBlobConstructor) {
                try {
                    b = new Blob([byteArray], {
                        type: Browser.getMimetype(name)
                    });
                    if (b.size !== byteArray.length) {
                        b = new Blob([new Uint8Array(byteArray).buffer], {
                            type: Browser.getMimetype(name)
                        })
                    }
                } catch(e) {
                    warnOnce("Blob constructor present but fails: " + e + "; falling back to blob builder")
                }
            }
            if (!b) {
                var bb = new Browser.BlobBuilder;
                bb.append(new Uint8Array(byteArray).buffer);
                b = bb.getBlob()
            }
            var url = Browser.URLObject.createObjectURL(b);
            var img = new Image;
            img.onload = function img_onload() {
                assert(img.complete, "Image " + name + " could not be decoded");
                var canvas = document.createElement("canvas");
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                Module["preloadedImages"][name] = canvas;
                Browser.URLObject.revokeObjectURL(url);
                if (onload) onload(byteArray)
            };
            img.onerror = function img_onerror(event) {
                console.log("Image " + url + " could not be decoded");
                if (onerror) onerror()
            };
            img.src = url
        };
        Module["preloadPlugins"].push(imagePlugin);
        var audioPlugin = {};
        audioPlugin["canHandle"] = function audioPlugin_canHandle(name) {
            return ! Module.noAudioDecoding && name.substr( - 4) in {
                ".ogg": 1,
                ".wav": 1,
                ".mp3": 1
            }
        };
        audioPlugin["handle"] = function audioPlugin_handle(byteArray, name, onload, onerror) {
            var done = false;
            function finish(audio) {
                if (done) return;
                done = true;
                Module["preloadedAudios"][name] = audio;
                if (onload) onload(byteArray)
            }
            function fail() {
                if (done) return;
                done = true;
                Module["preloadedAudios"][name] = new Audio;
                if (onerror) onerror()
            }
            if (Browser.hasBlobConstructor) {
                try {
                    var b = new Blob([byteArray], {
                        type: Browser.getMimetype(name)
                    })
                } catch(e) {
                    return fail()
                }
                var url = Browser.URLObject.createObjectURL(b);
                var audio = new Audio;
                audio.addEventListener("canplaythrough",
                    function() {
                        finish(audio)
                    },
                    false);
                audio.onerror = function audio_onerror(event) {
                    if (done) return;
                    console.log("warning: browser could not fully decode audio " + name + ", trying slower base64 approach");
                    function encode64(data) {
                        var BASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
                        var PAD = "=";
                        var ret = "";
                        var leftchar = 0;
                        var leftbits = 0;
                        for (var i = 0; i < data.length; i++) {
                            leftchar = leftchar << 8 | data[i];
                            leftbits += 8;
                            while (leftbits >= 6) {
                                var curr = leftchar >> leftbits - 6 & 63;
                                leftbits -= 6;
                                ret += BASE[curr]
                            }
                        }
                        if (leftbits == 2) {
                            ret += BASE[(leftchar & 3) << 4];
                            ret += PAD + PAD
                        } else if (leftbits == 4) {
                            ret += BASE[(leftchar & 15) << 2];
                            ret += PAD
                        }
                        return ret
                    }
                    audio.src = "data:audio/x-" + name.substr( - 3) + ";base64," + encode64(byteArray);
                    finish(audio)
                };
                audio.src = url;
                Browser.safeSetTimeout(function() {
                        finish(audio)
                    },
                    1e4)
            } else {
                return fail()
            }
        };
        Module["preloadPlugins"].push(audioPlugin);
        function pointerLockChange() {
            Browser.pointerLock = document["pointerLockElement"] === Module["canvas"] || document["mozPointerLockElement"] === Module["canvas"] || document["webkitPointerLockElement"] === Module["canvas"] || document["msPointerLockElement"] === Module["canvas"]
        }
        var canvas = Module["canvas"];
        if (canvas) {
            canvas.requestPointerLock = canvas["requestPointerLock"] || canvas["mozRequestPointerLock"] || canvas["webkitRequestPointerLock"] || canvas["msRequestPointerLock"] ||
                function() {};
            canvas.exitPointerLock = document["exitPointerLock"] || document["mozExitPointerLock"] || document["webkitExitPointerLock"] || document["msExitPointerLock"] ||
                function() {};
            canvas.exitPointerLock = canvas.exitPointerLock.bind(document);
            document.addEventListener("pointerlockchange", pointerLockChange, false);
            document.addEventListener("mozpointerlockchange", pointerLockChange, false);
            document.addEventListener("webkitpointerlockchange", pointerLockChange, false);
            document.addEventListener("mspointerlockchange", pointerLockChange, false);
            if (Module["elementPointerLock"]) {
                canvas.addEventListener("click",
                    function(ev) {
                        if (!Browser.pointerLock && Module["canvas"].requestPointerLock) {
                            Module["canvas"].requestPointerLock();
                            ev.preventDefault()
                        }
                    },
                    false)
            }
        }
    },
    createContext: function(canvas, useWebGL, setInModule, webGLContextAttributes) {
        if (useWebGL && Module.ctx && canvas == Module.canvas) return Module.ctx;
        var ctx;
        var contextHandle;
        if (useWebGL) {
            var contextAttributes = {
                antialias: false,
                alpha: false,
                majorVersion: 1
            };
            if (webGLContextAttributes) {
                for (var attribute in webGLContextAttributes) {
                    contextAttributes[attribute] = webGLContextAttributes[attribute]
                }
            }
            if (typeof GL !== "undefined") {
                contextHandle = GL.createContext(canvas, contextAttributes);
                if (contextHandle) {
                    ctx = GL.getContext(contextHandle).GLctx
                }
            }
        } else {
            ctx = canvas.getContext("2d")
        }
        if (!ctx) return null;
        if (setInModule) {
            if (!useWebGL) assert(typeof GLctx === "undefined", "cannot set in module if GLctx is used, but we are a non-GL context that would replace it");
            Module.ctx = ctx;
            if (useWebGL) GL.makeContextCurrent(contextHandle);
            Module.useWebGL = useWebGL;
            Browser.moduleContextCreatedCallbacks.forEach(function(callback) {
                callback()
            });
            Browser.init()
        }
        return ctx
    },
    destroyContext: function(canvas, useWebGL, setInModule) {},
    fullscreenHandlersInstalled: false,
    lockPointer: undefined,
    resizeCanvas: undefined,
    requestFullscreen: function(lockPointer, resizeCanvas, vrDevice) {
        Browser.lockPointer = lockPointer;
        Browser.resizeCanvas = resizeCanvas;
        Browser.vrDevice = vrDevice;
        if (typeof Browser.lockPointer === "undefined") Browser.lockPointer = true;
        if (typeof Browser.resizeCanvas === "undefined") Browser.resizeCanvas = false;
        if (typeof Browser.vrDevice === "undefined") Browser.vrDevice = null;
        var canvas = Module["canvas"];
        function fullscreenChange() {
            Browser.isFullscreen = false;
            var canvasContainer = canvas.parentNode;
            if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvasContainer) {
                canvas.exitFullscreen = Browser.exitFullscreen;
                if (Browser.lockPointer) canvas.requestPointerLock();
                Browser.isFullscreen = true;
                if (Browser.resizeCanvas) {
                    Browser.setFullscreenCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas)
                }
            } else {
                canvasContainer.parentNode.insertBefore(canvas, canvasContainer);
                canvasContainer.parentNode.removeChild(canvasContainer);
                if (Browser.resizeCanvas) {
                    Browser.setWindowedCanvasSize()
                } else {
                    Browser.updateCanvasDimensions(canvas)
                }
            }
            if (Module["onFullScreen"]) Module["onFullScreen"](Browser.isFullscreen);
            if (Module["onFullscreen"]) Module["onFullscreen"](Browser.isFullscreen)
        }
        if (!Browser.fullscreenHandlersInstalled) {
            Browser.fullscreenHandlersInstalled = true;
            document.addEventListener("fullscreenchange", fullscreenChange, false);
            document.addEventListener("mozfullscreenchange", fullscreenChange, false);
            document.addEventListener("webkitfullscreenchange", fullscreenChange, false);
            document.addEventListener("MSFullscreenChange", fullscreenChange, false)
        }
        var canvasContainer = document.createElement("div");
        canvas.parentNode.insertBefore(canvasContainer, canvas);
        canvasContainer.appendChild(canvas);
        canvasContainer.requestFullscreen = canvasContainer["requestFullscreen"] || canvasContainer["mozRequestFullScreen"] || canvasContainer["msRequestFullscreen"] || (canvasContainer["webkitRequestFullscreen"] ?
            function() {
                canvasContainer["webkitRequestFullscreen"](Element["ALLOW_KEYBOARD_INPUT"])
            }: null) || (canvasContainer["webkitRequestFullScreen"] ?
            function() {
                canvasContainer["webkitRequestFullScreen"](Element["ALLOW_KEYBOARD_INPUT"])
            }: null);
        if (vrDevice) {
            canvasContainer.requestFullscreen({
                vrDisplay: vrDevice
            })
        } else {
            canvasContainer.requestFullscreen()
        }
    },
    requestFullScreen: function(lockPointer, resizeCanvas, vrDevice) {
        err("Browser.requestFullScreen() is deprecated. Please call Browser.requestFullscreen instead.");
        Browser.requestFullScreen = function(lockPointer, resizeCanvas, vrDevice) {
            return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice)
        };
        return Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice)
    },
    exitFullscreen: function() {
        if (!Browser.isFullscreen) {
            return false
        }
        var CFS = document["exitFullscreen"] || document["cancelFullScreen"] || document["mozCancelFullScreen"] || document["msExitFullscreen"] || document["webkitCancelFullScreen"] ||
            function() {};
        CFS.apply(document, []);
        return true
    },
    nextRAF: 0,
    fakeRequestAnimationFrame: function(func) {
        var now = Date.now();
        if (Browser.nextRAF === 0) {
            Browser.nextRAF = now + 1e3 / 60
        } else {
            while (now + 2 >= Browser.nextRAF) {
                Browser.nextRAF += 1e3 / 60
            }
        }
        var delay = Math.max(Browser.nextRAF - now, 0);
        setTimeout(func, delay)
    },
    requestAnimationFrame: function(func) {
        if (typeof requestAnimationFrame === "function") {
            requestAnimationFrame(func);
            return
        }
        var RAF = Browser.fakeRequestAnimationFrame;
        RAF(func)
    },
    safeCallback: function(func) {
        return function() {
            if (!ABORT) return func.apply(null, arguments)
        }
    },
    allowAsyncCallbacks: true,
    queuedAsyncCallbacks: [],
    pauseAsyncCallbacks: function() {
        Browser.allowAsyncCallbacks = false
    },
    resumeAsyncCallbacks: function() {
        Browser.allowAsyncCallbacks = true;
        if (Browser.queuedAsyncCallbacks.length > 0) {
            var callbacks = Browser.queuedAsyncCallbacks;
            Browser.queuedAsyncCallbacks = [];
            callbacks.forEach(function(func) {
                func()
            })
        }
    },
    safeRequestAnimationFrame: function(func) {
        return Browser.requestAnimationFrame(function() {
            if (ABORT) return;
            if (Browser.allowAsyncCallbacks) {
                func()
            } else {
                Browser.queuedAsyncCallbacks.push(func)
            }
        })
    },
    safeSetTimeout: function(func, timeout) {
        noExitRuntime = true;
        return setTimeout(function() {
                if (ABORT) return;
                if (Browser.allowAsyncCallbacks) {
                    func()
                } else {
                    Browser.queuedAsyncCallbacks.push(func)
                }
            },
            timeout)
    },
    safeSetInterval: function(func, timeout) {
        noExitRuntime = true;
        return setInterval(function() {
                if (ABORT) return;
                if (Browser.allowAsyncCallbacks) {
                    func()
                }
            },
            timeout)
    },
    getMimetype: function(name) {
        return {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "bmp": "image/bmp",
            "ogg": "audio/ogg",
            "wav": "audio/wav",
            "mp3": "audio/mpeg"
        } [name.substr(name.lastIndexOf(".") + 1)]
    },
    getUserMedia: function(func) {
        if (!window.getUserMedia) {
            window.getUserMedia = navigator["getUserMedia"] || navigator["mozGetUserMedia"]
        }
        window.getUserMedia(func)
    },
    getMovementX: function(event) {
        return event["movementX"] || event["mozMovementX"] || event["webkitMovementX"] || 0
    },
    getMovementY: function(event) {
        return event["movementY"] || event["mozMovementY"] || event["webkitMovementY"] || 0
    },
    getMouseWheelDelta: function(event) {
        var delta = 0;
        switch (event.type) {
            case "DOMMouseScroll":
                delta = event.detail / 3;
                break;
            case "mousewheel":
                delta = event.wheelDelta / 120;
                break;
            case "wheel":
                delta = event.deltaY;
                switch (event.deltaMode) {
                    case 0:
                        delta /= 100;
                        break;
                    case 1:
                        delta /= 3;
                        break;
                    case 2:
                        delta *= 80;
                        break;
                    default:
                        throw "unrecognized mouse wheel delta mode: " + event.deltaMode
                }
                break;
            default:
                throw "unrecognized mouse wheel event: " + event.type
        }
        return delta
    },
    mouseX: 0,
    mouseY: 0,
    mouseMovementX: 0,
    mouseMovementY: 0,
    touches: {},
    lastTouches: {},
    calculateMouseEvent: function(event) {
        if (Browser.pointerLock) {
            if (event.type != "mousemove" && "mozMovementX" in event) {
                Browser.mouseMovementX = Browser.mouseMovementY = 0
            } else {
                Browser.mouseMovementX = Browser.getMovementX(event);
                Browser.mouseMovementY = Browser.getMovementY(event)
            }
            if (typeof SDL != "undefined") {
                Browser.mouseX = SDL.mouseX + Browser.mouseMovementX;
                Browser.mouseY = SDL.mouseY + Browser.mouseMovementY
            } else {
                Browser.mouseX += Browser.mouseMovementX;
                Browser.mouseY += Browser.mouseMovementY
            }
        } else {
            var rect = Module["canvas"].getBoundingClientRect();
            var cw = Module["canvas"].width;
            var ch = Module["canvas"].height;
            var scrollX = typeof window.scrollX !== "undefined" ? window.scrollX: window.pageXOffset;
            var scrollY = typeof window.scrollY !== "undefined" ? window.scrollY: window.pageYOffset;
            if (event.type === "touchstart" || event.type === "touchend" || event.type === "touchmove") {
                var touch = event.touch;
                if (touch === undefined) {
                    return
                }
                var adjustedX = touch.pageX - (scrollX + rect.left);
                var adjustedY = touch.pageY - (scrollY + rect.top);
                adjustedX = adjustedX * (cw / rect.width);
                adjustedY = adjustedY * (ch / rect.height);
                var coords = {
                    x: adjustedX,
                    y: adjustedY
                };
                if (event.type === "touchstart") {
                    Browser.lastTouches[touch.identifier] = coords;
                    Browser.touches[touch.identifier] = coords
                } else if (event.type === "touchend" || event.type === "touchmove") {
                    var last = Browser.touches[touch.identifier];
                    if (!last) last = coords;
                    Browser.lastTouches[touch.identifier] = last;
                    Browser.touches[touch.identifier] = coords
                }
                return
            }
            var x = event.pageX - (scrollX + rect.left);
            var y = event.pageY - (scrollY + rect.top);
            x = x * (cw / rect.width);
            y = y * (ch / rect.height);
            Browser.mouseMovementX = x - Browser.mouseX;
            Browser.mouseMovementY = y - Browser.mouseY;
            Browser.mouseX = x;
            Browser.mouseY = y
        }
    },
    asyncLoad: function(url, onload, onerror, noRunDep) {
        var dep = !noRunDep ? getUniqueRunDependency("al " + url) : "";
        readAsync(url,
            function(arrayBuffer) {
                assert(arrayBuffer, 'Loading data file "' + url + '" failed (no arrayBuffer).');
                onload(new Uint8Array(arrayBuffer));
                if (dep) removeRunDependency(dep)
            },
            function(event) {
                if (onerror) {
                    onerror()
                } else {
                    throw 'Loading data file "' + url + '" failed.'
                }
            });
        if (dep) addRunDependency(dep)
    },
    resizeListeners: [],
    updateResizeListeners: function() {
        var canvas = Module["canvas"];
        Browser.resizeListeners.forEach(function(listener) {
            listener(canvas.width, canvas.height)
        })
    },
    setCanvasSize: function(width, height, noUpdates) {
        var canvas = Module["canvas"];
        Browser.updateCanvasDimensions(canvas, width, height);
        if (!noUpdates) Browser.updateResizeListeners()
    },
    windowedWidth: 0,
    windowedHeight: 0,
    setFullscreenCanvasSize: function() {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags | 8388608;
            HEAP32[SDL.screen >> 2] = flags
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners()
    },
    setWindowedCanvasSize: function() {
        if (typeof SDL != "undefined") {
            var flags = HEAPU32[SDL.screen >> 2];
            flags = flags & ~8388608;
            HEAP32[SDL.screen >> 2] = flags
        }
        Browser.updateCanvasDimensions(Module["canvas"]);
        Browser.updateResizeListeners()
    },
    updateCanvasDimensions: function(canvas, wNative, hNative) {
        if (wNative && hNative) {
            canvas.widthNative = wNative;
            canvas.heightNative = hNative
        } else {
            wNative = canvas.widthNative;
            hNative = canvas.heightNative
        }
        var w = wNative;
        var h = hNative;
        if (Module["forcedAspectRatio"] && Module["forcedAspectRatio"] > 0) {
            if (w / h < Module["forcedAspectRatio"]) {
                w = Math.round(h * Module["forcedAspectRatio"])
            } else {
                h = Math.round(w / Module["forcedAspectRatio"])
            }
        }
        if ((document["fullscreenElement"] || document["mozFullScreenElement"] || document["msFullscreenElement"] || document["webkitFullscreenElement"] || document["webkitCurrentFullScreenElement"]) === canvas.parentNode && typeof screen != "undefined") {
            var factor = Math.min(screen.width / w, screen.height / h);
            w = Math.round(w * factor);
            h = Math.round(h * factor)
        }
        if (Browser.resizeCanvas) {
            if (canvas.width != w) canvas.width = w;
            if (canvas.height != h) canvas.height = h;
            if (typeof canvas.style != "undefined") {
                canvas.style.removeProperty("width");
                canvas.style.removeProperty("height")
            }
        } else {
            if (canvas.width != wNative) canvas.width = wNative;
            if (canvas.height != hNative) canvas.height = hNative;
            if (typeof canvas.style != "undefined") {
                if (w != wNative || h != hNative) {
                    canvas.style.setProperty("width", w + "px", "important");
                    canvas.style.setProperty("height", h + "px", "important")
                } else {
                    canvas.style.removeProperty("width");
                    canvas.style.removeProperty("height")
                }
            }
        }
    },
    wgetRequests: {},
    nextWgetRequestHandle: 0,
    getNextWgetRequestHandle: function() {
        var handle = Browser.nextWgetRequestHandle;
        Browser.nextWgetRequestHandle++;
        return handle
    }
};
function _emscripten_async_call(func, arg, millis) {
    noExitRuntime = true;
    function wrapper() {
        getFuncWrapper(func, "vi")(arg)
    }
    if (millis >= 0) {
        Browser.safeSetTimeout(wrapper, millis)
    } else {
        Browser.safeRequestAnimationFrame(wrapper)
    }
}
var JSEvents = {
    keyEvent: 0,
    mouseEvent: 0,
    wheelEvent: 0,
    uiEvent: 0,
    focusEvent: 0,
    deviceOrientationEvent: 0,
    deviceMotionEvent: 0,
    fullscreenChangeEvent: 0,
    pointerlockChangeEvent: 0,
    visibilityChangeEvent: 0,
    touchEvent: 0,
    previousFullscreenElement: null,
    previousScreenX: null,
    previousScreenY: null,
    removeEventListenersRegistered: false,
    removeAllEventListeners: function() {
        for (var i = JSEvents.eventHandlers.length - 1; i >= 0; --i) {
            JSEvents._removeHandler(i)
        }
        JSEvents.eventHandlers = [];
        JSEvents.deferredCalls = []
    },
    registerRemoveEventListeners: function() {
        if (!JSEvents.removeEventListenersRegistered) {
            __ATEXIT__.push(JSEvents.removeAllEventListeners);
            JSEvents.removeEventListenersRegistered = true
        }
    },
    deferredCalls: [],
    deferCall: function(targetFunction, precedence, argsList) {
        function arraysHaveEqualContent(arrA, arrB) {
            if (arrA.length != arrB.length) return false;
            for (var i in arrA) {
                if (arrA[i] != arrB[i]) return false
            }
            return true
        }
        for (var i in JSEvents.deferredCalls) {
            var call = JSEvents.deferredCalls[i];
            if (call.targetFunction == targetFunction && arraysHaveEqualContent(call.argsList, argsList)) {
                return
            }
        }
        JSEvents.deferredCalls.push({
            targetFunction: targetFunction,
            precedence: precedence,
            argsList: argsList
        });
        JSEvents.deferredCalls.sort(function(x, y) {
            return x.precedence < y.precedence
        })
    },
    removeDeferredCalls: function(targetFunction) {
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            if (JSEvents.deferredCalls[i].targetFunction == targetFunction) {
                JSEvents.deferredCalls.splice(i, 1); --i
            }
        }
    },
    canPerformEventHandlerRequests: function() {
        return JSEvents.inEventHandler && JSEvents.currentEventHandler.allowsDeferredCalls
    },
    runDeferredCalls: function() {
        if (!JSEvents.canPerformEventHandlerRequests()) {
            return
        }
        for (var i = 0; i < JSEvents.deferredCalls.length; ++i) {
            var call = JSEvents.deferredCalls[i];
            JSEvents.deferredCalls.splice(i, 1); --i;
            call.targetFunction.apply(this, call.argsList)
        }
    },
    inEventHandler: 0,
    currentEventHandler: null,
    eventHandlers: [],
    isInternetExplorer: function() {
        return navigator.userAgent.indexOf("MSIE") !== -1 || navigator.appVersion.indexOf("Trident/") > 0
    },
    removeAllHandlersOnTarget: function(target, eventTypeString) {
        for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
            if (JSEvents.eventHandlers[i].target == target && (!eventTypeString || eventTypeString == JSEvents.eventHandlers[i].eventTypeString)) {
                JSEvents._removeHandler(i--)
            }
        }
    },
    _removeHandler: function(i) {
        var h = JSEvents.eventHandlers[i];
        h.target.removeEventListener(h.eventTypeString, h.eventListenerFunc, h.useCapture);
        JSEvents.eventHandlers.splice(i, 1)
    },
    registerOrRemoveHandler: function(eventHandler) {
        var jsEventHandler = function jsEventHandler(event) {++JSEvents.inEventHandler;
            JSEvents.currentEventHandler = eventHandler;
            JSEvents.runDeferredCalls();
            eventHandler.handlerFunc(event);
            JSEvents.runDeferredCalls(); --JSEvents.inEventHandler
        };
        if (eventHandler.callbackfunc) {
            eventHandler.eventListenerFunc = jsEventHandler;
            eventHandler.target.addEventListener(eventHandler.eventTypeString, jsEventHandler, eventHandler.useCapture);
            JSEvents.eventHandlers.push(eventHandler);
            JSEvents.registerRemoveEventListeners()
        } else {
            for (var i = 0; i < JSEvents.eventHandlers.length; ++i) {
                if (JSEvents.eventHandlers[i].target == eventHandler.target && JSEvents.eventHandlers[i].eventTypeString == eventHandler.eventTypeString) {
                    JSEvents._removeHandler(i--)
                }
            }
        }
    },
    getBoundingClientRectOrZeros: function(target) {
        return target.getBoundingClientRect ? target.getBoundingClientRect() : {
            left: 0,
            top: 0
        }
    },
    pageScrollPos: function() {
        if (pageXOffset > 0 || pageYOffset > 0) {
            return [pageXOffset, pageYOffset]
        }
        if (typeof document.documentElement.scrollLeft !== "undefined" || typeof document.documentElement.scrollTop !== "undefined") {
            return [document.documentElement.scrollLeft, document.documentElement.scrollTop]
        }
        return [document.body.scrollLeft | 0, document.body.scrollTop | 0]
    },
    getNodeNameForTarget: function(target) {
        if (!target) return "";
        if (target == window) return "#window";
        if (target == screen) return "#screen";
        return target && target.nodeName ? target.nodeName: ""
    },
    tick: function() {
        if (window["performance"] && window["performance"]["now"]) return window["performance"]["now"]();
        else return Date.now()
    },
    fullscreenEnabled: function() {
        return document.fullscreenEnabled || document.mozFullScreenEnabled || document.webkitFullscreenEnabled || document.msFullscreenEnabled
    }
};
var __specialEventTargets = [0, typeof document !== "undefined" ? document: 0, typeof window !== "undefined" ? window: 0];
function __findEventTarget(target) {
    try {
        if (!target) return window;
        if (typeof target === "number") target = __specialEventTargets[target] || UTF8ToString(target);
        if (target === "#window") return window;
        else if (target === "#document") return document;
        else if (target === "#screen") return screen;
        else if (target === "#canvas") return Module["canvas"];
        return typeof target === "string" ? document.getElementById(target) : target
    } catch(e) {
        return null
    }
}
function __findCanvasEventTarget(target) {
    if (typeof target === "number") target = UTF8ToString(target);
    if (!target || target === "#canvas") {
        if (typeof GL !== "undefined" && GL.offscreenCanvases["canvas"]) return GL.offscreenCanvases["canvas"];
        return Module["canvas"]
    }
    if (typeof GL !== "undefined" && GL.offscreenCanvases[target]) return GL.offscreenCanvases[target];
    return __findEventTarget(target)
}
function _emscripten_get_canvas_element_size(target, width, height) {
    var canvas = __findCanvasEventTarget(target);
    if (!canvas) return - 4;
    HEAP32[width >> 2] = canvas.width;
    HEAP32[height >> 2] = canvas.height
}
function _emscripten_get_heap_size() {
    return HEAP8.length
}
var setjmpId = 0;
function _saveSetjmp(env, label, table, size) {
    env = env | 0;
    label = label | 0;
    table = table | 0;
    size = size | 0;
    var i = 0;
    setjmpId = setjmpId + 1 | 0;
    HEAP32[env >> 2] = setjmpId;
    while ((i | 0) < (size | 0)) {
        if ((HEAP32[table + (i << 3) >> 2] | 0) == 0) {
            HEAP32[table + (i << 3) >> 2] = setjmpId;
            HEAP32[table + ((i << 3) + 4) >> 2] = label;
            HEAP32[table + ((i << 3) + 8) >> 2] = 0;
            setTempRet0(size | 0);
            return table | 0
        }
        i = i + 1 | 0
    }
    size = size * 2 | 0;
    table = _realloc(table | 0, 8 * (size + 1 | 0) | 0) | 0;
    table = _saveSetjmp(env | 0, label | 0, table | 0, size | 0) | 0;
    setTempRet0(size | 0);
    return table | 0
}
function _testSetjmp(id, table, size) {
    id = id | 0;
    table = table | 0;
    size = size | 0;
    var i = 0,
        curr = 0;
    while ((i | 0) < (size | 0)) {
        curr = HEAP32[table + (i << 3) >> 2] | 0;
        if ((curr | 0) == 0) break;
        if ((curr | 0) == (id | 0)) {
            return HEAP32[table + ((i << 3) + 4) >> 2] | 0
        }
        i = i + 1 | 0
    }
    return 0
}
function _longjmp(env, value) {
    _setThrew(env, value || 1);
    throw "longjmp"
}
function _emscripten_longjmp(env, value) {
    _longjmp(env, value)
}
function _emscripten_memcpy_big(dest, src, num) {
    HEAPU8.set(HEAPU8.subarray(src, src + num), dest)
}
function _emscripten_run_script_int(ptr) {
    return eval(UTF8ToString(ptr)) | 0
}
function __fillMouseEventData(eventStruct, e, target) {
    HEAPF64[eventStruct >> 3] = JSEvents.tick();
    HEAP32[eventStruct + 8 >> 2] = e.screenX;
    HEAP32[eventStruct + 12 >> 2] = e.screenY;
    HEAP32[eventStruct + 16 >> 2] = e.clientX;
    HEAP32[eventStruct + 20 >> 2] = e.clientY;
    HEAP32[eventStruct + 24 >> 2] = e.ctrlKey;
    HEAP32[eventStruct + 28 >> 2] = e.shiftKey;
    HEAP32[eventStruct + 32 >> 2] = e.altKey;
    HEAP32[eventStruct + 36 >> 2] = e.metaKey;
    HEAP16[eventStruct + 40 >> 1] = e.button;
    HEAP16[eventStruct + 42 >> 1] = e.buttons;
    HEAP32[eventStruct + 44 >> 2] = e["movementX"] || e["mozMovementX"] || e["webkitMovementX"] || e.screenX - JSEvents.previousScreenX;
    HEAP32[eventStruct + 48 >> 2] = e["movementY"] || e["mozMovementY"] || e["webkitMovementY"] || e.screenY - JSEvents.previousScreenY;
    if (Module["canvas"]) {
        var rect = Module["canvas"].getBoundingClientRect();
        HEAP32[eventStruct + 60 >> 2] = e.clientX - rect.left;
        HEAP32[eventStruct + 64 >> 2] = e.clientY - rect.top
    } else {
        HEAP32[eventStruct + 60 >> 2] = 0;
        HEAP32[eventStruct + 64 >> 2] = 0
    }
    if (target) {
        var rect = JSEvents.getBoundingClientRectOrZeros(target);
        HEAP32[eventStruct + 52 >> 2] = e.clientX - rect.left;
        HEAP32[eventStruct + 56 >> 2] = e.clientY - rect.top
    } else {
        HEAP32[eventStruct + 52 >> 2] = 0;
        HEAP32[eventStruct + 56 >> 2] = 0
    }
    if (e.type !== "wheel" && e.type !== "mousewheel") {
        JSEvents.previousScreenX = e.screenX;
        JSEvents.previousScreenY = e.screenY
    }
}
function __registerMouseEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.mouseEvent) JSEvents.mouseEvent = _malloc(72);
    target = __findEventTarget(target);
    var mouseEventHandlerFunc = function(ev) {
        var e = ev || event;
        __fillMouseEventData(JSEvents.mouseEvent, e, target);
        if (dynCall_iiii(callbackfunc, eventTypeId, JSEvents.mouseEvent, userData)) e.preventDefault()
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: eventTypeString != "mousemove" && eventTypeString != "mouseenter" && eventTypeString != "mouseleave",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: mouseEventHandlerFunc,
        useCapture: useCapture
    };
    if (JSEvents.isInternetExplorer() && eventTypeString == "mousedown") eventHandler.allowsDeferredCalls = false;
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_click_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 4, "click", targetThread);
    return 0
}
function _emscripten_set_dblclick_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 7, "dblclick", targetThread);
    return 0
}
function __registerKeyEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.keyEvent) JSEvents.keyEvent = _malloc(164);
    var keyEventHandlerFunc = function(ev) {
        var e = ev || event;
        var keyEventData = JSEvents.keyEvent;
        stringToUTF8(e.key ? e.key: "", keyEventData + 0, 32);
        stringToUTF8(e.code ? e.code: "", keyEventData + 32, 32);
        HEAP32[keyEventData + 64 >> 2] = e.location;
        HEAP32[keyEventData + 68 >> 2] = e.ctrlKey;
        HEAP32[keyEventData + 72 >> 2] = e.shiftKey;
        HEAP32[keyEventData + 76 >> 2] = e.altKey;
        HEAP32[keyEventData + 80 >> 2] = e.metaKey;
        HEAP32[keyEventData + 84 >> 2] = e.repeat;
        stringToUTF8(e.locale ? e.locale: "", keyEventData + 88, 32);
        stringToUTF8(e.char ? e.char: "", keyEventData + 120, 32);
        HEAP32[keyEventData + 152 >> 2] = e.charCode;
        HEAP32[keyEventData + 156 >> 2] = e.keyCode;
        HEAP32[keyEventData + 160 >> 2] = e.which;
        if (dynCall_iiii(callbackfunc, eventTypeId, keyEventData, userData)) e.preventDefault()
    };
    var eventHandler = {
        target: __findEventTarget(target),
        allowsDeferredCalls: JSEvents.isInternetExplorer() ? false: true,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: keyEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_keydown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerKeyEventCallback(target, userData, useCapture, callbackfunc, 2, "keydown", targetThread);
    return 0
}
function _emscripten_set_keypress_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerKeyEventCallback(target, userData, useCapture, callbackfunc, 1, "keypress", targetThread);
    return 0
}
function _emscripten_set_keyup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerKeyEventCallback(target, userData, useCapture, callbackfunc, 3, "keyup", targetThread);
    return 0
}
function _emscripten_set_mousedown_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 5, "mousedown", targetThread);
    return 0
}
function _emscripten_set_mouseenter_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 33, "mouseenter", targetThread);
    return 0
}
function _emscripten_set_mouseleave_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 34, "mouseleave", targetThread);
    return 0
}
function _emscripten_set_mousemove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 8, "mousemove", targetThread);
    return 0
}
function _emscripten_set_mouseup_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerMouseEventCallback(target, userData, useCapture, callbackfunc, 6, "mouseup", targetThread);
    return 0
}
function __registerTouchEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.touchEvent) JSEvents.touchEvent = _malloc(1684);
    target = __findEventTarget(target);
    var touchEventHandlerFunc = function(ev) {
        var e = ev || event;
        var touches = {};
        for (var i = 0; i < e.touches.length; ++i) {
            var touch = e.touches[i];
            touch.changed = false;
            touches[touch.identifier] = touch
        }
        for (var i = 0; i < e.changedTouches.length; ++i) {
            var touch = e.changedTouches[i];
            touches[touch.identifier] = touch;
            touch.changed = true
        }
        for (var i = 0; i < e.targetTouches.length; ++i) {
            var touch = e.targetTouches[i];
            touches[touch.identifier].onTarget = true
        }
        var touchEvent = JSEvents.touchEvent;
        var ptr = touchEvent;
        HEAP32[ptr + 4 >> 2] = e.ctrlKey;
        HEAP32[ptr + 8 >> 2] = e.shiftKey;
        HEAP32[ptr + 12 >> 2] = e.altKey;
        HEAP32[ptr + 16 >> 2] = e.metaKey;
        ptr += 20;
        var canvasRect = Module["canvas"] ? Module["canvas"].getBoundingClientRect() : undefined;
        var targetRect = JSEvents.getBoundingClientRectOrZeros(target);
        var numTouches = 0;
        for (var i in touches) {
            var t = touches[i];
            HEAP32[ptr >> 2] = t.identifier;
            HEAP32[ptr + 4 >> 2] = t.screenX;
            HEAP32[ptr + 8 >> 2] = t.screenY;
            HEAP32[ptr + 12 >> 2] = t.clientX;
            HEAP32[ptr + 16 >> 2] = t.clientY;
            HEAP32[ptr + 20 >> 2] = t.pageX;
            HEAP32[ptr + 24 >> 2] = t.pageY;
            HEAP32[ptr + 28 >> 2] = t.changed;
            HEAP32[ptr + 32 >> 2] = t.onTarget;
            if (canvasRect) {
                HEAP32[ptr + 44 >> 2] = t.clientX - canvasRect.left;
                HEAP32[ptr + 48 >> 2] = t.clientY - canvasRect.top
            } else {
                HEAP32[ptr + 44 >> 2] = 0;
                HEAP32[ptr + 48 >> 2] = 0
            }
            HEAP32[ptr + 36 >> 2] = t.clientX - targetRect.left;
            HEAP32[ptr + 40 >> 2] = t.clientY - targetRect.top;
            ptr += 52;
            if (++numTouches >= 32) {
                break
            }
        }
        HEAP32[touchEvent >> 2] = numTouches;
        if (dynCall_iiii(callbackfunc, eventTypeId, touchEvent, userData)) e.preventDefault()
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: eventTypeString == "touchstart" || eventTypeString == "touchend",
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: touchEventHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_touchcancel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 25, "touchcancel", targetThread);
    return 0
}
function _emscripten_set_touchend_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 23, "touchend", targetThread);
    return 0
}
function _emscripten_set_touchmove_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 24, "touchmove", targetThread);
    return 0
}
function _emscripten_set_touchstart_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    __registerTouchEventCallback(target, userData, useCapture, callbackfunc, 22, "touchstart", targetThread);
    return 0
}
function __registerWheelEventCallback(target, userData, useCapture, callbackfunc, eventTypeId, eventTypeString, targetThread) {
    if (!JSEvents.wheelEvent) JSEvents.wheelEvent = _malloc(104);
    var wheelHandlerFunc = function(ev) {
        var e = ev || event;
        var wheelEvent = JSEvents.wheelEvent;
        __fillMouseEventData(wheelEvent, e, target);
        HEAPF64[wheelEvent + 72 >> 3] = e["deltaX"];
        HEAPF64[wheelEvent + 80 >> 3] = e["deltaY"];
        HEAPF64[wheelEvent + 88 >> 3] = e["deltaZ"];
        HEAP32[wheelEvent + 96 >> 2] = e["deltaMode"];
        if (dynCall_iiii(callbackfunc, eventTypeId, wheelEvent, userData)) e.preventDefault()
    };
    var mouseWheelHandlerFunc = function(ev) {
        var e = ev || event;
        __fillMouseEventData(JSEvents.wheelEvent, e, target);
        HEAPF64[JSEvents.wheelEvent + 72 >> 3] = e["wheelDeltaX"] || 0;
        HEAPF64[JSEvents.wheelEvent + 80 >> 3] = -(e["wheelDeltaY"] || e["wheelDelta"]);
        HEAPF64[JSEvents.wheelEvent + 88 >> 3] = 0;
        HEAP32[JSEvents.wheelEvent + 96 >> 2] = 0;
        var shouldCancel = dynCall_iiii(callbackfunc, eventTypeId, JSEvents.wheelEvent, userData);
        if (shouldCancel) {
            e.preventDefault()
        }
    };
    var eventHandler = {
        target: target,
        allowsDeferredCalls: true,
        eventTypeString: eventTypeString,
        callbackfunc: callbackfunc,
        handlerFunc: eventTypeString == "wheel" ? wheelHandlerFunc: mouseWheelHandlerFunc,
        useCapture: useCapture
    };
    JSEvents.registerOrRemoveHandler(eventHandler)
}
function _emscripten_set_wheel_callback_on_thread(target, userData, useCapture, callbackfunc, targetThread) {
    target = __findEventTarget(target);
    if (typeof target.onwheel !== "undefined") {
        __registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "wheel", targetThread);
        return 0
    } else if (typeof target.onmousewheel !== "undefined") {
        __registerWheelEventCallback(target, userData, useCapture, callbackfunc, 9, "mousewheel", targetThread);
        return 0
    } else {
        return - 1
    }
}
var GL = {
    counter: 1,
    lastError: 0,
    buffers: [],
    mappedBuffers: {},
    programs: [],
    framebuffers: [],
    renderbuffers: [],
    textures: [],
    uniforms: [],
    shaders: [],
    vaos: [],
    contexts: {},
    currentContext: null,
    offscreenCanvases: {},
    timerQueriesEXT: [],
    currArrayBuffer: 0,
    currElementArrayBuffer: 0,
    byteSizeByTypeRoot: 5120,
    byteSizeByType: [1, 1, 2, 2, 4, 4, 4, 2, 3, 4, 8],
    programInfos: {},
    stringCache: {},
    unpackAlignment: 4,
    init: function() {
        GL.createLog2ceilLookup(GL.MAX_TEMP_BUFFER_SIZE);
        GL.miniTempBuffer = new Float32Array(GL.MINI_TEMP_BUFFER_SIZE);
        for (var i = 0; i < GL.MINI_TEMP_BUFFER_SIZE; i++) {
            GL.miniTempBufferViews[i] = GL.miniTempBuffer.subarray(0, i + 1)
        }
    },
    recordError: function recordError(errorCode) {
        if (!GL.lastError) {
            GL.lastError = errorCode
        }
    },
    getNewId: function(table) {
        var ret = GL.counter++;
        for (var i = table.length; i < ret; i++) {
            table[i] = null
        }
        return ret
    },
    MINI_TEMP_BUFFER_SIZE: 256,
    miniTempBuffer: null,
    miniTempBufferViews: [0],
    MAX_TEMP_BUFFER_SIZE: 2097152,
    numTempVertexBuffersPerSize: 64,
    log2ceilLookup: null,
    createLog2ceilLookup: function(maxValue) {
        GL.log2ceilLookup = new Uint8Array(maxValue + 1);
        var log2 = 0;
        var pow2 = 1;
        GL.log2ceilLookup[0] = 0;
        for (var i = 1; i <= maxValue; ++i) {
            if (i > pow2) {
                pow2 <<= 1; ++log2
            }
            GL.log2ceilLookup[i] = log2
        }
    },
    generateTempBuffers: function(quads, context) {
        var largestIndex = GL.log2ceilLookup[GL.MAX_TEMP_BUFFER_SIZE];
        context.tempVertexBufferCounters1 = [];
        context.tempVertexBufferCounters2 = [];
        context.tempVertexBufferCounters1.length = context.tempVertexBufferCounters2.length = largestIndex + 1;
        context.tempVertexBuffers1 = [];
        context.tempVertexBuffers2 = [];
        context.tempVertexBuffers1.length = context.tempVertexBuffers2.length = largestIndex + 1;
        context.tempIndexBuffers = [];
        context.tempIndexBuffers.length = largestIndex + 1;
        for (var i = 0; i <= largestIndex; ++i) {
            context.tempIndexBuffers[i] = null;
            context.tempVertexBufferCounters1[i] = context.tempVertexBufferCounters2[i] = 0;
            var ringbufferLength = GL.numTempVertexBuffersPerSize;
            context.tempVertexBuffers1[i] = [];
            context.tempVertexBuffers2[i] = [];
            var ringbuffer1 = context.tempVertexBuffers1[i];
            var ringbuffer2 = context.tempVertexBuffers2[i];
            ringbuffer1.length = ringbuffer2.length = ringbufferLength;
            for (var j = 0; j < ringbufferLength; ++j) {
                ringbuffer1[j] = ringbuffer2[j] = null
            }
        }
        if (quads) {
            context.tempQuadIndexBuffer = GLctx.createBuffer();
            context.GLctx.bindBuffer(context.GLctx.ELEMENT_ARRAY_BUFFER, context.tempQuadIndexBuffer);
            var numIndexes = GL.MAX_TEMP_BUFFER_SIZE >> 1;
            var quadIndexes = new Uint16Array(numIndexes);
            var i = 0,
                v = 0;
            while (1) {
                quadIndexes[i++] = v;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 1;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 2;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 2;
                if (i >= numIndexes) break;
                quadIndexes[i++] = v + 3;
                if (i >= numIndexes) break;
                v += 4
            }
            context.GLctx.bufferData(context.GLctx.ELEMENT_ARRAY_BUFFER, quadIndexes, context.GLctx.STATIC_DRAW);
            context.GLctx.bindBuffer(context.GLctx.ELEMENT_ARRAY_BUFFER, null)
        }
    },
    getTempVertexBuffer: function getTempVertexBuffer(sizeBytes) {
        var idx = GL.log2ceilLookup[sizeBytes];
        var ringbuffer = GL.currentContext.tempVertexBuffers1[idx];
        var nextFreeBufferIndex = GL.currentContext.tempVertexBufferCounters1[idx];
        GL.currentContext.tempVertexBufferCounters1[idx] = GL.currentContext.tempVertexBufferCounters1[idx] + 1 & GL.numTempVertexBuffersPerSize - 1;
        var vbo = ringbuffer[nextFreeBufferIndex];
        if (vbo) {
            return vbo
        }
        var prevVBO = GLctx.getParameter(GLctx.ARRAY_BUFFER_BINDING);
        ringbuffer[nextFreeBufferIndex] = GLctx.createBuffer();
        GLctx.bindBuffer(GLctx.ARRAY_BUFFER, ringbuffer[nextFreeBufferIndex]);
        GLctx.bufferData(GLctx.ARRAY_BUFFER, 1 << idx, GLctx.DYNAMIC_DRAW);
        GLctx.bindBuffer(GLctx.ARRAY_BUFFER, prevVBO);
        return ringbuffer[nextFreeBufferIndex]
    },
    getTempIndexBuffer: function getTempIndexBuffer(sizeBytes) {
        var idx = GL.log2ceilLookup[sizeBytes];
        var ibo = GL.currentContext.tempIndexBuffers[idx];
        if (ibo) {
            return ibo
        }
        var prevIBO = GLctx.getParameter(GLctx.ELEMENT_ARRAY_BUFFER_BINDING);
        GL.currentContext.tempIndexBuffers[idx] = GLctx.createBuffer();
        GLctx.bindBuffer(GLctx.ELEMENT_ARRAY_BUFFER, GL.currentContext.tempIndexBuffers[idx]);
        GLctx.bufferData(GLctx.ELEMENT_ARRAY_BUFFER, 1 << idx, GLctx.DYNAMIC_DRAW);
        GLctx.bindBuffer(GLctx.ELEMENT_ARRAY_BUFFER, prevIBO);
        return GL.currentContext.tempIndexBuffers[idx]
    },
    newRenderingFrameStarted: function newRenderingFrameStarted() {
        if (!GL.currentContext) {
            return
        }
        var vb = GL.currentContext.tempVertexBuffers1;
        GL.currentContext.tempVertexBuffers1 = GL.currentContext.tempVertexBuffers2;
        GL.currentContext.tempVertexBuffers2 = vb;
        vb = GL.currentContext.tempVertexBufferCounters1;
        GL.currentContext.tempVertexBufferCounters1 = GL.currentContext.tempVertexBufferCounters2;
        GL.currentContext.tempVertexBufferCounters2 = vb;
        var largestIndex = GL.log2ceilLookup[GL.MAX_TEMP_BUFFER_SIZE];
        for (var i = 0; i <= largestIndex; ++i) {
            GL.currentContext.tempVertexBufferCounters1[i] = 0
        }
    },
    getSource: function(shader, count, string, length) {
        var source = "";
        for (var i = 0; i < count; ++i) {
            var len = length ? HEAP32[length + i * 4 >> 2] : -1;
            source += UTF8ToString(HEAP32[string + i * 4 >> 2], len < 0 ? undefined: len)
        }
        return source
    },
    calcBufLength: function calcBufLength(size, type, stride, count) {
        if (stride > 0) {
            return count * stride
        }
        var typeSize = GL.byteSizeByType[type - GL.byteSizeByTypeRoot];
        return size * typeSize * count
    },
    usedTempBuffers: [],
    preDrawHandleClientVertexAttribBindings: function preDrawHandleClientVertexAttribBindings(count) {
        GL.resetBufferBinding = false;
        for (var i = 0; i < GL.currentContext.maxVertexAttribs; ++i) {
            var cb = GL.currentContext.clientBuffers[i];
            if (!cb.clientside || !cb.enabled) continue;
            GL.resetBufferBinding = true;
            var size = GL.calcBufLength(cb.size, cb.type, cb.stride, count);
            var buf = GL.getTempVertexBuffer(size);
            GLctx.bindBuffer(GLctx.ARRAY_BUFFER, buf);
            GLctx.bufferSubData(GLctx.ARRAY_BUFFER, 0, HEAPU8.subarray(cb.ptr, cb.ptr + size));
            cb.vertexAttribPointerAdaptor.call(GLctx, i, cb.size, cb.type, cb.normalized, cb.stride, 0)
        }
    },
    postDrawHandleClientVertexAttribBindings: function postDrawHandleClientVertexAttribBindings() {
        if (GL.resetBufferBinding) {
            GLctx.bindBuffer(GLctx.ARRAY_BUFFER, GL.buffers[GL.currArrayBuffer])
        }
    },
    createContext: function(canvas, webGLContextAttributes) {
        var ctx = canvas.getContext("webgl", webGLContextAttributes) || canvas.getContext("experimental-webgl", webGLContextAttributes);
        if (!ctx) return 0;
        var handle = GL.registerContext(ctx, webGLContextAttributes);
        return handle
    },
    registerContext: function(ctx, webGLContextAttributes) {
        var handle = _malloc(8);
        var context = {
            handle: handle,
            attributes: webGLContextAttributes,
            version: webGLContextAttributes.majorVersion,
            GLctx: ctx
        };
        if (ctx.canvas) ctx.canvas.GLctxObject = context;
        GL.contexts[handle] = context;
        if (typeof webGLContextAttributes.enableExtensionsByDefault === "undefined" || webGLContextAttributes.enableExtensionsByDefault) {
            GL.initExtensions(context)
        }
        context.maxVertexAttribs = context.GLctx.getParameter(context.GLctx.MAX_VERTEX_ATTRIBS);
        context.clientBuffers = [];
        for (var i = 0; i < context.maxVertexAttribs; i++) {
            context.clientBuffers[i] = {
                enabled: false,
                clientside: false,
                size: 0,
                type: 0,
                normalized: 0,
                stride: 0,
                ptr: 0,
                vertexAttribPointerAdaptor: null
            }
        }
        GL.generateTempBuffers(false, context);
        return handle
    },
    makeContextCurrent: function(contextHandle) {
        GL.currentContext = GL.contexts[contextHandle];
        Module.ctx = GLctx = GL.currentContext && GL.currentContext.GLctx;
        return ! (contextHandle && !GLctx)
    },
    getContext: function(contextHandle) {
        return GL.contexts[contextHandle]
    },
    deleteContext: function(contextHandle) {
        if (GL.currentContext === GL.contexts[contextHandle]) GL.currentContext = null;
        if (typeof JSEvents === "object") JSEvents.removeAllHandlersOnTarget(GL.contexts[contextHandle].GLctx.canvas);
        if (GL.contexts[contextHandle] && GL.contexts[contextHandle].GLctx.canvas) GL.contexts[contextHandle].GLctx.canvas.GLctxObject = undefined;
        _free(GL.contexts[contextHandle]);
        GL.contexts[contextHandle] = null
    },
    acquireInstancedArraysExtension: function(ctx) {
        var ext = ctx.getExtension("ANGLE_instanced_arrays");
        if (ext) {
            ctx["vertexAttribDivisor"] = function(index, divisor) {
                ext["vertexAttribDivisorANGLE"](index, divisor)
            };
            ctx["drawArraysInstanced"] = function(mode, first, count, primcount) {
                ext["drawArraysInstancedANGLE"](mode, first, count, primcount)
            };
            ctx["drawElementsInstanced"] = function(mode, count, type, indices, primcount) {
                ext["drawElementsInstancedANGLE"](mode, count, type, indices, primcount)
            }
        }
    },
    acquireVertexArrayObjectExtension: function(ctx) {
        var ext = ctx.getExtension("OES_vertex_array_object");
        if (ext) {
            ctx["createVertexArray"] = function() {
                return ext["createVertexArrayOES"]()
            };
            ctx["deleteVertexArray"] = function(vao) {
                ext["deleteVertexArrayOES"](vao)
            };
            ctx["bindVertexArray"] = function(vao) {
                ext["bindVertexArrayOES"](vao)
            };
            ctx["isVertexArray"] = function(vao) {
                return ext["isVertexArrayOES"](vao)
            }
        }
    },
    acquireDrawBuffersExtension: function(ctx) {
        var ext = ctx.getExtension("WEBGL_draw_buffers");
        if (ext) {
            ctx["drawBuffers"] = function(n, bufs) {
                ext["drawBuffersWEBGL"](n, bufs)
            }
        }
    },
    initExtensions: function(context) {
        if (!context) context = GL.currentContext;
        if (context.initExtensionsDone) return;
        context.initExtensionsDone = true;
        var GLctx = context.GLctx;
        if (context.version < 2) {
            GL.acquireInstancedArraysExtension(GLctx);
            GL.acquireVertexArrayObjectExtension(GLctx);
            GL.acquireDrawBuffersExtension(GLctx)
        }
        GLctx.disjointTimerQueryExt = GLctx.getExtension("EXT_disjoint_timer_query");
        var automaticallyEnabledExtensions = ["OES_texture_float", "OES_texture_half_float", "OES_standard_derivatives", "OES_vertex_array_object", "WEBGL_compressed_texture_s3tc", "WEBGL_depth_texture", "OES_element_index_uint", "EXT_texture_filter_anisotropic", "EXT_frag_depth", "WEBGL_draw_buffers", "ANGLE_instanced_arrays", "OES_texture_float_linear", "OES_texture_half_float_linear", "EXT_blend_minmax", "EXT_shader_texture_lod", "WEBGL_compressed_texture_pvrtc", "EXT_color_buffer_half_float", "WEBGL_color_buffer_float", "EXT_sRGB", "WEBGL_compressed_texture_etc1", "EXT_disjoint_timer_query", "WEBGL_compressed_texture_etc", "WEBGL_compressed_texture_astc", "EXT_color_buffer_float", "WEBGL_compressed_texture_s3tc_srgb", "EXT_disjoint_timer_query_webgl2"];
        var exts = GLctx.getSupportedExtensions() || [];
        exts.forEach(function(ext) {
            if (automaticallyEnabledExtensions.indexOf(ext) != -1) {
                GLctx.getExtension(ext)
            }
        })
    },
    populateUniformTable: function(program) {
        var p = GL.programs[program];
        var ptable = GL.programInfos[program] = {
            uniforms: {},
            maxUniformLength: 0,
            maxAttributeLength: -1,
            maxUniformBlockNameLength: -1
        };
        var utable = ptable.uniforms;
        var numUniforms = GLctx.getProgramParameter(p, 35718);
        for (var i = 0; i < numUniforms; ++i) {
            var u = GLctx.getActiveUniform(p, i);
            var name = u.name;
            ptable.maxUniformLength = Math.max(ptable.maxUniformLength, name.length + 1);
            if (name.slice( - 1) == "]") {
                name = name.slice(0, name.lastIndexOf("["))
            }
            var loc = GLctx.getUniformLocation(p, name);
            if (loc) {
                var id = GL.getNewId(GL.uniforms);
                utable[name] = [u.size, id];
                GL.uniforms[id] = loc;
                for (var j = 1; j < u.size; ++j) {
                    var n = name + "[" + j + "]";
                    loc = GLctx.getUniformLocation(p, n);
                    id = GL.getNewId(GL.uniforms);
                    GL.uniforms[id] = loc
                }
            }
        }
    }
};
var __emscripten_webgl_power_preferences = ["default", "low-power", "high-performance"];
function _emscripten_webgl_do_create_context(target, attributes) {
    var contextAttributes = {};
    var a = attributes >> 2;
    contextAttributes["alpha"] = !!HEAP32[a + (0 >> 2)];
    contextAttributes["depth"] = !!HEAP32[a + (4 >> 2)];
    contextAttributes["stencil"] = !!HEAP32[a + (8 >> 2)];
    contextAttributes["antialias"] = !!HEAP32[a + (12 >> 2)];
    contextAttributes["premultipliedAlpha"] = !!HEAP32[a + (16 >> 2)];
    contextAttributes["preserveDrawingBuffer"] = !!HEAP32[a + (20 >> 2)];
    var powerPreference = HEAP32[a + (24 >> 2)];
    contextAttributes["powerPreference"] = __emscripten_webgl_power_preferences[powerPreference];
    contextAttributes["failIfMajorPerformanceCaveat"] = !!HEAP32[a + (28 >> 2)];
    contextAttributes.majorVersion = HEAP32[a + (32 >> 2)];
    contextAttributes.minorVersion = HEAP32[a + (36 >> 2)];
    contextAttributes.enableExtensionsByDefault = HEAP32[a + (40 >> 2)];
    contextAttributes.explicitSwapControl = HEAP32[a + (44 >> 2)];
    contextAttributes.proxyContextToMainThread = HEAP32[a + (48 >> 2)];
    contextAttributes.renderViaOffscreenBackBuffer = HEAP32[a + (52 >> 2)];
    var canvas = __findCanvasEventTarget(target);
    if (!canvas) {
        return 0
    }
    if (contextAttributes.explicitSwapControl) {
        return 0
    }
    var contextHandle = GL.createContext(canvas, contextAttributes);
    return contextHandle
}
function _emscripten_webgl_create_context(a0, a1) {
    return _emscripten_webgl_do_create_context(a0, a1)
}
function _emscripten_webgl_destroy_context_calling_thread(contextHandle) {
    if (GL.currentContext == contextHandle) GL.currentContext = 0;
    GL.deleteContext(contextHandle)
}
function _emscripten_webgl_destroy_context(a0) {
    return _emscripten_webgl_destroy_context_calling_thread(a0)
}
function _emscripten_webgl_enable_extension_calling_thread(contextHandle, extension) {
    var context = GL.getContext(contextHandle);
    var extString = UTF8ToString(extension);
    if (extString.indexOf("GL_") == 0) extString = extString.substr(3);
    if (extString == "ANGLE_instanced_arrays") GL.acquireInstancedArraysExtension(GLctx);
    else if (extString == "OES_vertex_array_object") GL.acquireVertexArrayObjectExtension(GLctx);
    else if (extString == "WEBGL_draw_buffers") GL.acquireDrawBuffersExtension(GLctx);
    var ext = context.GLctx.getExtension(extString);
    return !! ext
}
function _emscripten_webgl_enable_extension(a0, a1) {
    return _emscripten_webgl_enable_extension_calling_thread(a0, a1)
}
function _emscripten_webgl_do_get_current_context() {
    return GL.currentContext ? GL.currentContext.handle: 0
}
function _emscripten_webgl_get_current_context() {
    return _emscripten_webgl_do_get_current_context()
}
Module["_emscripten_webgl_get_current_context"] = _emscripten_webgl_get_current_context;
function _emscripten_webgl_init_context_attributes(attributes) {
    var a = attributes >> 2;
    for (var i = 0; i < 56 >> 2; ++i) {
        HEAP32[a + i] = 0
    }
    HEAP32[a + (0 >> 2)] = HEAP32[a + (4 >> 2)] = HEAP32[a + (12 >> 2)] = HEAP32[a + (16 >> 2)] = HEAP32[a + (32 >> 2)] = HEAP32[a + (40 >> 2)] = 1
}
function _emscripten_webgl_make_context_current(contextHandle) {
    var success = GL.makeContextCurrent(contextHandle);
    return success ? 0 : -5
}
Module["_emscripten_webgl_make_context_current"] = _emscripten_webgl_make_context_current;
function _exit(status) {
    exit(status)
}
function _fd_write(stream, iov, iovcnt, pnum) {
    try {
        stream = FS.getStream(stream);
        if (!stream) throw new FS.ErrnoError(9);
        var num = SYSCALLS.doWritev(stream, iov, iovcnt);
        HEAP32[pnum >> 2] = num;
        return 0
    } catch(e) {
        if (typeof FS === "undefined" || !(e instanceof FS.ErrnoError)) abort(e);
        return - e.errno
    }
}
function _getTempRet0() {
    return getTempRet0() | 0
}
function _getenv(name) {
    if (name === 0) return 0;
    name = UTF8ToString(name);
    if (!ENV.hasOwnProperty(name)) return 0;
    if (_getenv.ret) _free(_getenv.ret);
    _getenv.ret = allocateUTF8(ENV[name]);
    return _getenv.ret
}
function _gettimeofday(ptr) {
    var now = Date.now();
    HEAP32[ptr >> 2] = now / 1e3 | 0;
    HEAP32[ptr + 4 >> 2] = now % 1e3 * 1e3 | 0;
    return 0
}
function _glActiveTexture(x0) {
    GLctx["activeTexture"](x0)
}
function _glAttachShader(program, shader) {
    GLctx.attachShader(GL.programs[program], GL.shaders[shader])
}
function _glBindBuffer(target, buffer) {
    if (target == GLctx.ARRAY_BUFFER) {
        GL.currArrayBuffer = buffer
    } else if (target == GLctx.ELEMENT_ARRAY_BUFFER) {
        GL.currElementArrayBuffer = buffer
    }
    GLctx.bindBuffer(target, GL.buffers[buffer])
}
function _glBindFramebuffer(target, framebuffer) {
    GLctx.bindFramebuffer(target, GL.framebuffers[framebuffer])
}
function _glBindRenderbuffer(target, renderbuffer) {
    GLctx.bindRenderbuffer(target, GL.renderbuffers[renderbuffer])
}
function _glBindTexture(target, texture) {
    GLctx.bindTexture(target, GL.textures[texture])
}
function _glBlendColor(x0, x1, x2, x3) {
    GLctx["blendColor"](x0, x1, x2, x3)
}
function _glBlendFunc(x0, x1) {
    GLctx["blendFunc"](x0, x1)
}
function _glBufferData(target, size, data, usage) {
    GLctx.bufferData(target, data ? HEAPU8.subarray(data, data + size) : size, usage)
}
function _glCheckFramebufferStatus(x0) {
    return GLctx["checkFramebufferStatus"](x0)
}
function _glClear(x0) {
    GLctx["clear"](x0)
}
function _glClearColor(x0, x1, x2, x3) {
    GLctx["clearColor"](x0, x1, x2, x3)
}
function _glClearDepthf(x0) {
    GLctx["clearDepth"](x0)
}
function _glClearStencil(x0) {
    GLctx["clearStencil"](x0)
}
function _glColorMask(red, green, blue, alpha) {
    GLctx.colorMask( !! red, !!green, !!blue, !!alpha)
}
function _glCompileShader(shader) {
    GLctx.compileShader(GL.shaders[shader])
}
function _glCreateProgram() {
    var id = GL.getNewId(GL.programs);
    var program = GLctx.createProgram();
    program.name = id;
    GL.programs[id] = program;
    return id
}
function _glCreateShader(shaderType) {
    var id = GL.getNewId(GL.shaders);
    GL.shaders[id] = GLctx.createShader(shaderType);
    return id
}
function _glCullFace(x0) {
    GLctx["cullFace"](x0)
}
function _glDeleteBuffers(n, buffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[buffers + i * 4 >> 2];
        var buffer = GL.buffers[id];
        if (!buffer) continue;
        GLctx.deleteBuffer(buffer);
        buffer.name = 0;
        GL.buffers[id] = null;
        if (id == GL.currArrayBuffer) GL.currArrayBuffer = 0;
        if (id == GL.currElementArrayBuffer) GL.currElementArrayBuffer = 0
    }
}
function _glDeleteFramebuffers(n, framebuffers) {
    for (var i = 0; i < n; ++i) {
        var id = HEAP32[framebuffers + i * 4 >> 2];
        var framebuffer = GL.framebuffers[id];
        if (!framebuffer) continue;
        GLctx.deleteFramebuffer(framebuffer);
        framebuffer.name = 0;
        GL.framebuffers[id] = null
    }
}
function _glDeleteProgram(id) {
    if (!id) return;
    var program = GL.programs[id];
    if (!program) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteProgram(program);
    program.name = 0;
    GL.programs[id] = null;
    GL.programInfos[id] = null
}
function _glDeleteRenderbuffers(n, renderbuffers) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[renderbuffers + i * 4 >> 2];
        var renderbuffer = GL.renderbuffers[id];
        if (!renderbuffer) continue;
        GLctx.deleteRenderbuffer(renderbuffer);
        renderbuffer.name = 0;
        GL.renderbuffers[id] = null
    }
}
function _glDeleteShader(id) {
    if (!id) return;
    var shader = GL.shaders[id];
    if (!shader) {
        GL.recordError(1281);
        return
    }
    GLctx.deleteShader(shader);
    GL.shaders[id] = null
}
function _glDeleteTextures(n, textures) {
    for (var i = 0; i < n; i++) {
        var id = HEAP32[textures + i * 4 >> 2];
        var texture = GL.textures[id];
        if (!texture) continue;
        GLctx.deleteTexture(texture);
        texture.name = 0;
        GL.textures[id] = null
    }
}
function _glDepthFunc(x0) {
    GLctx["depthFunc"](x0)
}
function _glDepthMask(flag) {
    GLctx.depthMask( !! flag)
}
function _glDisable(x0) {
    GLctx["disable"](x0)
}
function _glDisableVertexAttribArray(index) {
    var cb = GL.currentContext.clientBuffers[index];
    cb.enabled = false;
    GLctx.disableVertexAttribArray(index)
}
function _glDrawElements(mode, count, type, indices) {
    var buf;
    if (!GL.currElementArrayBuffer) {
        var size = GL.calcBufLength(1, type, 0, count);
        buf = GL.getTempIndexBuffer(size);
        GLctx.bindBuffer(GLctx.ELEMENT_ARRAY_BUFFER, buf);
        GLctx.bufferSubData(GLctx.ELEMENT_ARRAY_BUFFER, 0, HEAPU8.subarray(indices, indices + size));
        indices = 0
    }
    GL.preDrawHandleClientVertexAttribBindings(count);
    GLctx.drawElements(mode, count, type, indices);
    GL.postDrawHandleClientVertexAttribBindings(count);
    if (!GL.currElementArrayBuffer) {
        GLctx.bindBuffer(GLctx.ELEMENT_ARRAY_BUFFER, null)
    }
}
function _glEnable(x0) {
    GLctx["enable"](x0)
}
function _glEnableVertexAttribArray(index) {
    var cb = GL.currentContext.clientBuffers[index];
    cb.enabled = true;
    GLctx.enableVertexAttribArray(index)
}
function _glFinish() {
    GLctx["finish"]()
}
function _glFramebufferRenderbuffer(target, attachment, renderbuffertarget, renderbuffer) {
    GLctx.framebufferRenderbuffer(target, attachment, renderbuffertarget, GL.renderbuffers[renderbuffer])
}
function _glFramebufferTexture2D(target, attachment, textarget, texture, level) {
    GLctx.framebufferTexture2D(target, attachment, textarget, GL.textures[texture], level)
}
function _glFrontFace(x0) {
    GLctx["frontFace"](x0)
}
function __glGenObject(n, buffers, createFunction, objectTable) {
    for (var i = 0; i < n; i++) {
        var buffer = GLctx[createFunction]();
        var id = buffer && GL.getNewId(objectTable);
        if (buffer) {
            buffer.name = id;
            objectTable[id] = buffer
        } else {
            GL.recordError(1282)
        }
        HEAP32[buffers + i * 4 >> 2] = id
    }
}
function _glGenBuffers(n, buffers) {
    __glGenObject(n, buffers, "createBuffer", GL.buffers)
}
function _glGenFramebuffers(n, ids) {
    __glGenObject(n, ids, "createFramebuffer", GL.framebuffers)
}
function _glGenRenderbuffers(n, renderbuffers) {
    __glGenObject(n, renderbuffers, "createRenderbuffer", GL.renderbuffers)
}
function _glGenTextures(n, textures) {
    __glGenObject(n, textures, "createTexture", GL.textures)
}
function _glGetAttachedShaders(program, maxCount, count, shaders) {
    var result = GLctx.getAttachedShaders(GL.programs[program]);
    var len = result.length;
    if (len > maxCount) {
        len = maxCount
    }
    HEAP32[count >> 2] = len;
    for (var i = 0; i < len; ++i) {
        var id = GL.shaders.indexOf(result[i]);
        HEAP32[shaders + i * 4 >> 2] = id
    }
}
function _glGetAttribLocation(program, name) {
    return GLctx.getAttribLocation(GL.programs[program], UTF8ToString(name))
}
function _glGetError() {
    var error = GLctx.getError() || GL.lastError;
    GL.lastError = 0;
    return error
}
function emscriptenWebGLGet(name_, p, type) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    var ret = undefined;
    switch (name_) {
        case 36346:
            ret = 1;
            break;
        case 36344:
            if (type != 0 && type != 1) {
                GL.recordError(1280)
            }
            return;
        case 36345:
            ret = 0;
            break;
        case 34466:
            var formats = GLctx.getParameter(34467);
            ret = formats ? formats.length: 0;
            break
    }
    if (ret === undefined) {
        var result = GLctx.getParameter(name_);
        switch (typeof result) {
            case "number":
                ret = result;
                break;
            case "boolean":
                ret = result ? 1 : 0;
                break;
            case "string":
                GL.recordError(1280);
                return;
            case "object":
                if (result === null) {
                    switch (name_) {
                        case 34964:
                        case 35725:
                        case 34965:
                        case 36006:
                        case 36007:
                        case 32873:
                        case 34229:
                        case 34068:
                        {
                            ret = 0;
                            break
                        }
                        default:
                        {
                            GL.recordError(1280);
                            return
                        }
                    }
                } else if (result instanceof Float32Array || result instanceof Uint32Array || result instanceof Int32Array || result instanceof Array) {
                    for (var i = 0; i < result.length; ++i) {
                        switch (type) {
                            case 0:
                                HEAP32[p + i * 4 >> 2] = result[i];
                                break;
                            case 2:
                                HEAPF32[p + i * 4 >> 2] = result[i];
                                break;
                            case 4:
                                HEAP8[p + i >> 0] = result[i] ? 1 : 0;
                                break
                        }
                    }
                    return
                } else {
                    try {
                        ret = result.name | 0
                    } catch(e) {
                        GL.recordError(1280);
                        err("GL_INVALID_ENUM in glGet" + type + "v: Unknown object returned from WebGL getParameter(" + name_ + ")! (error: " + e + ")");
                        return
                    }
                }
                break;
            default:
                GL.recordError(1280);
                err("GL_INVALID_ENUM in glGet" + type + "v: Native code calling glGet" + type + "v(" + name_ + ") and it returns " + result + " of type " + typeof result + "!");
                return
        }
    }
    switch (type) {
        case 1:
            tempI64 = [ret >>> 0, (tempDouble = ret, +Math_abs(tempDouble) >= 1 ? tempDouble > 0 ? (Math_min( + Math_floor(tempDouble / 4294967296), 4294967295) | 0) >>> 0 : ~~ + Math_ceil((tempDouble - +(~~tempDouble >>> 0)) / 4294967296) >>> 0 : 0)],
                HEAP32[p >> 2] = tempI64[0],
                HEAP32[p + 4 >> 2] = tempI64[1];
            break;
        case 0:
            HEAP32[p >> 2] = ret;
            break;
        case 2:
            HEAPF32[p >> 2] = ret;
            break;
        case 4:
            HEAP8[p >> 0] = ret ? 1 : 0;
            break
    }
}
function _glGetIntegerv(name_, p) {
    emscriptenWebGLGet(name_, p, 0)
}
function _glGetProgramInfoLog(program, maxLength, length, infoLog) {
    var log = GLctx.getProgramInfoLog(GL.programs[program]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}
function _glGetProgramiv(program, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (program >= GL.counter) {
        GL.recordError(1281);
        return
    }
    var ptable = GL.programInfos[program];
    if (!ptable) {
        GL.recordError(1282);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getProgramInfoLog(GL.programs[program]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35719) {
        HEAP32[p >> 2] = ptable.maxUniformLength
    } else if (pname == 35722) {
        if (ptable.maxAttributeLength == -1) {
            program = GL.programs[program];
            var numAttribs = GLctx.getProgramParameter(program, 35721);
            ptable.maxAttributeLength = 0;
            for (var i = 0; i < numAttribs; ++i) {
                var activeAttrib = GLctx.getActiveAttrib(program, i);
                ptable.maxAttributeLength = Math.max(ptable.maxAttributeLength, activeAttrib.name.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxAttributeLength
    } else if (pname == 35381) {
        if (ptable.maxUniformBlockNameLength == -1) {
            program = GL.programs[program];
            var numBlocks = GLctx.getProgramParameter(program, 35382);
            ptable.maxUniformBlockNameLength = 0;
            for (var i = 0; i < numBlocks; ++i) {
                var activeBlockName = GLctx.getActiveUniformBlockName(program, i);
                ptable.maxUniformBlockNameLength = Math.max(ptable.maxUniformBlockNameLength, activeBlockName.length + 1)
            }
        }
        HEAP32[p >> 2] = ptable.maxUniformBlockNameLength
    } else {
        HEAP32[p >> 2] = GLctx.getProgramParameter(GL.programs[program], pname)
    }
}
function _glGetShaderInfoLog(shader, maxLength, length, infoLog) {
    var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
    if (log === null) log = "(unknown error)";
    var numBytesWrittenExclNull = maxLength > 0 && infoLog ? stringToUTF8(log, infoLog, maxLength) : 0;
    if (length) HEAP32[length >> 2] = numBytesWrittenExclNull
}
function _glGetShaderiv(shader, pname, p) {
    if (!p) {
        GL.recordError(1281);
        return
    }
    if (pname == 35716) {
        var log = GLctx.getShaderInfoLog(GL.shaders[shader]);
        if (log === null) log = "(unknown error)";
        HEAP32[p >> 2] = log.length + 1
    } else if (pname == 35720) {
        var source = GLctx.getShaderSource(GL.shaders[shader]);
        var sourceLength = source === null || source.length == 0 ? 0 : source.length + 1;
        HEAP32[p >> 2] = sourceLength
    } else {
        HEAP32[p >> 2] = GLctx.getShaderParameter(GL.shaders[shader], pname)
    }
}
function stringToNewUTF8(jsString) {
    var length = lengthBytesUTF8(jsString) + 1;
    var cString = _malloc(length);
    stringToUTF8(jsString, cString, length);
    return cString
}
function _glGetString(name_) {
    if (GL.stringCache[name_]) return GL.stringCache[name_];
    var ret;
    switch (name_) {
        case 7939:
            var exts = GLctx.getSupportedExtensions() || [];
            exts = exts.concat(exts.map(function(e) {
                return "GL_" + e
            }));
            ret = stringToNewUTF8(exts.join(" "));
            break;
        case 7936:
        case 7937:
        case 37445:
        case 37446:
            var s = GLctx.getParameter(name_);
            if (!s) {
                GL.recordError(1280)
            }
            ret = stringToNewUTF8(s);
            break;
        case 7938:
            var glVersion = GLctx.getParameter(GLctx.VERSION); {
            glVersion = "OpenGL ES 2.0 (" + glVersion + ")"
        }
            ret = stringToNewUTF8(glVersion);
            break;
        case 35724:
            var glslVersion = GLctx.getParameter(GLctx.SHADING_LANGUAGE_VERSION);
            var ver_re = /^WebGL GLSL ES ([0-9]\.[0-9][0-9]?)(?:$| .*)/;
            var ver_num = glslVersion.match(ver_re);
            if (ver_num !== null) {
                if (ver_num[1].length == 3) ver_num[1] = ver_num[1] + "0";
                glslVersion = "OpenGL ES GLSL ES " + ver_num[1] + " (" + glslVersion + ")"
            }
            ret = stringToNewUTF8(glslVersion);
            break;
        default:
            GL.recordError(1280);
            return 0
    }
    GL.stringCache[name_] = ret;
    return ret
}
function _glGetUniformLocation(program, name) {
    name = UTF8ToString(name);
    var arrayIndex = 0;
    if (name[name.length - 1] == "]") {
        var leftBrace = name.lastIndexOf("[");
        arrayIndex = name[leftBrace + 1] != "]" ? parseInt(name.slice(leftBrace + 1)) : 0;
        name = name.slice(0, leftBrace)
    }
    var uniformInfo = GL.programInfos[program] && GL.programInfos[program].uniforms[name];
    if (uniformInfo && arrayIndex >= 0 && arrayIndex < uniformInfo[0]) {
        return uniformInfo[1] + arrayIndex
    } else {
        return - 1
    }
}
function _glIsProgram(program) {
    program = GL.programs[program];
    if (!program) return 0;
    return GLctx.isProgram(program)
}
function _glLinkProgram(program) {
    GLctx.linkProgram(GL.programs[program]);
    GL.populateUniformTable(program)
}
function _glPixelStorei(pname, param) {
    if (pname == 3317) {
        GL.unpackAlignment = param
    }
    GLctx.pixelStorei(pname, param)
}
function __computeUnpackAlignedImageSize(width, height, sizePerPixel, alignment) {
    function roundedToNextMultipleOf(x, y) {
        return x + y - 1 & -y
    }
    var plainRowSize = width * sizePerPixel;
    var alignedRowSize = roundedToNextMultipleOf(plainRowSize, alignment);
    return height * alignedRowSize
}
var __colorChannelsInGlTextureFormat = {
    6402 : 1,
    6406 : 1,
    6407 : 3,
    6408 : 4,
    6409 : 1,
    6410 : 2,
    35904 : 3,
    35906 : 4
};
var __sizeOfGlTextureElementType = {
    5121 : 1,
    5123 : 2,
    5125 : 4,
    5126 : 4,
    32819 : 2,
    32820 : 2,
    33635 : 2,
    34042 : 4,
    36193 : 2
};
function emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) {
    var sizePerPixel = __colorChannelsInGlTextureFormat[format] * __sizeOfGlTextureElementType[type];
    if (!sizePerPixel) {
        GL.recordError(1280);
        return
    }
    var bytes = __computeUnpackAlignedImageSize(width, height, sizePerPixel, GL.unpackAlignment);
    var end = pixels + bytes;
    switch (type) {
        case 5121:
            return HEAPU8.subarray(pixels, end);
        case 5126:
            return HEAPF32.subarray(pixels >> 2, end >> 2);
        case 5125:
        case 34042:
            return HEAPU32.subarray(pixels >> 2, end >> 2);
        case 5123:
        case 33635:
        case 32819:
        case 32820:
        case 36193:
            return HEAPU16.subarray(pixels >> 1, end >> 1);
        default:
            GL.recordError(1280)
    }
}
function _glReadPixels(x, y, width, height, format, type, pixels) {
    var pixelData = emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, format);
    if (!pixelData) {
        GL.recordError(1280);
        return
    }
    GLctx.readPixels(x, y, width, height, format, type, pixelData)
}
function _glRenderbufferStorage(x0, x1, x2, x3) {
    GLctx["renderbufferStorage"](x0, x1, x2, x3)
}
function _glShaderSource(shader, count, string, length) {
    var source = GL.getSource(shader, count, string, length);
    GLctx.shaderSource(GL.shaders[shader], source)
}
function _glStencilFuncSeparate(x0, x1, x2, x3) {
    GLctx["stencilFuncSeparate"](x0, x1, x2, x3)
}
function _glStencilMask(x0) {
    GLctx["stencilMask"](x0)
}
function _glStencilOpSeparate(x0, x1, x2, x3) {
    GLctx["stencilOpSeparate"](x0, x1, x2, x3)
}
function _glTexImage2D(target, level, internalFormat, width, height, border, format, type, pixels) {
    GLctx.texImage2D(target, level, internalFormat, width, height, border, format, type, pixels ? emscriptenWebGLGetTexPixelData(type, format, width, height, pixels, internalFormat) : null)
}
function _glTexParameteri(x0, x1, x2) {
    GLctx["texParameteri"](x0, x1, x2)
}
function _glUniform1f(location, v0) {
    GLctx.uniform1f(GL.uniforms[location], v0)
}
function _glUniform1fv(location, count, value) {
    if (count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[count - 1];
        for (var i = 0; i < count; ++i) {
            view[i] = HEAPF32[value + 4 * i >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 4 >> 2)
    }
    GLctx.uniform1fv(GL.uniforms[location], view)
}
function _glUniform1i(location, v0) {
    GLctx.uniform1i(GL.uniforms[location], v0)
}
function _glUniform2f(location, v0, v1) {
    GLctx.uniform2f(GL.uniforms[location], v0, v1)
}
function _glUniform3f(location, v0, v1, v2) {
    GLctx.uniform3f(GL.uniforms[location], v0, v1, v2)
}
function _glUniform3fv(location, count, value) {
    if (3 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[3 * count - 1];
        for (var i = 0; i < 3 * count; i += 3) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 12 >> 2)
    }
    GLctx.uniform3fv(GL.uniforms[location], view)
}
function _glUniform4f(location, v0, v1, v2, v3) {
    GLctx.uniform4f(GL.uniforms[location], v0, v1, v2, v3)
}
function _glUniform4fv(location, count, value) {
    if (4 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[4 * count - 1];
        for (var i = 0; i < 4 * count; i += 4) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 16 >> 2)
    }
    GLctx.uniform4fv(GL.uniforms[location], view)
}
function _glUniformMatrix4fv(location, count, transpose, value) {
    if (16 * count <= GL.MINI_TEMP_BUFFER_SIZE) {
        var view = GL.miniTempBufferViews[16 * count - 1];
        for (var i = 0; i < 16 * count; i += 16) {
            view[i] = HEAPF32[value + 4 * i >> 2];
            view[i + 1] = HEAPF32[value + (4 * i + 4) >> 2];
            view[i + 2] = HEAPF32[value + (4 * i + 8) >> 2];
            view[i + 3] = HEAPF32[value + (4 * i + 12) >> 2];
            view[i + 4] = HEAPF32[value + (4 * i + 16) >> 2];
            view[i + 5] = HEAPF32[value + (4 * i + 20) >> 2];
            view[i + 6] = HEAPF32[value + (4 * i + 24) >> 2];
            view[i + 7] = HEAPF32[value + (4 * i + 28) >> 2];
            view[i + 8] = HEAPF32[value + (4 * i + 32) >> 2];
            view[i + 9] = HEAPF32[value + (4 * i + 36) >> 2];
            view[i + 10] = HEAPF32[value + (4 * i + 40) >> 2];
            view[i + 11] = HEAPF32[value + (4 * i + 44) >> 2];
            view[i + 12] = HEAPF32[value + (4 * i + 48) >> 2];
            view[i + 13] = HEAPF32[value + (4 * i + 52) >> 2];
            view[i + 14] = HEAPF32[value + (4 * i + 56) >> 2];
            view[i + 15] = HEAPF32[value + (4 * i + 60) >> 2]
        }
    } else {
        var view = HEAPF32.subarray(value >> 2, value + count * 64 >> 2)
    }
    GLctx.uniformMatrix4fv(GL.uniforms[location], !!transpose, view)
}
function _glUseProgram(program) {
    GLctx.useProgram(GL.programs[program])
}
function _glValidateProgram(program) {
    GLctx.validateProgram(GL.programs[program])
}
function _glVertexAttrib1f(x0, x1) {
    GLctx["vertexAttrib1f"](x0, x1)
}
function _glVertexAttrib2f(x0, x1, x2) {
    GLctx["vertexAttrib2f"](x0, x1, x2)
}
function _glVertexAttrib3f(x0, x1, x2, x3) {
    GLctx["vertexAttrib3f"](x0, x1, x2, x3)
}
function _glVertexAttrib4f(x0, x1, x2, x3, x4) {
    GLctx["vertexAttrib4f"](x0, x1, x2, x3, x4)
}
function _glVertexAttribPointer(index, size, type, normalized, stride, ptr) {
    var cb = GL.currentContext.clientBuffers[index];
    if (!GL.currArrayBuffer) {
        cb.size = size;
        cb.type = type;
        cb.normalized = normalized;
        cb.stride = stride;
        cb.ptr = ptr;
        cb.clientside = true;
        cb.vertexAttribPointerAdaptor = function(index, size, type, normalized, stride, ptr) {
            this.vertexAttribPointer(index, size, type, normalized, stride, ptr)
        };
        return
    }
    cb.clientside = false;
    GLctx.vertexAttribPointer(index, size, type, !!normalized, stride, ptr)
}
function _glViewport(x0, x1, x2, x3) {
    GLctx["viewport"](x0, x1, x2, x3)
}
function _llvm_eh_typeid_for(type) {
    return type
}
var ___tm_current = 1222688;
var ___tm_timezone = (stringToUTF8("GMT", 1222736, 4), 1222736);
function _tzset() {
    if (_tzset.called) return;
    _tzset.called = true;
    HEAP32[__get_timezone() >> 2] = (new Date).getTimezoneOffset() * 60;
    var winter = new Date(2e3, 0, 1);
    var summer = new Date(2e3, 6, 1);
    HEAP32[__get_daylight() >> 2] = Number(winter.getTimezoneOffset() != summer.getTimezoneOffset());
    function extractZone(date) {
        var match = date.toTimeString().match(/\(([A-Za-z ]+)\)$/);
        return match ? match[1] : "GMT"
    }
    var winterName = extractZone(winter);
    var summerName = extractZone(summer);
    var winterNamePtr = allocate(intArrayFromString(winterName), "i8", ALLOC_NORMAL);
    var summerNamePtr = allocate(intArrayFromString(summerName), "i8", ALLOC_NORMAL);
    if (summer.getTimezoneOffset() < winter.getTimezoneOffset()) {
        HEAP32[__get_tzname() >> 2] = winterNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = summerNamePtr
    } else {
        HEAP32[__get_tzname() >> 2] = summerNamePtr;
        HEAP32[__get_tzname() + 4 >> 2] = winterNamePtr
    }
}
function _localtime_r(time, tmPtr) {
    _tzset();
    var date = new Date(HEAP32[time >> 2] * 1e3);
    HEAP32[tmPtr >> 2] = date.getSeconds();
    HEAP32[tmPtr + 4 >> 2] = date.getMinutes();
    HEAP32[tmPtr + 8 >> 2] = date.getHours();
    HEAP32[tmPtr + 12 >> 2] = date.getDate();
    HEAP32[tmPtr + 16 >> 2] = date.getMonth();
    HEAP32[tmPtr + 20 >> 2] = date.getFullYear() - 1900;
    HEAP32[tmPtr + 24 >> 2] = date.getDay();
    var start = new Date(date.getFullYear(), 0, 1);
    var yday = (date.getTime() - start.getTime()) / (1e3 * 60 * 60 * 24) | 0;
    HEAP32[tmPtr + 28 >> 2] = yday;
    HEAP32[tmPtr + 36 >> 2] = -(date.getTimezoneOffset() * 60);
    var summerOffset = new Date(2e3, 6, 1).getTimezoneOffset();
    var winterOffset = start.getTimezoneOffset();
    var dst = (summerOffset != winterOffset && date.getTimezoneOffset() == Math.min(winterOffset, summerOffset)) | 0;
    HEAP32[tmPtr + 32 >> 2] = dst;
    var zonePtr = HEAP32[__get_tzname() + (dst ? 4 : 0) >> 2];
    HEAP32[tmPtr + 40 >> 2] = zonePtr;
    return tmPtr
}
function _localtime(time) {
    return _localtime_r(time, ___tm_current)
}
function _pthread_cond_broadcast(x) {
    x = x | 0;
    return 0
}
function _pthread_cond_destroy() {
    return 0
}
function _pthread_cond_wait() {
    return 0
}
function _pthread_mutexattr_destroy() {}
function _pthread_mutexattr_init() {}
function _pthread_mutexattr_settype() {}
function _round(d) {
    d = +d;
    return d >= +0 ? +Math_floor(d + +.5) : +Math_ceil(d - +.5)
}
function _roundf(d) {
    d = +d;
    return d >= +0 ? +Math_floor(d + +.5) : +Math_ceil(d - +.5)
}
function abortOnCannotGrowMemory(requestedSize) {
    abort("OOM")
}
function emscripten_realloc_buffer(size) {
    try {
        wasmMemory.grow(size - buffer.byteLength + 65535 >> 16);
        updateGlobalBufferAndViews(wasmMemory.buffer);
        return 1
    } catch(e) {}
}
function _emscripten_resize_heap(requestedSize) {
    var oldSize = _emscripten_get_heap_size();
    var PAGE_MULTIPLE = 65536;
    var LIMIT = 2147483648 - PAGE_MULTIPLE;
    if (requestedSize > LIMIT) {
        return false
    }
    var MIN_TOTAL_MEMORY = 16777216;
    var newSize = Math.max(oldSize, MIN_TOTAL_MEMORY);
    while (newSize < requestedSize) {
        if (newSize <= 536870912) {
            newSize = alignUp(2 * newSize, PAGE_MULTIPLE)
        } else {
            newSize = Math.min(alignUp((3 * newSize + 2147483648) / 4, PAGE_MULTIPLE), LIMIT)
        }
    }
    var replacement = emscripten_realloc_buffer(newSize);
    if (!replacement) {
        return false
    }
    return true
}
function _sbrk(increment) {
    increment = increment | 0;
    var oldDynamicTop = 0;
    var newDynamicTop = 0;
    var totalMemory = 0;
    totalMemory = _emscripten_get_heap_size() | 0;
    oldDynamicTop = HEAP32[DYNAMICTOP_PTR >> 2] | 0;
    newDynamicTop = oldDynamicTop + increment | 0;
    if ((increment | 0) > 0 & (newDynamicTop | 0) < (oldDynamicTop | 0) | (newDynamicTop | 0) < 0) {
        abortOnCannotGrowMemory(newDynamicTop | 0) | 0;
        ___setErrNo(12);
        return - 1
    }
    if ((newDynamicTop | 0) > (totalMemory | 0)) {
        if (_emscripten_resize_heap(newDynamicTop | 0) | 0) {} else {
            ___setErrNo(12);
            return - 1
        }
    }
    HEAP32[DYNAMICTOP_PTR >> 2] = newDynamicTop | 0;
    return oldDynamicTop | 0
}
function _setTempRet0($i) {
    setTempRet0($i | 0)
}
function __isLeapYear(year) {
    return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
}
function __arraySum(array, index) {
    var sum = 0;
    for (var i = 0; i <= index; sum += array[i++]);
    return sum
}
var __MONTH_DAYS_LEAP = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
var __MONTH_DAYS_REGULAR = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
function __addDays(date, days) {
    var newDate = new Date(date.getTime());
    while (days > 0) {
        var leap = __isLeapYear(newDate.getFullYear());
        var currentMonth = newDate.getMonth();
        var daysInCurrentMonth = (leap ? __MONTH_DAYS_LEAP: __MONTH_DAYS_REGULAR)[currentMonth];
        if (days > daysInCurrentMonth - newDate.getDate()) {
            days -= daysInCurrentMonth - newDate.getDate() + 1;
            newDate.setDate(1);
            if (currentMonth < 11) {
                newDate.setMonth(currentMonth + 1)
            } else {
                newDate.setMonth(0);
                newDate.setFullYear(newDate.getFullYear() + 1)
            }
        } else {
            newDate.setDate(newDate.getDate() + days);
            return newDate
        }
    }
    return newDate
}
function _strftime(s, maxsize, format, tm) {
    var tm_zone = HEAP32[tm + 40 >> 2];
    var date = {
        tm_sec: HEAP32[tm >> 2],
        tm_min: HEAP32[tm + 4 >> 2],
        tm_hour: HEAP32[tm + 8 >> 2],
        tm_mday: HEAP32[tm + 12 >> 2],
        tm_mon: HEAP32[tm + 16 >> 2],
        tm_year: HEAP32[tm + 20 >> 2],
        tm_wday: HEAP32[tm + 24 >> 2],
        tm_yday: HEAP32[tm + 28 >> 2],
        tm_isdst: HEAP32[tm + 32 >> 2],
        tm_gmtoff: HEAP32[tm + 36 >> 2],
        tm_zone: tm_zone ? UTF8ToString(tm_zone) : ""
    };
    var pattern = UTF8ToString(format);
    var EXPANSION_RULES_1 = {
        "%c": "%a %b %d %H:%M:%S %Y",
        "%D": "%m/%d/%y",
        "%F": "%Y-%m-%d",
        "%h": "%b",
        "%r": "%I:%M:%S %p",
        "%R": "%H:%M",
        "%T": "%H:%M:%S",
        "%x": "%m/%d/%y",
        "%X": "%H:%M:%S",
        "%Ec": "%c",
        "%EC": "%C",
        "%Ex": "%m/%d/%y",
        "%EX": "%H:%M:%S",
        "%Ey": "%y",
        "%EY": "%Y",
        "%Od": "%d",
        "%Oe": "%e",
        "%OH": "%H",
        "%OI": "%I",
        "%Om": "%m",
        "%OM": "%M",
        "%OS": "%S",
        "%Ou": "%u",
        "%OU": "%U",
        "%OV": "%V",
        "%Ow": "%w",
        "%OW": "%W",
        "%Oy": "%y"
    };
    for (var rule in EXPANSION_RULES_1) {
        pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_1[rule])
    }
    var WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    function leadingSomething(value, digits, character) {
        var str = typeof value === "number" ? value.toString() : value || "";
        while (str.length < digits) {
            str = character[0] + str
        }
        return str
    }
    function leadingNulls(value, digits) {
        return leadingSomething(value, digits, "0")
    }
    function compareByDay(date1, date2) {
        function sgn(value) {
            return value < 0 ? -1 : value > 0 ? 1 : 0
        }
        var compare;
        if ((compare = sgn(date1.getFullYear() - date2.getFullYear())) === 0) {
            if ((compare = sgn(date1.getMonth() - date2.getMonth())) === 0) {
                compare = sgn(date1.getDate() - date2.getDate())
            }
        }
        return compare
    }
    function getFirstWeekStartDate(janFourth) {
        switch (janFourth.getDay()) {
            case 0:
                return new Date(janFourth.getFullYear() - 1, 11, 29);
            case 1:
                return janFourth;
            case 2:
                return new Date(janFourth.getFullYear(), 0, 3);
            case 3:
                return new Date(janFourth.getFullYear(), 0, 2);
            case 4:
                return new Date(janFourth.getFullYear(), 0, 1);
            case 5:
                return new Date(janFourth.getFullYear() - 1, 11, 31);
            case 6:
                return new Date(janFourth.getFullYear() - 1, 11, 30)
        }
    }
    function getWeekBasedYear(date) {
        var thisDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
        var janFourthThisYear = new Date(thisDate.getFullYear(), 0, 4);
        var janFourthNextYear = new Date(thisDate.getFullYear() + 1, 0, 4);
        var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
        var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
        if (compareByDay(firstWeekStartThisYear, thisDate) <= 0) {
            if (compareByDay(firstWeekStartNextYear, thisDate) <= 0) {
                return thisDate.getFullYear() + 1
            } else {
                return thisDate.getFullYear()
            }
        } else {
            return thisDate.getFullYear() - 1
        }
    }
    var EXPANSION_RULES_2 = {
        "%a": function(date) {
            return WEEKDAYS[date.tm_wday].substring(0, 3)
        },
        "%A": function(date) {
            return WEEKDAYS[date.tm_wday]
        },
        "%b": function(date) {
            return MONTHS[date.tm_mon].substring(0, 3)
        },
        "%B": function(date) {
            return MONTHS[date.tm_mon]
        },
        "%C": function(date) {
            var year = date.tm_year + 1900;
            return leadingNulls(year / 100 | 0, 2)
        },
        "%d": function(date) {
            return leadingNulls(date.tm_mday, 2)
        },
        "%e": function(date) {
            return leadingSomething(date.tm_mday, 2, " ")
        },
        "%g": function(date) {
            return getWeekBasedYear(date).toString().substring(2)
        },
        "%G": function(date) {
            return getWeekBasedYear(date)
        },
        "%H": function(date) {
            return leadingNulls(date.tm_hour, 2)
        },
        "%I": function(date) {
            var twelveHour = date.tm_hour;
            if (twelveHour == 0) twelveHour = 12;
            else if (twelveHour > 12) twelveHour -= 12;
            return leadingNulls(twelveHour, 2)
        },
        "%j": function(date) {
            return leadingNulls(date.tm_mday + __arraySum(__isLeapYear(date.tm_year + 1900) ? __MONTH_DAYS_LEAP: __MONTH_DAYS_REGULAR, date.tm_mon - 1), 3)
        },
        "%m": function(date) {
            return leadingNulls(date.tm_mon + 1, 2)
        },
        "%M": function(date) {
            return leadingNulls(date.tm_min, 2)
        },
        "%n": function() {
            return "\n"
        },
        "%p": function(date) {
            if (date.tm_hour >= 0 && date.tm_hour < 12) {
                return "AM"
            } else {
                return "PM"
            }
        },
        "%S": function(date) {
            return leadingNulls(date.tm_sec, 2)
        },
        "%t": function() {
            return "\t"
        },
        "%u": function(date) {
            return date.tm_wday || 7
        },
        "%U": function(date) {
            var janFirst = new Date(date.tm_year + 1900, 0, 1);
            var firstSunday = janFirst.getDay() === 0 ? janFirst: __addDays(janFirst, 7 - janFirst.getDay());
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstSunday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP: __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstSundayUntilEndJanuary = 31 - firstSunday.getDate();
                var days = firstSundayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstSunday, janFirst) === 0 ? "01": "00"
        },
        "%V": function(date) {
            var janFourthThisYear = new Date(date.tm_year + 1900, 0, 4);
            var janFourthNextYear = new Date(date.tm_year + 1901, 0, 4);
            var firstWeekStartThisYear = getFirstWeekStartDate(janFourthThisYear);
            var firstWeekStartNextYear = getFirstWeekStartDate(janFourthNextYear);
            var endDate = __addDays(new Date(date.tm_year + 1900, 0, 1), date.tm_yday);
            if (compareByDay(endDate, firstWeekStartThisYear) < 0) {
                return "53"
            }
            if (compareByDay(firstWeekStartNextYear, endDate) <= 0) {
                return "01"
            }
            var daysDifference;
            if (firstWeekStartThisYear.getFullYear() < date.tm_year + 1900) {
                daysDifference = date.tm_yday + 32 - firstWeekStartThisYear.getDate()
            } else {
                daysDifference = date.tm_yday + 1 - firstWeekStartThisYear.getDate()
            }
            return leadingNulls(Math.ceil(daysDifference / 7), 2)
        },
        "%w": function(date) {
            return date.tm_wday
        },
        "%W": function(date) {
            var janFirst = new Date(date.tm_year, 0, 1);
            var firstMonday = janFirst.getDay() === 1 ? janFirst: __addDays(janFirst, janFirst.getDay() === 0 ? 1 : 7 - janFirst.getDay() + 1);
            var endDate = new Date(date.tm_year + 1900, date.tm_mon, date.tm_mday);
            if (compareByDay(firstMonday, endDate) < 0) {
                var februaryFirstUntilEndMonth = __arraySum(__isLeapYear(endDate.getFullYear()) ? __MONTH_DAYS_LEAP: __MONTH_DAYS_REGULAR, endDate.getMonth() - 1) - 31;
                var firstMondayUntilEndJanuary = 31 - firstMonday.getDate();
                var days = firstMondayUntilEndJanuary + februaryFirstUntilEndMonth + endDate.getDate();
                return leadingNulls(Math.ceil(days / 7), 2)
            }
            return compareByDay(firstMonday, janFirst) === 0 ? "01": "00"
        },
        "%y": function(date) {
            return (date.tm_year + 1900).toString().substring(2)
        },
        "%Y": function(date) {
            return date.tm_year + 1900
        },
        "%z": function(date) {
            var off = date.tm_gmtoff;
            var ahead = off >= 0;
            off = Math.abs(off) / 60;
            off = off / 60 * 100 + off % 60;
            return (ahead ? "+": "-") + String("0000" + off).slice( - 4)
        },
        "%Z": function(date) {
            return date.tm_zone
        },
        "%%": function() {
            return "%"
        }
    };
    for (var rule in EXPANSION_RULES_2) {
        if (pattern.indexOf(rule) >= 0) {
            pattern = pattern.replace(new RegExp(rule, "g"), EXPANSION_RULES_2[rule](date))
        }
    }
    var bytes = intArrayFromString(pattern, false);
    if (bytes.length > maxsize) {
        return 0
    }
    writeArrayToMemory(bytes, s);
    return bytes.length - 1
}
function _strftime_l(s, maxsize, format, tm) {
    return _strftime(s, maxsize, format, tm)
}
function _time(ptr) {
    var ret = Date.now() / 1e3 | 0;
    if (ptr) {
        HEAP32[ptr >> 2] = ret
    }
    return ret
}
function _utime(path, times) {
    var time;
    if (times) {
        var offset = 4;
        time = HEAP32[times + offset >> 2];
        time *= 1e3
    } else {
        time = Date.now()
    }
    path = UTF8ToString(path);
    try {
        FS.utime(path, time, time);
        return 0
    } catch(e) {
        FS.handleFSError(e);
        return - 1
    }
}
FS.staticInit();
if (ENVIRONMENT_HAS_NODE) {
    var fs = require("fs");
    var NODEJS_PATH = require("path");
    NODEFS.staticInit()
}
init_emval();
PureVirtualError = Module["PureVirtualError"] = extendError(Error, "PureVirtualError");
embind_init_charCodes();
init_embind();
BindingError = Module["BindingError"] = extendError(Error, "BindingError");
InternalError = Module["InternalError"] = extendError(Error, "InternalError");
init_ClassHandle();
init_RegisteredPointer();
UnboundTypeError = Module["UnboundTypeError"] = extendError(Error, "UnboundTypeError");
if (ENVIRONMENT_IS_NODE) {
    _emscripten_get_now = function _emscripten_get_now_actual() {
        var t = process["hrtime"]();
        return t[0] * 1e3 + t[1] / 1e6
    }
} else if (typeof dateNow !== "undefined") {
    _emscripten_get_now = dateNow
} else if (typeof performance === "object" && performance && typeof performance["now"] === "function") {
    _emscripten_get_now = function() {
        return performance["now"]()
    }
} else {
    _emscripten_get_now = Date.now
}
Module["requestFullScreen"] = function Module_requestFullScreen(lockPointer, resizeCanvas, vrDevice) {
    err("Module.requestFullScreen is deprecated. Please call Module.requestFullscreen instead.");
    Module["requestFullScreen"] = Module["requestFullscreen"];
    Browser.requestFullScreen(lockPointer, resizeCanvas, vrDevice)
};
Module["requestFullscreen"] = function Module_requestFullscreen(lockPointer, resizeCanvas, vrDevice) {
    Browser.requestFullscreen(lockPointer, resizeCanvas, vrDevice)
};
Module["requestAnimationFrame"] = function Module_requestAnimationFrame(func) {
    Browser.requestAnimationFrame(func)
};
Module["setCanvasSize"] = function Module_setCanvasSize(width, height, noUpdates) {
    Browser.setCanvasSize(width, height, noUpdates)
};
Module["pauseMainLoop"] = function Module_pauseMainLoop() {
    Browser.mainLoop.pause()
};
Module["resumeMainLoop"] = function Module_resumeMainLoop() {
    Browser.mainLoop.resume()
};
Module["getUserMedia"] = function Module_getUserMedia() {
    Browser.getUserMedia()
};
Module["createContext"] = function Module_createContext(canvas, useWebGL, setInModule, webGLContextAttributes) {
    return Browser.createContext(canvas, useWebGL, setInModule, webGLContextAttributes)
};
var GLctx;
GL.init();
function intArrayFromString(stringy, dontAddNull, length) {
    var len = length > 0 ? length: lengthBytesUTF8(stringy) + 1;
    var u8array = new Array(len);
    var numBytesWritten = stringToUTF8Array(stringy, u8array, 0, u8array.length);
    if (dontAddNull) u8array.length = numBytesWritten;
    return u8array
}
var asmGlobalArg = {};
var asmLibraryArg = {
    "Md": ___buildEnvironment,
    "s": ___cxa_allocate_exception,
    "w": ___cxa_begin_catch,
    "Xd": ___cxa_current_primary_exception,
    "Sb": ___cxa_decrement_exception_refcount,
    "S": ___cxa_end_catch,
    "b": ___cxa_find_matching_catch_2,
    "j": ___cxa_find_matching_catch_3,
    "ca": ___cxa_find_matching_catch_4,
    "V": ___cxa_free_exception,
    "ic": ___cxa_get_exception_ptr,
    "Rb": ___cxa_increment_exception_refcount,
    "Hc": ___cxa_pure_virtual,
    "gc": ___cxa_rethrow,
    "Wd": ___cxa_rethrow_primary_exception,
    "R": ___cxa_throw,
    "Yd": ___cxa_uncaught_exceptions,
    "Tb": ___lock,
    "Vd": ___map_file,
    "d": ___resumeException,
    "ge": ___syscall140,
    "ee": ___syscall145,
    "ie": ___syscall195,
    "be": ___syscall20,
    "lb": ___syscall221,
    "ce": ___syscall33,
    "je": ___syscall5,
    "he": ___syscall54,
    "Ub": ___syscall6,
    "Ud": ___syscall91,
    "_a": ___unlock,
    "Qa": __embind_create_inheriting_constructor,
    "Mf": __embind_finalize_value_array,
    "Jc": __embind_finalize_value_object,
    "Qd": __embind_register_bool,
    "C": __embind_register_class,
    "la": __embind_register_class_class_function,
    "$": __embind_register_class_constructor,
    "m": __embind_register_class_function,
    "pa": __embind_register_constant,
    "Od": __embind_register_emval,
    "Q": __embind_register_enum,
    "u": __embind_register_enum_value,
    "Ob": __embind_register_float,
    "Mb": __embind_register_function,
    "Ba": __embind_register_integer,
    "wa": __embind_register_memory_view,
    "H": __embind_register_smart_ptr,
    "Pb": __embind_register_std_string,
    "Pd": __embind_register_std_wstring,
    "db": __embind_register_value_array,
    "Nf": __embind_register_value_array_element,
    "ba": __embind_register_value_object,
    "Kc": __embind_register_value_object_field,
    "Rd": __embind_register_void,
    "$b": __emval_call,
    "Lb": __emval_call_method,
    "K": __emval_call_void_method,
    "Sf": __emval_decref,
    "ye": __emval_get_method_caller,
    "F": __emval_incref,
    "zb": __emval_new_cstring,
    "Gc": __emval_not,
    "Ic": __emval_run_destructors,
    "fa": __emval_take_value,
    "Hb": _abort,
    "og": _atexit,
    "ae": _clock_gettime,
    "Gf": _dlclose,
    "Hf": _dlerror,
    "If": _dlopen,
    "ha": _emscripten_asm_const_dii,
    "P": _emscripten_asm_const_iii,
    "de": _emscripten_async_call,
    "qg": _emscripten_get_canvas_element_size,
    "ka": _emscripten_longjmp,
    "Nd": _emscripten_memcpy_big,
    "jc": _emscripten_run_script_int,
    "xg": _emscripten_set_click_callback_on_thread,
    "wg": _emscripten_set_dblclick_callback_on_thread,
    "sg": _emscripten_set_keydown_callback_on_thread,
    "tg": _emscripten_set_keypress_callback_on_thread,
    "rg": _emscripten_set_keyup_callback_on_thread,
    "hb": _emscripten_set_mousedown_callback_on_thread,
    "vg": _emscripten_set_mouseenter_callback_on_thread,
    "ug": _emscripten_set_mouseleave_callback_on_thread,
    "gb": _emscripten_set_mousemove_callback_on_thread,
    "fb": _emscripten_set_mouseup_callback_on_thread,
    "yc": _emscripten_set_touchcancel_callback_on_thread,
    "Ac": _emscripten_set_touchend_callback_on_thread,
    "zc": _emscripten_set_touchmove_callback_on_thread,
    "eb": _emscripten_set_touchstart_callback_on_thread,
    "yg": _emscripten_set_wheel_callback_on_thread,
    "ne": _emscripten_webgl_create_context,
    "ke": _emscripten_webgl_destroy_context,
    "le": _emscripten_webgl_enable_extension,
    "me": _emscripten_webgl_get_current_context,
    "oe": _emscripten_webgl_init_context_attributes,
    "Vb": _emscripten_webgl_make_context_current,
    "Xf": _exit,
    "fe": _fd_write,
    "a": _getTempRet0,
    "Wa": _getenv,
    "Wf": _gettimeofday,
    "Zb": _glActiveTexture,
    "Ce": _glAttachShader,
    "Ia": _glBindBuffer,
    "nf": _glBindFramebuffer,
    "ff": _glBindRenderbuffer,
    "_b": _glBindTexture,
    "sf": _glBlendColor,
    "tf": _glBlendFunc,
    "qb": _glBufferData,
    "bf": _glCheckFramebufferStatus,
    "Af": _glClear,
    "qf": _glClearColor,
    "pf": _glClearDepthf,
    "of": _glClearStencil,
    "uf": _glColorMask,
    "Fe": _glCompileShader,
    "Ie": _glCreateProgram,
    "He": _glCreateShader,
    "yf": _glCullFace,
    "Bf": _glDeleteBuffers,
    "af": _glDeleteFramebuffers,
    "Je": _glDeleteProgram,
    "$e": _glDeleteRenderbuffers,
    "Ke": _glDeleteShader,
    "ze": _glDeleteTextures,
    "vf": _glDepthFunc,
    "wf": _glDepthMask,
    "pb": _glDisable,
    "_e": _glDisableVertexAttribArray,
    "dc": _glDrawElements,
    "ob": _glEnable,
    "Ze": _glEnableVertexAttribArray,
    "zf": _glFinish,
    "df": _glFramebufferRenderbuffer,
    "cf": _glFramebufferTexture2D,
    "xf": _glFrontFace,
    "rb": _glGenBuffers,
    "mf": _glGenFramebuffers,
    "lf": _glGenRenderbuffers,
    "kf": _glGenTextures,
    "Le": _glGetAttachedShaders,
    "Ne": _glGetAttribLocation,
    "Cf": _glGetError,
    "Yb": _glGetIntegerv,
    "Ae": _glGetProgramInfoLog,
    "Oe": _glGetProgramiv,
    "De": _glGetShaderInfoLog,
    "Ee": _glGetShaderiv,
    "Xb": _glGetString,
    "ia": _glGetUniformLocation,
    "Me": _glIsProgram,
    "Be": _glLinkProgram,
    "jf": _glPixelStorei,
    "cc": _glReadPixels,
    "ef": _glRenderbufferStorage,
    "Ge": _glShaderSource,
    "nb": _glStencilFuncSeparate,
    "bc": _glStencilMask,
    "ac": _glStencilOpSeparate,
    "hf": _glTexImage2D,
    "gf": _glTexParameteri,
    "Ra": _glUniform1f,
    "Re": _glUniform1fv,
    "ua": _glUniform1i,
    "Eb": _glUniform2f,
    "Te": _glUniform3f,
    "Qe": _glUniform3fv,
    "Se": _glUniform4f,
    "ab": _glUniform4fv,
    "Sa": _glUniformMatrix4fv,
    "$a": _glUseProgram,
    "Pe": _glValidateProgram,
    "Xe": _glVertexAttrib1f,
    "We": _glVertexAttrib2f,
    "Ve": _glVertexAttrib3f,
    "Ue": _glVertexAttrib4f,
    "Ye": _glVertexAttribPointer,
    "rf": _glViewport,
    "A": invoke_di,
    "wb": invoke_did,
    "Ef": invoke_didi,
    "O": invoke_dii,
    "Ff": invoke_diid,
    "Z": invoke_diii,
    "tb": invoke_diiii,
    "id": invoke_dij,
    "y": invoke_fi,
    "wc": invoke_fifi,
    "xa": invoke_fii,
    "Ea": invoke_fiifi,
    "Cb": invoke_fiii,
    "t": invoke_i,
    "e": invoke_ii,
    "v": invoke_iid,
    "ya": invoke_iidd,
    "Va": invoke_iiddddddddd,
    "kg": invoke_iidddddddddddddddd,
    "ib": invoke_iidddddi,
    "sb": invoke_iiddiii,
    "ja": invoke_iidi,
    "pc": invoke_iidiii,
    "vd": invoke_iidj,
    "Xa": invoke_iif,
    "Lf": invoke_iifffffffff,
    "Yf": invoke_iiffi,
    "f": invoke_iii,
    "yb": invoke_iiid,
    "Oa": invoke_iiif,
    "Oc": invoke_iiifff,
    "Nc": invoke_iiiffff,
    "i": invoke_iiii,
    "vc": invoke_iiiid,
    "Ka": invoke_iiiiddiii,
    "ng": invoke_iiiif,
    "Tf": invoke_iiiifiiiii,
    "l": invoke_iiiii,
    "mb": invoke_iiiiid,
    "gg": invoke_iiiiidiiii,
    "Uf": invoke_iiiiifii,
    "Wb": invoke_iiiiifiiii,
    "ve": invoke_iiiiifiiiii,
    "p": invoke_iiiiii,
    "Ja": invoke_iiiiiid,
    "pe": invoke_iiiiiif,
    "Pf": invoke_iiiiiiffi,
    "Fc": invoke_iiiiiifi,
    "x": invoke_iiiiiii,
    "re": invoke_iiiiiiidfi,
    "Vf": invoke_iiiiiiiffffii,
    "E": invoke_iiiiiiii,
    "Y": invoke_iiiiiiiii,
    "W": invoke_iiiiiiiiii,
    "_": invoke_iiiiiiiiiii,
    "Fa": invoke_iiiiiiiiiiii,
    "Pa": invoke_iiiiiiiiiiiii,
    "Of": invoke_iiiiiiiiiiiiiiii,
    "Rc": invoke_iiiiiijiii,
    "Uc": invoke_iiiiiijiiiiiiii,
    "Pc": invoke_iiiiij,
    "ud": invoke_iiiij,
    "dd": invoke_iiiijiii,
    "Cd": invoke_iiij,
    "ed": invoke_iiiji,
    "ad": invoke_iiijjii,
    "Fd": invoke_iij,
    "Sc": invoke_iijf,
    "sd": invoke_iiji,
    "Wc": invoke_iijii,
    "Qc": invoke_iijiiifi,
    "Tc": invoke_iijiiii,
    "Yc": invoke_iijiiiii,
    "Xc": invoke_iijiiiiiiiiiiii,
    "Zc": invoke_iijji,
    "Jd": invoke_ji,
    "zd": invoke_jii,
    "fd": invoke_jiii,
    "td": invoke_jiiii,
    "Vc": invoke_jiiiifi,
    "od": invoke_jiiiii,
    "_c": invoke_jiiiiii,
    "nd": invoke_jiiiiiii,
    "md": invoke_jiiiiiiii,
    "o": invoke_v,
    "Kb": invoke_vdi,
    "g": invoke_vi,
    "D": invoke_vid,
    "Ga": invoke_vidd,
    "fc": invoke_viddd,
    "Qf": invoke_viddddddii,
    "oc": invoke_vidddi,
    "qc": invoke_vidddif,
    "rc": invoke_viddi,
    "ga": invoke_viddii,
    "Df": invoke_viddiii,
    "ec": invoke_viddiiiddd,
    "ra": invoke_vidi,
    "Ta": invoke_vidii,
    "M": invoke_vif,
    "bb": invoke_viff,
    "oa": invoke_vifff,
    "za": invoke_viffff,
    "Bb": invoke_viffffffiii,
    "Ec": invoke_viffffii,
    "Ma": invoke_viffffiii,
    "Rf": invoke_vifffii,
    "La": invoke_viffii,
    "hc": invoke_viffiiiiif,
    "mc": invoke_viffiiiiiif,
    "Gb": invoke_viffiiiiiii,
    "Ca": invoke_vifi,
    "Ab": invoke_vifii,
    "Ad": invoke_vifiij,
    "c": invoke_vii,
    "z": invoke_viid,
    "Ya": invoke_viidd,
    "sc": invoke_viiddd,
    "Kf": invoke_viidddd,
    "dg": invoke_viidddiiidd,
    "cb": invoke_viiddi,
    "bg": invoke_viiddidd,
    "eg": invoke_viiddiiidd,
    "Cc": invoke_viiddiiii,
    "ta": invoke_viidf,
    "cg": invoke_viididd,
    "_f": invoke_viidii,
    "aa": invoke_viif,
    "xe": invoke_viiff,
    "Nb": invoke_viifff,
    "Na": invoke_viiffff,
    "Lc": invoke_viiffffii,
    "Dc": invoke_viiffiii,
    "nc": invoke_viiffiiii,
    "ig": invoke_viifi,
    "Za": invoke_viifii,
    "lc": invoke_viifiii,
    "h": invoke_viii,
    "N": invoke_viiid,
    "tc": invoke_viiidd,
    "ag": invoke_viiidddd,
    "$f": invoke_viiiddddd,
    "fg": invoke_viiiddiidi,
    "te": invoke_viiidf,
    "da": invoke_viiidiii,
    "kc": invoke_viiidiiii,
    "T": invoke_viiif,
    "Zf": invoke_viiiff,
    "Bc": invoke_viiiffii,
    "jb": invoke_viiiffiii,
    "xb": invoke_viiifi,
    "Jb": invoke_viiifii,
    "ub": invoke_viiifiif,
    "Da": invoke_viiifiii,
    "va": invoke_viiifiiiii,
    "k": invoke_viiii,
    "se": invoke_viiiid,
    "Db": invoke_viiiidf,
    "hg": invoke_viiiidi,
    "uc": invoke_viiiidiiii,
    "Mc": invoke_viiiiff,
    "ue": invoke_viiiifi,
    "sa": invoke_viiiifii,
    "n": invoke_viiiii,
    "qe": invoke_viiiiidf,
    "lg": invoke_viiiiiffi,
    "na": invoke_viiiiifi,
    "Aa": invoke_viiiiifii,
    "q": invoke_viiiiii,
    "Bd": invoke_viiiiiif,
    "Ua": invoke_viiiiiiffffii,
    "Fb": invoke_viiiiiifi,
    "r": invoke_viiiiiii,
    "we": invoke_viiiiiiidi,
    "mg": invoke_viiiiiiiff,
    "I": invoke_viiiiiiii,
    "L": invoke_viiiiiiiii,
    "B": invoke_viiiiiiiiii,
    "jg": invoke_viiiiiiiiiiiff,
    "ma": invoke_viiiiiiiiiiii,
    "Ib": invoke_viiiiiiiiiiiii,
    "U": invoke_viiiiiiiiiiiiiii,
    "rd": invoke_viiiiijjiii,
    "Gd": invoke_viiiij,
    "Kd": invoke_viiiiji,
    "wd": invoke_viiiijj,
    "yd": invoke_viiij,
    "hd": invoke_viiiji,
    "Dd": invoke_viiijii,
    "Ed": invoke_viiijiii,
    "Ld": invoke_viij,
    "qd": invoke_viijff,
    "Id": invoke_viiji,
    "cd": invoke_viijii,
    "$c": invoke_viijij,
    "gd": invoke_viijjii,
    "xd": invoke_viijjiii,
    "Hd": invoke_vij,
    "pd": invoke_viji,
    "ld": invoke_vijii,
    "jd": invoke_vijiiiii,
    "kd": invoke_vijjii,
    "bd": invoke_vj,
    "X": _llvm_eh_typeid_for,
    "pg": _localtime,
    "_d": _pthread_cond_broadcast,
    "$d": _pthread_cond_destroy,
    "Zd": _pthread_cond_wait,
    "Qb": _pthread_mutexattr_destroy,
    "Td": _pthread_mutexattr_init,
    "Sd": _pthread_mutexattr_settype,
    "kb": _round,
    "ea": _roundf,
    "vb": _saveSetjmp,
    "Ha": _sbrk,
    "G": _setTempRet0,
    "qa": _strftime_l,
    "J": _testSetjmp,
    "xc": _time,
    "Jf": _utime
};
var asm = Module["asm"](asmGlobalArg, asmLibraryArg, buffer);
Module["asm"] = asm;
var ___wasm_call_ctors = Module["___wasm_call_ctors"] = function() {
    return Module["asm"]["zg"].apply(null, arguments)
};
var _malloc = Module["_malloc"] = function() {
    return Module["asm"]["Ag"].apply(null, arguments)
};
var _free = Module["_free"] = function() {
    return Module["asm"]["Bg"].apply(null, arguments)
};
var _realloc = Module["_realloc"] = function() {
    return Module["asm"]["Cg"].apply(null, arguments)
};
var ___errno_location = Module["___errno_location"] = function() {
    return Module["asm"]["Dg"].apply(null, arguments)
};
var __ZSt18uncaught_exceptionv = Module["__ZSt18uncaught_exceptionv"] = function() {
    return Module["asm"]["Eg"].apply(null, arguments)
};
var ___cxa_can_catch = Module["___cxa_can_catch"] = function() {
    return Module["asm"]["Fg"].apply(null, arguments)
};
var ___cxa_is_pointer_type = Module["___cxa_is_pointer_type"] = function() {
    return Module["asm"]["Gg"].apply(null, arguments)
};
var __get_tzname = Module["__get_tzname"] = function() {
    return Module["asm"]["Hg"].apply(null, arguments)
};
var __get_daylight = Module["__get_daylight"] = function() {
    return Module["asm"]["Ig"].apply(null, arguments)
};
var __get_timezone = Module["__get_timezone"] = function() {
    return Module["asm"]["Jg"].apply(null, arguments)
};
var ___getTypeName = Module["___getTypeName"] = function() {
    return Module["asm"]["Kg"].apply(null, arguments)
};
var ___embind_register_native_and_builtin_types = Module["___embind_register_native_and_builtin_types"] = function() {
    return Module["asm"]["Lg"].apply(null, arguments)
};
var _setThrew = Module["_setThrew"] = function() {
    return Module["asm"]["Mg"].apply(null, arguments)
};
var dynCall_di = Module["dynCall_di"] = function() {
    return Module["asm"]["Ng"].apply(null, arguments)
};
var dynCall_did = Module["dynCall_did"] = function() {
    return Module["asm"]["Og"].apply(null, arguments)
};
var dynCall_didi = Module["dynCall_didi"] = function() {
    return Module["asm"]["Pg"].apply(null, arguments)
};
var dynCall_dii = Module["dynCall_dii"] = function() {
    return Module["asm"]["Qg"].apply(null, arguments)
};
var dynCall_diid = Module["dynCall_diid"] = function() {
    return Module["asm"]["Rg"].apply(null, arguments)
};
var dynCall_diii = Module["dynCall_diii"] = function() {
    return Module["asm"]["Sg"].apply(null, arguments)
};
var dynCall_diiii = Module["dynCall_diiii"] = function() {
    return Module["asm"]["Tg"].apply(null, arguments)
};
var dynCall_dij = Module["dynCall_dij"] = function() {
    return Module["asm"]["Ug"].apply(null, arguments)
};
var dynCall_fi = Module["dynCall_fi"] = function() {
    return Module["asm"]["Vg"].apply(null, arguments)
};
var dynCall_fifi = Module["dynCall_fifi"] = function() {
    return Module["asm"]["Wg"].apply(null, arguments)
};
var dynCall_fii = Module["dynCall_fii"] = function() {
    return Module["asm"]["Xg"].apply(null, arguments)
};
var dynCall_fiifi = Module["dynCall_fiifi"] = function() {
    return Module["asm"]["Yg"].apply(null, arguments)
};
var dynCall_fiii = Module["dynCall_fiii"] = function() {
    return Module["asm"]["Zg"].apply(null, arguments)
};
var dynCall_i = Module["dynCall_i"] = function() {
    return Module["asm"]["_g"].apply(null, arguments)
};
var dynCall_ii = Module["dynCall_ii"] = function() {
    return Module["asm"]["$g"].apply(null, arguments)
};
var dynCall_iid = Module["dynCall_iid"] = function() {
    return Module["asm"]["ah"].apply(null, arguments)
};
var dynCall_iidd = Module["dynCall_iidd"] = function() {
    return Module["asm"]["bh"].apply(null, arguments)
};
var dynCall_iiddddddddd = Module["dynCall_iiddddddddd"] = function() {
    return Module["asm"]["ch"].apply(null, arguments)
};
var dynCall_iidddddddddddddddd = Module["dynCall_iidddddddddddddddd"] = function() {
    return Module["asm"]["dh"].apply(null, arguments)
};
var dynCall_iidddddi = Module["dynCall_iidddddi"] = function() {
    return Module["asm"]["eh"].apply(null, arguments)
};
var dynCall_iiddiii = Module["dynCall_iiddiii"] = function() {
    return Module["asm"]["fh"].apply(null, arguments)
};
var dynCall_iidi = Module["dynCall_iidi"] = function() {
    return Module["asm"]["gh"].apply(null, arguments)
};
var dynCall_iidiii = Module["dynCall_iidiii"] = function() {
    return Module["asm"]["hh"].apply(null, arguments)
};
var dynCall_iidj = Module["dynCall_iidj"] = function() {
    return Module["asm"]["ih"].apply(null, arguments)
};
var dynCall_iif = Module["dynCall_iif"] = function() {
    return Module["asm"]["jh"].apply(null, arguments)
};
var dynCall_iifffffffff = Module["dynCall_iifffffffff"] = function() {
    return Module["asm"]["kh"].apply(null, arguments)
};
var dynCall_iiffi = Module["dynCall_iiffi"] = function() {
    return Module["asm"]["lh"].apply(null, arguments)
};
var dynCall_iii = Module["dynCall_iii"] = function() {
    return Module["asm"]["mh"].apply(null, arguments)
};
var dynCall_iiid = Module["dynCall_iiid"] = function() {
    return Module["asm"]["nh"].apply(null, arguments)
};
var dynCall_iiif = Module["dynCall_iiif"] = function() {
    return Module["asm"]["oh"].apply(null, arguments)
};
var dynCall_iiifff = Module["dynCall_iiifff"] = function() {
    return Module["asm"]["ph"].apply(null, arguments)
};
var dynCall_iiiffff = Module["dynCall_iiiffff"] = function() {
    return Module["asm"]["qh"].apply(null, arguments)
};
var dynCall_iiii = Module["dynCall_iiii"] = function() {
    return Module["asm"]["rh"].apply(null, arguments)
};
var dynCall_iiiid = Module["dynCall_iiiid"] = function() {
    return Module["asm"]["sh"].apply(null, arguments)
};
var dynCall_iiiiddiii = Module["dynCall_iiiiddiii"] = function() {
    return Module["asm"]["th"].apply(null, arguments)
};
var dynCall_iiiif = Module["dynCall_iiiif"] = function() {
    return Module["asm"]["uh"].apply(null, arguments)
};
var dynCall_iiiifiiiii = Module["dynCall_iiiifiiiii"] = function() {
    return Module["asm"]["vh"].apply(null, arguments)
};
var dynCall_iiiii = Module["dynCall_iiiii"] = function() {
    return Module["asm"]["wh"].apply(null, arguments)
};
var dynCall_iiiiid = Module["dynCall_iiiiid"] = function() {
    return Module["asm"]["xh"].apply(null, arguments)
};
var dynCall_iiiiidiiii = Module["dynCall_iiiiidiiii"] = function() {
    return Module["asm"]["yh"].apply(null, arguments)
};
var dynCall_iiiiifii = Module["dynCall_iiiiifii"] = function() {
    return Module["asm"]["zh"].apply(null, arguments)
};
var dynCall_iiiiifiiii = Module["dynCall_iiiiifiiii"] = function() {
    return Module["asm"]["Ah"].apply(null, arguments)
};
var dynCall_iiiiifiiiii = Module["dynCall_iiiiifiiiii"] = function() {
    return Module["asm"]["Bh"].apply(null, arguments)
};
var dynCall_iiiiii = Module["dynCall_iiiiii"] = function() {
    return Module["asm"]["Ch"].apply(null, arguments)
};
var dynCall_iiiiiid = Module["dynCall_iiiiiid"] = function() {
    return Module["asm"]["Dh"].apply(null, arguments)
};
var dynCall_iiiiiif = Module["dynCall_iiiiiif"] = function() {
    return Module["asm"]["Eh"].apply(null, arguments)
};
var dynCall_iiiiiiffi = Module["dynCall_iiiiiiffi"] = function() {
    return Module["asm"]["Fh"].apply(null, arguments)
};
var dynCall_iiiiiifi = Module["dynCall_iiiiiifi"] = function() {
    return Module["asm"]["Gh"].apply(null, arguments)
};
var dynCall_iiiiiii = Module["dynCall_iiiiiii"] = function() {
    return Module["asm"]["Hh"].apply(null, arguments)
};
var dynCall_iiiiiiidfi = Module["dynCall_iiiiiiidfi"] = function() {
    return Module["asm"]["Ih"].apply(null, arguments)
};
var dynCall_iiiiiiiffffii = Module["dynCall_iiiiiiiffffii"] = function() {
    return Module["asm"]["Jh"].apply(null, arguments)
};
var dynCall_iiiiiiii = Module["dynCall_iiiiiiii"] = function() {
    return Module["asm"]["Kh"].apply(null, arguments)
};
var dynCall_iiiiiiiii = Module["dynCall_iiiiiiiii"] = function() {
    return Module["asm"]["Lh"].apply(null, arguments)
};
var dynCall_iiiiiiiiii = Module["dynCall_iiiiiiiiii"] = function() {
    return Module["asm"]["Mh"].apply(null, arguments)
};
var dynCall_iiiiiiiiiii = Module["dynCall_iiiiiiiiiii"] = function() {
    return Module["asm"]["Nh"].apply(null, arguments)
};
var dynCall_iiiiiiiiiiii = Module["dynCall_iiiiiiiiiiii"] = function() {
    return Module["asm"]["Oh"].apply(null, arguments)
};
var dynCall_iiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiii"] = function() {
    return Module["asm"]["Ph"].apply(null, arguments)
};
var dynCall_iiiiiiiiiiiiiiii = Module["dynCall_iiiiiiiiiiiiiiii"] = function() {
    return Module["asm"]["Qh"].apply(null, arguments)
};
var dynCall_iiiiiijiii = Module["dynCall_iiiiiijiii"] = function() {
    return Module["asm"]["Rh"].apply(null, arguments)
};
var dynCall_iiiiiijiiiiiiii = Module["dynCall_iiiiiijiiiiiiii"] = function() {
    return Module["asm"]["Sh"].apply(null, arguments)
};
var dynCall_iiiiij = Module["dynCall_iiiiij"] = function() {
    return Module["asm"]["Th"].apply(null, arguments)
};
var dynCall_iiiij = Module["dynCall_iiiij"] = function() {
    return Module["asm"]["Uh"].apply(null, arguments)
};
var dynCall_iiiijiii = Module["dynCall_iiiijiii"] = function() {
    return Module["asm"]["Vh"].apply(null, arguments)
};
var dynCall_iiij = Module["dynCall_iiij"] = function() {
    return Module["asm"]["Wh"].apply(null, arguments)
};
var dynCall_iiiji = Module["dynCall_iiiji"] = function() {
    return Module["asm"]["Xh"].apply(null, arguments)
};
var dynCall_iiijjii = Module["dynCall_iiijjii"] = function() {
    return Module["asm"]["Yh"].apply(null, arguments)
};
var dynCall_iij = Module["dynCall_iij"] = function() {
    return Module["asm"]["Zh"].apply(null, arguments)
};
var dynCall_iijf = Module["dynCall_iijf"] = function() {
    return Module["asm"]["_h"].apply(null, arguments)
};
var dynCall_iiji = Module["dynCall_iiji"] = function() {
    return Module["asm"]["$h"].apply(null, arguments)
};
var dynCall_iijii = Module["dynCall_iijii"] = function() {
    return Module["asm"]["ai"].apply(null, arguments)
};
var dynCall_iijiiifi = Module["dynCall_iijiiifi"] = function() {
    return Module["asm"]["bi"].apply(null, arguments)
};
var dynCall_iijiiii = Module["dynCall_iijiiii"] = function() {
    return Module["asm"]["ci"].apply(null, arguments)
};
var dynCall_iijiiiii = Module["dynCall_iijiiiii"] = function() {
    return Module["asm"]["di"].apply(null, arguments)
};
var dynCall_iijiiiiiiiiiiii = Module["dynCall_iijiiiiiiiiiiii"] = function() {
    return Module["asm"]["ei"].apply(null, arguments)
};
var dynCall_iijji = Module["dynCall_iijji"] = function() {
    return Module["asm"]["fi"].apply(null, arguments)
};
var dynCall_ji = Module["dynCall_ji"] = function() {
    return Module["asm"]["gi"].apply(null, arguments)
};
var dynCall_jii = Module["dynCall_jii"] = function() {
    return Module["asm"]["hi"].apply(null, arguments)
};
var dynCall_jiii = Module["dynCall_jiii"] = function() {
    return Module["asm"]["ii"].apply(null, arguments)
};
var dynCall_jiiii = Module["dynCall_jiiii"] = function() {
    return Module["asm"]["ji"].apply(null, arguments)
};
var dynCall_jiiiifi = Module["dynCall_jiiiifi"] = function() {
    return Module["asm"]["ki"].apply(null, arguments)
};
var dynCall_jiiiii = Module["dynCall_jiiiii"] = function() {
    return Module["asm"]["li"].apply(null, arguments)
};
var dynCall_jiiiiii = Module["dynCall_jiiiiii"] = function() {
    return Module["asm"]["mi"].apply(null, arguments)
};
var dynCall_jiiiiiii = Module["dynCall_jiiiiiii"] = function() {
    return Module["asm"]["ni"].apply(null, arguments)
};
var dynCall_jiiiiiiii = Module["dynCall_jiiiiiiii"] = function() {
    return Module["asm"]["oi"].apply(null, arguments)
};
var dynCall_v = Module["dynCall_v"] = function() {
    return Module["asm"]["pi"].apply(null, arguments)
};
var dynCall_vdi = Module["dynCall_vdi"] = function() {
    return Module["asm"]["qi"].apply(null, arguments)
};
var dynCall_vi = Module["dynCall_vi"] = function() {
    return Module["asm"]["ri"].apply(null, arguments)
};
var dynCall_vid = Module["dynCall_vid"] = function() {
    return Module["asm"]["si"].apply(null, arguments)
};
var dynCall_vidd = Module["dynCall_vidd"] = function() {
    return Module["asm"]["ti"].apply(null, arguments)
};
var dynCall_viddd = Module["dynCall_viddd"] = function() {
    return Module["asm"]["ui"].apply(null, arguments)
};
var dynCall_viddddddii = Module["dynCall_viddddddii"] = function() {
    return Module["asm"]["vi"].apply(null, arguments)
};
var dynCall_vidddi = Module["dynCall_vidddi"] = function() {
    return Module["asm"]["wi"].apply(null, arguments)
};
var dynCall_vidddif = Module["dynCall_vidddif"] = function() {
    return Module["asm"]["xi"].apply(null, arguments)
};
var dynCall_viddi = Module["dynCall_viddi"] = function() {
    return Module["asm"]["yi"].apply(null, arguments)
};
var dynCall_viddii = Module["dynCall_viddii"] = function() {
    return Module["asm"]["zi"].apply(null, arguments)
};
var dynCall_viddiii = Module["dynCall_viddiii"] = function() {
    return Module["asm"]["Ai"].apply(null, arguments)
};
var dynCall_viddiiiddd = Module["dynCall_viddiiiddd"] = function() {
    return Module["asm"]["Bi"].apply(null, arguments)
};
var dynCall_vidi = Module["dynCall_vidi"] = function() {
    return Module["asm"]["Ci"].apply(null, arguments)
};
var dynCall_vidii = Module["dynCall_vidii"] = function() {
    return Module["asm"]["Di"].apply(null, arguments)
};
var dynCall_vif = Module["dynCall_vif"] = function() {
    return Module["asm"]["Ei"].apply(null, arguments)
};
var dynCall_viff = Module["dynCall_viff"] = function() {
    return Module["asm"]["Fi"].apply(null, arguments)
};
var dynCall_vifff = Module["dynCall_vifff"] = function() {
    return Module["asm"]["Gi"].apply(null, arguments)
};
var dynCall_viffff = Module["dynCall_viffff"] = function() {
    return Module["asm"]["Hi"].apply(null, arguments)
};
var dynCall_viffffffiii = Module["dynCall_viffffffiii"] = function() {
    return Module["asm"]["Ii"].apply(null, arguments)
};
var dynCall_viffffii = Module["dynCall_viffffii"] = function() {
    return Module["asm"]["Ji"].apply(null, arguments)
};
var dynCall_viffffiii = Module["dynCall_viffffiii"] = function() {
    return Module["asm"]["Ki"].apply(null, arguments)
};
var dynCall_vifffii = Module["dynCall_vifffii"] = function() {
    return Module["asm"]["Li"].apply(null, arguments)
};
var dynCall_viffii = Module["dynCall_viffii"] = function() {
    return Module["asm"]["Mi"].apply(null, arguments)
};
var dynCall_viffiiiiif = Module["dynCall_viffiiiiif"] = function() {
    return Module["asm"]["Ni"].apply(null, arguments)
};
var dynCall_viffiiiiiif = Module["dynCall_viffiiiiiif"] = function() {
    return Module["asm"]["Oi"].apply(null, arguments)
};
var dynCall_viffiiiiiii = Module["dynCall_viffiiiiiii"] = function() {
    return Module["asm"]["Pi"].apply(null, arguments)
};
var dynCall_vifi = Module["dynCall_vifi"] = function() {
    return Module["asm"]["Qi"].apply(null, arguments)
};
var dynCall_vifii = Module["dynCall_vifii"] = function() {
    return Module["asm"]["Ri"].apply(null, arguments)
};
var dynCall_vifiij = Module["dynCall_vifiij"] = function() {
    return Module["asm"]["Si"].apply(null, arguments)
};
var dynCall_vii = Module["dynCall_vii"] = function() {
    return Module["asm"]["Ti"].apply(null, arguments)
};
var dynCall_viid = Module["dynCall_viid"] = function() {
    return Module["asm"]["Ui"].apply(null, arguments)
};
var dynCall_viidd = Module["dynCall_viidd"] = function() {
    return Module["asm"]["Vi"].apply(null, arguments)
};
var dynCall_viiddd = Module["dynCall_viiddd"] = function() {
    return Module["asm"]["Wi"].apply(null, arguments)
};
var dynCall_viidddd = Module["dynCall_viidddd"] = function() {
    return Module["asm"]["Xi"].apply(null, arguments)
};
var dynCall_viidddiiidd = Module["dynCall_viidddiiidd"] = function() {
    return Module["asm"]["Yi"].apply(null, arguments)
};
var dynCall_viiddi = Module["dynCall_viiddi"] = function() {
    return Module["asm"]["Zi"].apply(null, arguments)
};
var dynCall_viiddidd = Module["dynCall_viiddidd"] = function() {
    return Module["asm"]["_i"].apply(null, arguments)
};
var dynCall_viiddiiidd = Module["dynCall_viiddiiidd"] = function() {
    return Module["asm"]["$i"].apply(null, arguments)
};
var dynCall_viiddiiii = Module["dynCall_viiddiiii"] = function() {
    return Module["asm"]["aj"].apply(null, arguments)
};
var dynCall_viidf = Module["dynCall_viidf"] = function() {
    return Module["asm"]["bj"].apply(null, arguments)
};
var dynCall_viididd = Module["dynCall_viididd"] = function() {
    return Module["asm"]["cj"].apply(null, arguments)
};
var dynCall_viidii = Module["dynCall_viidii"] = function() {
    return Module["asm"]["dj"].apply(null, arguments)
};
var dynCall_viif = Module["dynCall_viif"] = function() {
    return Module["asm"]["ej"].apply(null, arguments)
};
var dynCall_viiff = Module["dynCall_viiff"] = function() {
    return Module["asm"]["fj"].apply(null, arguments)
};
var dynCall_viifff = Module["dynCall_viifff"] = function() {
    return Module["asm"]["gj"].apply(null, arguments)
};
var dynCall_viiffff = Module["dynCall_viiffff"] = function() {
    return Module["asm"]["hj"].apply(null, arguments)
};
var dynCall_viiffffii = Module["dynCall_viiffffii"] = function() {
    return Module["asm"]["ij"].apply(null, arguments)
};
var dynCall_viiffiii = Module["dynCall_viiffiii"] = function() {
    return Module["asm"]["jj"].apply(null, arguments)
};
var dynCall_viiffiiii = Module["dynCall_viiffiiii"] = function() {
    return Module["asm"]["kj"].apply(null, arguments)
};
var dynCall_viifi = Module["dynCall_viifi"] = function() {
    return Module["asm"]["lj"].apply(null, arguments)
};
var dynCall_viifii = Module["dynCall_viifii"] = function() {
    return Module["asm"]["mj"].apply(null, arguments)
};
var dynCall_viifiii = Module["dynCall_viifiii"] = function() {
    return Module["asm"]["nj"].apply(null, arguments)
};
var dynCall_viii = Module["dynCall_viii"] = function() {
    return Module["asm"]["oj"].apply(null, arguments)
};
var dynCall_viiid = Module["dynCall_viiid"] = function() {
    return Module["asm"]["pj"].apply(null, arguments)
};
var dynCall_viiidd = Module["dynCall_viiidd"] = function() {
    return Module["asm"]["qj"].apply(null, arguments)
};
var dynCall_viiidddd = Module["dynCall_viiidddd"] = function() {
    return Module["asm"]["rj"].apply(null, arguments)
};
var dynCall_viiiddddd = Module["dynCall_viiiddddd"] = function() {
    return Module["asm"]["sj"].apply(null, arguments)
};
var dynCall_viiiddiidi = Module["dynCall_viiiddiidi"] = function() {
    return Module["asm"]["tj"].apply(null, arguments)
};
var dynCall_viiidf = Module["dynCall_viiidf"] = function() {
    return Module["asm"]["uj"].apply(null, arguments)
};
var dynCall_viiidiii = Module["dynCall_viiidiii"] = function() {
    return Module["asm"]["vj"].apply(null, arguments)
};
var dynCall_viiidiiii = Module["dynCall_viiidiiii"] = function() {
    return Module["asm"]["wj"].apply(null, arguments)
};
var dynCall_viiif = Module["dynCall_viiif"] = function() {
    return Module["asm"]["xj"].apply(null, arguments)
};
var dynCall_viiiff = Module["dynCall_viiiff"] = function() {
    return Module["asm"]["yj"].apply(null, arguments)
};
var dynCall_viiiffii = Module["dynCall_viiiffii"] = function() {
    return Module["asm"]["zj"].apply(null, arguments)
};
var dynCall_viiiffiii = Module["dynCall_viiiffiii"] = function() {
    return Module["asm"]["Aj"].apply(null, arguments)
};
var dynCall_viiifi = Module["dynCall_viiifi"] = function() {
    return Module["asm"]["Bj"].apply(null, arguments)
};
var dynCall_viiifii = Module["dynCall_viiifii"] = function() {
    return Module["asm"]["Cj"].apply(null, arguments)
};
var dynCall_viiifiif = Module["dynCall_viiifiif"] = function() {
    return Module["asm"]["Dj"].apply(null, arguments)
};
var dynCall_viiifiii = Module["dynCall_viiifiii"] = function() {
    return Module["asm"]["Ej"].apply(null, arguments)
};
var dynCall_viiifiiiii = Module["dynCall_viiifiiiii"] = function() {
    return Module["asm"]["Fj"].apply(null, arguments)
};
var dynCall_viiii = Module["dynCall_viiii"] = function() {
    return Module["asm"]["Gj"].apply(null, arguments)
};
var dynCall_viiiid = Module["dynCall_viiiid"] = function() {
    return Module["asm"]["Hj"].apply(null, arguments)
};
var dynCall_viiiidf = Module["dynCall_viiiidf"] = function() {
    return Module["asm"]["Ij"].apply(null, arguments)
};
var dynCall_viiiidi = Module["dynCall_viiiidi"] = function() {
    return Module["asm"]["Jj"].apply(null, arguments)
};
var dynCall_viiiidiiii = Module["dynCall_viiiidiiii"] = function() {
    return Module["asm"]["Kj"].apply(null, arguments)
};
var dynCall_viiiiff = Module["dynCall_viiiiff"] = function() {
    return Module["asm"]["Lj"].apply(null, arguments)
};
var dynCall_viiiifi = Module["dynCall_viiiifi"] = function() {
    return Module["asm"]["Mj"].apply(null, arguments)
};
var dynCall_viiiifii = Module["dynCall_viiiifii"] = function() {
    return Module["asm"]["Nj"].apply(null, arguments)
};
var dynCall_viiiii = Module["dynCall_viiiii"] = function() {
    return Module["asm"]["Oj"].apply(null, arguments)
};
var dynCall_viiiiidf = Module["dynCall_viiiiidf"] = function() {
    return Module["asm"]["Pj"].apply(null, arguments)
};
var dynCall_viiiiiffi = Module["dynCall_viiiiiffi"] = function() {
    return Module["asm"]["Qj"].apply(null, arguments)
};
var dynCall_viiiiifi = Module["dynCall_viiiiifi"] = function() {
    return Module["asm"]["Rj"].apply(null, arguments)
};
var dynCall_viiiiifii = Module["dynCall_viiiiifii"] = function() {
    return Module["asm"]["Sj"].apply(null, arguments)
};
var dynCall_viiiiii = Module["dynCall_viiiiii"] = function() {
    return Module["asm"]["Tj"].apply(null, arguments)
};
var dynCall_viiiiiif = Module["dynCall_viiiiiif"] = function() {
    return Module["asm"]["Uj"].apply(null, arguments)
};
var dynCall_viiiiiiffffii = Module["dynCall_viiiiiiffffii"] = function() {
    return Module["asm"]["Vj"].apply(null, arguments)
};
var dynCall_viiiiiifi = Module["dynCall_viiiiiifi"] = function() {
    return Module["asm"]["Wj"].apply(null, arguments)
};
var dynCall_viiiiiii = Module["dynCall_viiiiiii"] = function() {
    return Module["asm"]["Xj"].apply(null, arguments)
};
var dynCall_viiiiiiidi = Module["dynCall_viiiiiiidi"] = function() {
    return Module["asm"]["Yj"].apply(null, arguments)
};
var dynCall_viiiiiiiff = Module["dynCall_viiiiiiiff"] = function() {
    return Module["asm"]["Zj"].apply(null, arguments)
};
var dynCall_viiiiiiii = Module["dynCall_viiiiiiii"] = function() {
    return Module["asm"]["_j"].apply(null, arguments)
};
var dynCall_viiiiiiiii = Module["dynCall_viiiiiiiii"] = function() {
    return Module["asm"]["$j"].apply(null, arguments)
};
var dynCall_viiiiiiiiii = Module["dynCall_viiiiiiiiii"] = function() {
    return Module["asm"]["ak"].apply(null, arguments)
};
var dynCall_viiiiiiiiiiiff = Module["dynCall_viiiiiiiiiiiff"] = function() {
    return Module["asm"]["bk"].apply(null, arguments)
};
var dynCall_viiiiiiiiiiii = Module["dynCall_viiiiiiiiiiii"] = function() {
    return Module["asm"]["ck"].apply(null, arguments)
};
var dynCall_viiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiii"] = function() {
    return Module["asm"]["dk"].apply(null, arguments)
};
var dynCall_viiiiiiiiiiiiiii = Module["dynCall_viiiiiiiiiiiiiii"] = function() {
    return Module["asm"]["ek"].apply(null, arguments)
};
var dynCall_viiiiijjiii = Module["dynCall_viiiiijjiii"] = function() {
    return Module["asm"]["fk"].apply(null, arguments)
};
var dynCall_viiiij = Module["dynCall_viiiij"] = function() {
    return Module["asm"]["gk"].apply(null, arguments)
};
var dynCall_viiiiji = Module["dynCall_viiiiji"] = function() {
    return Module["asm"]["hk"].apply(null, arguments)
};
var dynCall_viiiijj = Module["dynCall_viiiijj"] = function() {
    return Module["asm"]["ik"].apply(null, arguments)
};
var dynCall_viiij = Module["dynCall_viiij"] = function() {
    return Module["asm"]["jk"].apply(null, arguments)
};
var dynCall_viiiji = Module["dynCall_viiiji"] = function() {
    return Module["asm"]["kk"].apply(null, arguments)
};
var dynCall_viiijii = Module["dynCall_viiijii"] = function() {
    return Module["asm"]["lk"].apply(null, arguments)
};
var dynCall_viiijiii = Module["dynCall_viiijiii"] = function() {
    return Module["asm"]["mk"].apply(null, arguments)
};
var dynCall_viij = Module["dynCall_viij"] = function() {
    return Module["asm"]["nk"].apply(null, arguments)
};
var dynCall_viijff = Module["dynCall_viijff"] = function() {
    return Module["asm"]["ok"].apply(null, arguments)
};
var dynCall_viiji = Module["dynCall_viiji"] = function() {
    return Module["asm"]["pk"].apply(null, arguments)
};
var dynCall_viijii = Module["dynCall_viijii"] = function() {
    return Module["asm"]["qk"].apply(null, arguments)
};
var dynCall_viijij = Module["dynCall_viijij"] = function() {
    return Module["asm"]["rk"].apply(null, arguments)
};
var dynCall_viijjii = Module["dynCall_viijjii"] = function() {
    return Module["asm"]["sk"].apply(null, arguments)
};
var dynCall_viijjiii = Module["dynCall_viijjiii"] = function() {
    return Module["asm"]["tk"].apply(null, arguments)
};
var dynCall_vij = Module["dynCall_vij"] = function() {
    return Module["asm"]["uk"].apply(null, arguments)
};
var dynCall_viji = Module["dynCall_viji"] = function() {
    return Module["asm"]["vk"].apply(null, arguments)
};
var dynCall_vijii = Module["dynCall_vijii"] = function() {
    return Module["asm"]["wk"].apply(null, arguments)
};
var dynCall_vijiiiii = Module["dynCall_vijiiiii"] = function() {
    return Module["asm"]["xk"].apply(null, arguments)
};
var dynCall_vijjii = Module["dynCall_vijjii"] = function() {
    return Module["asm"]["yk"].apply(null, arguments)
};
var dynCall_vj = Module["dynCall_vj"] = function() {
    return Module["asm"]["zk"].apply(null, arguments)
};
var stackSave = Module["stackSave"] = function() {
    return Module["asm"]["Ak"].apply(null, arguments)
};
var stackAlloc = Module["stackAlloc"] = function() {
    return Module["asm"]["Bk"].apply(null, arguments)
};
var stackRestore = Module["stackRestore"] = function() {
    return Module["asm"]["Ck"].apply(null, arguments)
};
var dynCall_viiffffff = Module["dynCall_viiffffff"] = function() {
    return Module["asm"]["Dk"].apply(null, arguments)
};
var dynCall_viifffffffff = Module["dynCall_viifffffffff"] = function() {
    return Module["asm"]["Ek"].apply(null, arguments)
};
var dynCall_viffffff = Module["dynCall_viffffff"] = function() {
    return Module["asm"]["Fk"].apply(null, arguments)
};
var dynCall_vifffffffff = Module["dynCall_vifffffffff"] = function() {
    return Module["asm"]["Gk"].apply(null, arguments)
};
var dynCall_iiiifff = Module["dynCall_iiiifff"] = function() {
    return Module["asm"]["Hk"].apply(null, arguments)
};
var dynCall_iiiiffff = Module["dynCall_iiiiffff"] = function() {
    return Module["asm"]["Ik"].apply(null, arguments)
};
var dynCall_viiiiiff = Module["dynCall_viiiiiff"] = function() {
    return Module["asm"]["Jk"].apply(null, arguments)
};
var dynCall_viiifff = Module["dynCall_viiifff"] = function() {
    return Module["asm"]["Kk"].apply(null, arguments)
};
var dynCall_viiiffff = Module["dynCall_viiiffff"] = function() {
    return Module["asm"]["Lk"].apply(null, arguments)
};
var dynCall_viiiffffii = Module["dynCall_viiiffffii"] = function() {
    return Module["asm"]["Mk"].apply(null, arguments)
};
var dynCall_viidi = Module["dynCall_viidi"] = function() {
    return Module["asm"]["Nk"].apply(null, arguments)
};
var dynCall_viiffffffiii = Module["dynCall_viiffffffiii"] = function() {
    return Module["asm"]["Ok"].apply(null, arguments)
};
var dynCall_viiffffiii = Module["dynCall_viiffffiii"] = function() {
    return Module["asm"]["Pk"].apply(null, arguments)
};
var dynCall_viifffi = Module["dynCall_viifffi"] = function() {
    return Module["asm"]["Qk"].apply(null, arguments)
};
var dynCall_vifffi = Module["dynCall_vifffi"] = function() {
    return Module["asm"]["Rk"].apply(null, arguments)
};
var dynCall_vidj = Module["dynCall_vidj"] = function() {
    return Module["asm"]["Sk"].apply(null, arguments)
};
var dynCall_viddddd = Module["dynCall_viddddd"] = function() {
    return Module["asm"]["Tk"].apply(null, arguments)
};
var dynCall_iiiffi = Module["dynCall_iiiffi"] = function() {
    return Module["asm"]["Uk"].apply(null, arguments)
};
var dynCall_fifffff = Module["dynCall_fifffff"] = function() {
    return Module["asm"]["Vk"].apply(null, arguments)
};
var dynCall_jiji = Module["dynCall_jiji"] = function() {
    return Module["asm"]["Wk"].apply(null, arguments)
};
var dynCall_iidiiii = Module["dynCall_iidiiii"] = function() {
    return Module["asm"]["Xk"].apply(null, arguments)
};
var dynCall_iiiiijj = Module["dynCall_iiiiijj"] = function() {
    return Module["asm"]["Yk"].apply(null, arguments)
};
var dynCall_iiiiiijj = Module["dynCall_iiiiiijj"] = function() {
    return Module["asm"]["Zk"].apply(null, arguments)
};
function invoke_ii(index, a1) {
    var sp = stackSave();
    try {
        return dynCall_ii(index, a1)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vii(index, a1, a2) {
    var sp = stackSave();
    try {
        dynCall_vii(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        dynCall_viii(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vi(index, a1) {
    var sp = stackSave();
    try {
        dynCall_vi(index, a1)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iii(index, a1, a2) {
    var sp = stackSave();
    try {
        return dynCall_iii(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_iiiii(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_v(index) {
    var sp = stackSave();
    try {
        dynCall_v(index)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiiiiii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiiiii(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viiii(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiiii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return dynCall_iiiiii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_iiii(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiif(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiiiiif(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiif(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_iiif(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiifff(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return dynCall_iiifff(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiffff(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return dynCall_iiiffff(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiff(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiiiff(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viif(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        dynCall_viif(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viifff(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viifff(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiffff(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiffff(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viifii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viifii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiffffii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiffffii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viffffffiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        dynCall_viffffffiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viffffiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viffffiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_i(index) {
    var sp = stackSave();
    try {
        return dynCall_i(index)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iid(index, a1, a2) {
    var sp = stackSave();
    try {
        return dynCall_iid(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_fi(index, a1) {
    var sp = stackSave();
    try {
        return dynCall_fi(index, a1)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viid(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        dynCall_viid(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiii(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_diii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_diii(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiifi(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiiiifi(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiifi(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiifi(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_fiifi(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_fiifi(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiif(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viiif(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiiiifii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiifii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiiifii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vifii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_vifii(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viffffii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viffffii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vid(index, a1, a2) {
    var sp = stackSave();
    try {
        dynCall_vid(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiid(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viiid(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_di(index, a1) {
    var sp = stackSave();
    try {
        return dynCall_di(index, a1)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vdi(index, a1, a2) {
    var sp = stackSave();
    try {
        dynCall_vdi(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiffiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiffiii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vif(index, a1, a2) {
    var sp = stackSave();
    try {
        dynCall_vif(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vidd(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        dynCall_vidd(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vidi(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        dynCall_vidi(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiddiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiddiiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiid(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_iiid(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_dii(index, a1, a2) {
    var sp = stackSave();
    try {
        return dynCall_dii(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viidd(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viidd(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiifiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiifiii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiffiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiiffiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iidddddi(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        return dynCall_iidddddi(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiifii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiifii(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiffii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiiffii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iif(index, a1, a2) {
    var sp = stackSave();
    try {
        return dynCall_iif(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_fii(index, a1, a2) {
    var sp = stackSave();
    try {
        return dynCall_fii(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_fifi(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_fifi(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiidiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiidiii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiid(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_iiiid(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiif(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_iiiif(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiiff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiiff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vifi(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        dynCall_vifi(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iidddddddddddddddd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17) {
    var sp = stackSave();
    try {
        return dynCall_iidddddddddddddddd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15, a16, a17)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiiiiiiff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiiiiiiff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viiiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viifi(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viifi(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiidi(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiiidi(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiifi(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiifi(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        return dynCall_iiiiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_did(index, a1, a2) {
    var sp = stackSave();
    try {
        return dynCall_did(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiddiidi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viiiddiidi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiddiiidd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viiddiiidd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiidd(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiidd(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viidddiiidd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        dynCall_viidddiiidd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viididd(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viididd(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiddidd(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiddidd(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiidddd(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiidddd(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiddddd(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiiddddd(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiddd(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiddd(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viidii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viidii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiff(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiiff(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viffii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viffii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiffi(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_iiffi(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iidi(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_iidi(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiddddddddd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        return dynCall_iiddddddddd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viddi(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viddi(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vifff(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_vifff(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiiffffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiiffffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiifii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        return dynCall_iiiiifii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vidddif(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_vidddif(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        return dynCall_iiiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viffiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        dynCall_viffiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vifffii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_vifffii(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iidiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return dynCall_iidiii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiifiif(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiifiif(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vidddi(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_vidddi(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viddddddii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viddddddii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiffffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiffffii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiffiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiffiiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viffiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        dynCall_viffiiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viifiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viifiii(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiiiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiffi(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiidiiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_diiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_diiii(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iifffffffff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        return dynCall_iifffffffff(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viidddd(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viidddd(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viffiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viffiiiiif(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_diid(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_diid(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_didi(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_didi(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiddi(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiddi(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viddd(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viddd(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viddiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viddiii(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vidii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_vidii(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viddii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viddii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiddiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        return dynCall_iiiiddiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiddiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return dynCall_iiddiii(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiid(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiid(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viddiiiddd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viddiiiddd(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viff(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        dynCall_viff(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viffff(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viffff(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viidf(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viidf(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiidf(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiiidf(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiff(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viiff(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iidd(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_iidd(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiiiidi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viiiiiiidi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiid(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return dynCall_iiiiid(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiifiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        return dynCall_iiiiifiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        return dynCall_iiiiifiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiifi(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiiifi(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiidf(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiidf(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiid(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiiid(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiidfi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiidfi(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiidf(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiiiidf(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiif(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiif(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_fiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_fiii(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viij(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viij(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiji(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiiiji(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_ji(index, a1) {
    var sp = stackSave();
    try {
        return dynCall_ji(index, a1)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiji(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiji(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vij(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        dynCall_vij(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiij(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiiij(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iij(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_iij(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiijii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viiijii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiij(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_iiij(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vifiij(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_vifiij(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_jii(index, a1, a2) {
    var sp = stackSave();
    try {
        return dynCall_jii(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiij(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_viiij(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9) {
    var sp = stackSave();
    try {
        dynCall_viijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viiiijj(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iidj(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_iidj(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiij(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return dynCall_iiiij(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_jiiii(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_jiiii(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiji(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_iiji(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12) {
    var sp = stackSave();
    try {
        dynCall_viiiiijjiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viijff(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viijff(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viji(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        dynCall_viji(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_jiiiii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return dynCall_jiiiii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_jiiiiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        return dynCall_jiiiiiii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_jiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        return dynCall_jiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vijii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        dynCall_vijii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vijjii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_vijjii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_vijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_dij(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_dij(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viiiji(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viiiji(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viijjii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        dynCall_viijjii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_jiii(index, a1, a2, a3) {
    var sp = stackSave();
    try {
        return dynCall_jiii(index, a1, a2, a3)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiji(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return dynCall_iiiji(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        return dynCall_iiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viijii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        dynCall_viijii(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_vj(index, a1, a2) {
    var sp = stackSave();
    try {
        dynCall_vj(index, a1, a2)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        return dynCall_iiijjii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_viijij(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        dynCall_viijij(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_jiiiiii(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return dynCall_jiiiiii(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iijji(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return dynCall_iijji(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        return dynCall_iijiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iijiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
    var sp = stackSave();
    try {
        return dynCall_iijiiiiiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iijii(index, a1, a2, a3, a4, a5) {
    var sp = stackSave();
    try {
        return dynCall_iijii(index, a1, a2, a3, a4, a5)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_jiiiifi(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return dynCall_jiiiifi(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiijiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiijiiiiiiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12, a13, a14, a15)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iijiiii(index, a1, a2, a3, a4, a5, a6, a7) {
    var sp = stackSave();
    try {
        return dynCall_iijiiii(index, a1, a2, a3, a4, a5, a6, a7)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iijf(index, a1, a2, a3, a4) {
    var sp = stackSave();
    try {
        return dynCall_iijf(index, a1, a2, a3, a4)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10) {
    var sp = stackSave();
    try {
        return dynCall_iiiiiijiii(index, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iijiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8) {
    var sp = stackSave();
    try {
        return dynCall_iijiiifi(index, a1, a2, a3, a4, a5, a6, a7, a8)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
function invoke_iiiiij(index, a1, a2, a3, a4, a5, a6) {
    var sp = stackSave();
    try {
        return dynCall_iiiiij(index, a1, a2, a3, a4, a5, a6)
    } catch(e) {
        stackRestore(sp);
        if (e !== e + 0 && e !== "longjmp") throw e;
        _setThrew(1, 0)
    }
}
Module["asm"] = asm;
var calledRun;
function ExitStatus(status) {
    this.name = "ExitStatus";
    this.message = "Program terminated with exit(" + status + ")";
    this.status = status
}
dependenciesFulfilled = function runCaller() {
    if (!calledRun) run();
    if (!calledRun) dependenciesFulfilled = runCaller
};
function run(args) {
    args = args || arguments_;
    if (runDependencies > 0) {
        return
    }
    preRun();
    if (runDependencies > 0) return;
    function doRun() {
        if (calledRun) return;
        calledRun = true;
        if (ABORT) return;
        initRuntime();
        preMain();
        if (Module["onRuntimeInitialized"]) Module["onRuntimeInitialized"]();
        postRun()
    }
    if (Module["setStatus"]) {
        Module["setStatus"]("Running...");
        setTimeout(function() {
                setTimeout(function() {
                        Module["setStatus"]("")
                    },
                    1);
                doRun()
            },
            1)
    } else {
        doRun()
    }
}
Module["run"] = run;
function exit(status, implicit) {
    if (implicit && noExitRuntime && status === 0) {
        return
    }
    if (noExitRuntime) {} else {
        ABORT = true;
        EXITSTATUS = status;
        exitRuntime();
        if (Module["onExit"]) Module["onExit"](status)
    }
    quit_(status, new ExitStatus(status))
}
function abort(what) {
    if (Module["onAbort"]) {
        Module["onAbort"](what)
    }
    what += "";
    out(what);
    err(what);
    ABORT = true;
    EXITSTATUS = 1;
    throw "abort(" + what + "). Build with -s ASSERTIONS=1 for more info."
}
Module["abort"] = abort;
if (Module["preInit"]) {
    if (typeof Module["preInit"] == "function") Module["preInit"] = [Module["preInit"]];
    while (Module["preInit"].length > 0) {
        Module["preInit"].pop()()
    }
}
noExitRuntime = true;
run();