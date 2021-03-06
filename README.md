<img src="img/bit-loader_white.png" width="100%"></img>

[![Build Status](https://travis-ci.org/MiguelCastillo/bit-loader.svg?branch=master)](https://travis-ci.org/MiguelCastillo/bit-loader) [![Gitter](https://badges.gitter.im/Join%20Chat.svg)](https://gitter.im/MiguelCastillo/bit-loader?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)


## Introduction

> Framework for building module loaders with *very* little effort.

bit loader is a framework that can be very easily configured to build your own module loader. It is modeled after [this](http://wiki.ecmascript.org/doku.php?id=harmony:module_loaders) module loader sudo spec that has been bounced to possibly ES7.

Below you will find examples on how to set `fetch`, `transform`, `compile`, and other plugins and hooks to enable you to create a module loader with little effort. So the expectation is that you can configure bit loader to load and process modules.

You can take a look at [bit imports](https://github.com/MiguelCastillo/bit-imports), which is a module loader built on top of bit loader, with support for `AMD`, `CJS`, and `ES2015` modules via babel or any other transpiler.

## Why use this?

This is an overloaded question...

1. Its simple to setup your own module loader with the [core hooks](#core-layer-and-hooks).
2. Its flexible processing [pipelines](#pipelines) with a [plugin](#plugins) system.
3. Its designed to run in the browser and nodejs. So you can set things up to run directly in the browser during your development cycles without needing a "compile -> bundle -> deploy" step.

## Examples

Please checkout the [examples](./example).  There you will find different recipes for settings things up.


## Build and other tasks

#### build
```
$ npm install
$ grunt build
```

All build artifacts will be in the `dist` folder.


#### test
```
$ grunt test
```

## Architecture Overview

bit loader is composed of a two stage workflow. One workflow is responsible for loading and processing files via puggable pipelines. And a second workflow is for building modules that can be consumed by the host application.

#### The pluggable pipelines

- **fetch** - responsible for loading files from storage.
- **transform** - responsible for processing and transforming loaded files.  E.g. ES6 to ES5 via babeljs. Or CoffeeScript to JavaScript.
- **dependency** - responsible for parsing out dependencies from the loaded files.
- **compile** - responsible for converting loaded files to consumable code for the host application.  E.g. Text to JSON.

These four pipelines are pluggable, which means that you can register handler functions to process data in any of these pipelines. These pipelines are executed sequentially in the order listed above, with each pipeline feeding data from one to the next.

More details on how to hook into the pipelines can be found in the [plugins](#plugins) section. More details on each pipeline can be found [here](#pipelines).

#### The build stage

>The build stage (compile + linking) is where the *transformed files* are converted to *evaluated code*, which is what a module ultimately represents and the host application consumes.

The build stage is synchronous, which has the implication that module files and their dependencies can be processed asynchronously in the first stage, and the modules created in the build stage can be consumed by the application synchronously.

The combination of an *asynchronous* processing workflow with a *synchronous* build workflow enables support for `CJS`,`AMD`, and `ES6 modules` simultaneously.


## Pipelines

> Each pipeline has a very speific reponsibility.

#### Fetch

First, we ought to read the module files from storage. Storage can be local file system as it could be in the case of nodejs, from a remote server via XHR, or just text from a websocket. bit loader does not need to know the semantics of how module files are read from storage...  But it needs to tell you when to load them so that module files can be passed on to the next pipeline.

#### Transform

Once module files are fetched (read from storage), we generally process their content in some way or another.

For example, reading a Markdown file from storage is just text but to really make use of it when rendering to screen, you generally convert it to HTML. Or maybe you have JavaScript code written in ES2015 (or later) and want to transform it to good ole ES5 so that older browsers can run your code. You can setup a [babel](https://babeljs.io/) transform to handle this. And that's exactly what the transform pipeline is for -- for processing module files so that can eventually be consumed by the host application.

Once all configured transforms get a chance to execute, the transform pipeline feeds the processed module files to the next pipeline called dependency.

#### Dependency

An important part of the lifecycle of a module is loading dependencies on other modules, and this is where we get a chance to tell bit loader to load them up. For example, we can parse `require` statements in JavaScript files so that bit loader can load those up automatically for us.

The most important part of this particular step is that all dependencies generated in this pipeline will go through all the pipelines before the current module is further processed. So by the time the module files have been processed in this pipeline, all module dependencies have been fully loaded and the current module can be compiled.

#### Compile

The last pipeline is compile. This is where we take all processed module files and convert them to code that can be consumed by the host application.  For example, we can load a JSON file but up until this compile step, it is just text. So before we can hand that over to the host application, we have to convert it from text to a valid JSON object - possibly via `JSON.parse`. That's the point of the compilation step - convert processed text to code that's consumable by the host application.

---

Some of these pipelines may or may not be useful for different file types. For example, loading up a JSON file probably would not need the transform or dependency pipelines. So we would probably only register a plugin with fetch and compile handlers. JavaScript on the other hand might need all the pipelines. All this means is that you need to be aware of how you need to process your assets.


## Plugins

Plugins are the primary vehicle for registering handler functions into the different pipelines to load and process module files. Below is a sample plugin called `css` that's registering a handler method for fetching module files from storage:

``` javascript
var bitloader = new Bitloader();

bitloader.plugin("css", {
  fetch: fetchCss
});
```

You can also register handler functions for transforming module files. Building on the `css` plugin example, we can register two handler functions in the transformation pipeline as follows:

``` javascript
var bitloader = new Bitloader();

bitloader.plugin("css", {
  transform: [cssTransform1, cssTransform2]
});
```

You can configure matching rules in a plugin to specify which module files it can process. Below is an example configuring the `css` plugin to only process files with `.css` and `.less` extensions:

``` javascript
var bitloader = new Bitloader();

bitloader.plugin("css", {
  match: {
    path: ["**/*.css", "**/*.less"]
  }
});
```

> Matching rules are globs.

So, it is valid to register other handlers into a previously registered plugin using the plugin name, which is the primary reason plugins have names in the first place. But the more common use case is to configure plugins in a single call:

#### Plugin example

``` javascript
var bitloader = new Bitloader();

bitloader.plugin("css", {
  match: {
    path: ["**/*.css", "**/*.less"]
  },
  fetch: fetchCss,
  transform: [cssTransform1, cssTransform2]
});
```

You can take a look at [this](https://gist.github.com/MiguelCastillo/37944827c0caee3c0e1a) configuration that shows a more elaborate plugin setup.


## Core layer and hooks

bit loader is a *JavaScript module loader* first, and plugins are a way to augment the types of modules that can be loaded and consumed by the host application.  So, while bit loader provides you with a very flexible plugin system for processing modules, there is a layer of core function hooks that are the default handlers when plugins can't process a particular module.

- **resolve** - function that converts module names (ids) to paths. Paths are used plugins and the `fetch` hook to load module files.
- **fetch** - function that loads module files from storage. These files are processed by plugins and the `compile` hook to build modules.
- **compile** - function that evaluates module files with `eval`, or some other equivalent mechanism to create code that can be consumed by the host application.

So, plugins and their core function hook counterparts have fundamentally the same responsibilities. However, the one function hook that has real implications is `compile`; they primarly differ in when and how they run.

All plugins run in the first stage, which is *asynchronous* and runs before the build stage. This means that `compile` plugins are *asynchronous* and run before the `compile` handler in the build stage. Furthermore, there can only be one `compile` handler in the build stage, and its intended use case is for *synchronously* building JavaScript modules when the host application requires them.  Think `CJS`... All other function hooks run *asynchronously* when there are no plugins that can process a module.

Checkout [bit imports](https://github.com/MiguelCastillo/bit-imports) for an implementation of these core function hooks.

#### Core hooks example
``` javascript
function resolvePath(moduleMeta) {
  moduleMeta.configure({
    path: "path/to/module/" + moduleMeta.name
  });
}

function loadFile(moduleMeta) {
  return Promise.resolve(ajax(moduleMeta.path))
    .then(function(text) {
      moduleMeta.configure({
        source: text
      });
    });
}

function compileModule(moduleMeta) {
  moduleMeta.configure({
    code: eval(moduleMeta.source)
  });
}


//
// Instantiate bitloader
//
var bitloader = new Bitloader({
  resolve : resolvePath,
  fetch   : loadFile,
  compile : compileModule
});
```

## Module Meta

So what exactly are the pipelines and core hooks processing around, anyways? They are passing around a module meta object, which is a *mutable* object that is modified as it passes through the different pipelines and core hooks. This object is an intermediate representation that the build stage uses to create module instances that the host application ultimately consumes.

> Modifying module meta objects is the primary responsibility of the different pipelines and core hooks.

- **load** - creates module meta objects with the name of the module being loaded
- **resolve** - uses the module meta `name` from `load` to create and set the module meta `path`.
- **fetch** - loads the module file using the `path` from `resolve`, and sets the module meta `source`.
- **transform** - processes the module `source` from `fetch`, and sets the module meta `source`.
- **dependency** - processes the module `source` from `fetch`, and sets the module meta `deps`.
- **compile** - evaluates the module `source`, and sets the module meta `code`.


#### Pipeline Flow
* create moduleMeta
* resolve (moduleMeta)
  * create module path from moduleMeta.name and set moduleMeta.path
* fetch (moduleMeta)
  * read module file using moduleMeta.path and set moduleMeta.source
* transform (moduleMeta)
  * run custom transforms and set moduleMeta.source
* dependency (moduleMeta)
  * parse out dependencies from moduleMeta.source and set moduleMeta.deps
  * start pipeline flow for each item in moduleMeta.deps before moving on to the next pipeline
* build (moduleMeta)
  * compile - evalutes moduleMeta.source and create module instance
  * link - call factory and set module.code

<!--
## Reference diagrams

### Loader diagram
<img src="https://raw.githubusercontent.com/MiguelCastillo/bit-loader/master/img/Loader.png" alt="Loader diagram" height="600px"></img>

### Fetch diagram
<img src="https://raw.githubusercontent.com/MiguelCastillo/bit-loader/master/img/Loader-Fetch.png" alt="Fetch diagram" height="600px"></img>

### Pipeline diagram
<img src="https://raw.githubusercontent.com/MiguelCastillo/bit-loader/master/img/Loader-Pipeline.png" alt="Pipeline diagram" height="600px"></img>
-->
