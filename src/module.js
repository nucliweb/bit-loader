(function() {
  "use strict";

  var Utils = require("./utils");

  var Type = {
    "UNKNOWN" : "UNKNOWN",
    "AMD"     : "AMD",     //Asynchronous Module Definition
    "CJS"     : "CJS",     //CommonJS
    "IIFE"    : "IIFE"     //Immediately-Invoked Function Expression
  };


  function Module(options) {
    if (!options) {
      throw new TypeError("Must provide options to create the module");
    }

    if (options.hasOwnProperty("code")) {
      this.code = options.code;
    }

    if (options.hasOwnProperty("factory")) {
      this.factory = options.factory;
    }

    this.type     = options.type || Type.UNKNOWN;
    this.name     = options.name;
    this.deps     = options.deps ? options.deps.slice(0) : [];
    this.settings = Utils.extend({}, options);
  }


  /**
   * Module meta object
   */
  function Meta(options) {
    options = options || {};
    if (Utils.isString(options)) {
      options = {
        name: options
      };
    }

    if (!Utils.isString(options.name)) {
      throw new TypeError("Must provide a name, which is used by the resolver to create a location for the resource");
    }

    if (!Utils.isArray(options.deps)) {
      delete options.deps;
      this.deps = [];
    }

    this.configure(options);
  }


  Meta.prototype.configure = function(options) {
    Utils.extend(this, options);
    return this;
  };


  Meta.validate = function(moduleMeta) {
    if (!moduleMeta) {
      throw new TypeError("Must provide options");
    }

    if (!Meta.isCompiled(moduleMeta) && !Meta.canCompile(moduleMeta)) {
      throw new TypeError("ModuleMeta must provide a `source` string or `code`.");
    }
  };


  Meta.hasDependencies = function(moduleMeta) {
    return moduleMeta.deps && moduleMeta.deps.length;
  };


  Meta.isCompiled = function(moduleMeta) {
    return moduleMeta.hasOwnProperty("code") || typeof(moduleMeta.factory) === "function";
  };


  Meta.canCompile = function(moduleMeta) {
    return !Meta.isCompiled(moduleMeta) && typeof(moduleMeta.source) === "string";
  };


  Module.Meta = Meta;
  Module.Type = Type;
  module.exports = Module;
})();
