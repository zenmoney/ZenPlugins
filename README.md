<p align="center">
  <a href="https://zenmoney.app"><img src="./docs/assets/logo.png" alt="Zenmoney logo"/></a>
</p>

Zenmoney brings together data from all of your accounts and cards to create a complete picture.
These plugins do the job.

---
- Plugins in this repository are developed by the community.
- All new plugins must be created in TypeScript according to our [architecture and conventions](docs/plugins/architecture.md).
- Plugins retrieve accounts and transactions or receipts from a service,
then convert them into the corresponding Zenmoney format.
- Plugins are downloaded to the app, run on your device, and contact the
  configured service for authentication and data.

Integrations can use documented APIs, banking websites or mobile protocols,
public ledgers, and user-selected statements. The supported data and interaction
flow depend on the integration.

## Contribution
We are always looking to expand the coverage of our plugins, but
if your bank is still unsupported, and you have skills in TypeScript + basic reverse engineering,
you can help us — create a plugin by yourself.
So after a successful merge, all users will be able to use it.

Start with the [documentation](docs/README.md): choose the plugin type, then
follow the route for new development or investigation of an existing plugin.
