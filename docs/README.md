## Table of contents
- [First steps](README.md)
- [Plugin TypeScript guidelines](guidelines.md)
- [preferences.xml details](preferences.xml.md)
- [ZenmoneyManifest.xml details](ZenmoneyManifest.xml.md)
- [Useful plugin utils](utils.md)
- [Transaction domain examples](transactionsExamples.md)

## First steps

### Installation
- ```git clone https://github.com/zenmoney/ZenPlugins.git```
- We use yarn as a package manager. So just call it to download all dependencies ```yarn```.
    - If you don't have yarn, just install it ```npm install --global yarn```.
    - Of course, you should have nodejs (16+) and npm.

### Useful commands
- ```yarn start (PLUGIN NAME)```
  - Start development server with simple UI for plugin.
  So you can debug your code in browser.
- ```yarn build (PLUGIN NAME)```
  - Build plugin to one file bundle.
- ```yarn test [PLUGIN NAME]```
  - Run type-check, linter and tests.
  - Can be used with plugin name to run tests only for this plugin.
- ```jest [PLUGIN NAME]```
  - Run tests.
  - Can be used with plugin name to run tests only for this plugin.

### Structure overview
```
├── docs // this documentation
├── locales // localization for error messages
├── scripts // various scripts for building & debugging
└── src
    ├── common // useful utilities
    ├── types
        ├── get.ts // lib for interacting with unknown data
        ├── index.d.ts // ts types for ZenMoney global object
        └── zenmoney.ts // domain types
    ├── UI // react UI for browser debug server
    └── plugins
        └── [plugin name] // recomended plugin structure
            ├── api.ts // scrape flow implementation
            ├── converters.ts // converters from bank format to zenmoney
            ├── fetchApi.ts // bank api calls implementation
            ├── index.ts // entrypoint with scrape function
            ├── models.ts // constants and shared data structures
            ├── preferences.xml // structure of plugin settings
            └── ZenmoneyManifest.xml // plugin description
```

### Creating a new plugin
- Fork this repository.
- To create a new plugin, simply copy the example plugin and change its name
  to bank name + country code (eg. click-uz).
- Update [preferences.xml](preferences.xml.md) and
[ZenmoneyManifest.xml](ZenmoneyManifest.xml.md) according to your bank features.
- Implement bank API and converters according to our [guidelines](guidelines.md).
- Commit, push and create pull request!
