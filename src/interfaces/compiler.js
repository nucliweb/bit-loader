(function() {
  "use strict";

  function Compiler() {
  }

  Compiler.prototype.compile = function(/*moduleMeta*/) {
    throw new TypeError("Not implemented, must be implemented by the consumer code");
  };

  Compiler.prototype.canProcess = function(/*moduleMeta*/) {
    return false;
  };

  module.exports = Compiler;
})();