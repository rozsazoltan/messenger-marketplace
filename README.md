# Messenger Marketplace

Plugin index for the unofficial Messenger desktop app (`rozsazoltan/messenger`).
The app reads `index.json` from the `main` branch and installs plugins from the
paths listed there.

## Layout

```
index.json
plugins/<id>/style.css     optional
plugins/<id>/index.js      optional
plugins/<id>/README.md     optional
LICENSE
```

## index.json

```json
{
  "schemaVersion": 1,
  "plugins": [
    {
      "id": "midnight",
      "name": "Midnight",
      "description": "…",
      "author": "rozsazoltan",
      "official": true,
      "version": "1.0.0",
      "style": "plugins/midnight/style.css"
    }
  ]
}
```

| Field | Required | Meaning |
|-------|----------|---------|
| `id` | yes | Stable identifier, lowercase, `[a-z0-9-]`. Used as the storage key. |
| `name` | yes | Display name. |
| `description` | yes | One sentence shown in the app. |
| `author` | yes | Author or maintainer name. |
| `official` | yes | `true` only for plugins reviewed by the app maintainer. |
| `version` | yes | Semver string. |
| `style` | no | Repo-relative path to a CSS file. |
| `script` | no | Repo-relative path to a JS file. |

At least one of `style` and `script` must be present. Paths are resolved
against the repository root on the `main` branch, so relative paths work as
written here.

## Trust model

`official: true` means the app maintainer reviewed the code and installs it
without a warning. Any other value marks the plugin as community content: the
app shows a one-time confirmation before installing, because a plugin runs
arbitrary JavaScript with full access to the Messenger page.

Nothing here is sandboxed. A plugin sees everything the page sees, including
message text and the session. Do not install plugins from sources you do not
trust, and do not submit plugins that read, collect or transmit user data.

## Installing

In the app: open the app menu (the Messenger logo menu), choose **Marketplace**,
and install from the list. Installed plugins are stored in the app and can be
switched off without removing them.

## Adding a plugin

1. Add a folder under `plugins/<id>/`.
2. Add the entry to `index.json`.
3. Open a pull request describing what the plugin does and what it touches.

Styles should stay cosmetic. Scripts should be wrapped in an IIFE, must not use
`eval` or `new Function` (blocked by the page), must tolerate elements that are
not present, and must not break the page when Messenger changes its DOM.
