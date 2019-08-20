Compiler Framework
---
An open source framework for writing [graffiticode](https://graffiticode.com) compilers.

The framework allows you to go from:

```js
exports.compiler = {
  language: 'L0',
  async compile(code, data, config) {
      return '<code+data+config>';
  },
};
```

To:

```sh
curl http://my-url
# Output: Hello, L0!
```
All without needing to worry about writing an HTTP server or complicated request
handling logic.

# Installation
Add the Compiler Framework to your `package.json` file using `npm`.
``` sh
npm install @graffiticode/compiler-framework
```

# Quickstart
Create an `index.js` file with the following contents:
``` js
exports.compiler = {
  language: 'L0',
  async compile(code, data, config) {
      return '<code+data+config>';
  },
};
```

Run the following command:
```sh
npx @graffiticode/compiler-framework --target=compiler
```

# Configure the Compiler Framework

You can configure the Compiler Framework using command-line flags or
environment variables. If you specify both, the environment variable will be
ignored.

Command-line flag         | Environment variable      | Description
------------------------- | ------------------------- | -----------
`--port`                  | `PORT`                    | The port on which the Compiler Framework listens for requests. Default: `8080`
`--target`                | `FUNCTION_TARGET`         | The name of the exported function to be invoked in response to requests. Default: `compiler`
`--source`                | `FUNCTION_SOURCE`         | The path of your project directory where you want to start. Compiler framework always look only at root path, setting this option will look for your function in any other folder. Default: `/`

You can set command-line flags in your `package.json` via the `start` script.
For example:

```js
  "scripts": {
    "start": "compiler-framework --target=compiler"
  }
```

# [wip] Advanced Docs

More advanced guides and docs can be found in the [`docs/` folder](docs/).

# Contributing

Contributions to this library are welcome and encouraged. See
[CONTRIBUTING](CONTRIBUTING.md) for more information on how to get started.

__NOTE__: _This is not an officially supported Google product._
