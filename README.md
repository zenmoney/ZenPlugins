<p align="center">
  <a href="https://zenmoney.app"><img src="./docs/assets/logo.png" alt="Zenmoney logo"/></a>
</p>

Zenmoney brings together data from all of your accounts and cards to create a complete picture.
These plugins do the job.

---
- Plugins in this repository are developed by the community.
- All new plugins must be created in TypeScript according to our guidelines.
- In simple words, the plugin requests the bank to get your accounts and transactions,
then converts them into our unified format.
- Plugins are downloaded to the app and run entirely on your device.
  Thus, your bank credentials are stored securely and do not leave your device.

Some banks have an open API with documentation. For example, in Europe,
there is PSD2 Directive, so all European banks have a standardized API.
In all other cases, we have to reverse-engineer banking websites
or mobile apps to create a JS plugin.

## Contribution
We are always looking to expand the coverage of our plugins, but
if your bank is still unsupported, and you have skills in TypeScript + basic reverse engineering,
you can help us — create a plugin by yourself.
So after a successful merge, all users will be able to use it.

To get started, look at our [documentation](./docs/README.md).
