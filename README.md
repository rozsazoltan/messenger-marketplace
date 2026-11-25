# Messenger Marketplace

Plugin index for the unofficial Messenger desktop app (`rozsazoltan/messenger`).
The app reads `index.json` from the `main` branch and installs plugins from the
paths listed there.

## Layout

```
index.json
plugins/<id>/index.js      optional
plugins/<id>/style.css     optional
plugins/<id>/README.md     optional
themes/<id>/style.css      one stylesheet per theme
locales/<code>/lang.json   one language pack per locale
LICENSE
```

Directories follow the entry `category`: themes live under `themes/`, language
packs under `locales/`, and everything else under `plugins/`. The app only reads
the paths in `index.json`, so an entry keeps working wherever its files sit.

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
      "version": "1.0.4",
      "style": "themes/midnight/style.css"
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
| `category` | no | `theme`, `plugin` or `language`. Defaults to a guess from `style`/`script`. |
| `lang` | language only | Repo-relative path to the language pack JSON. |
| `icon` | in the package JSON | Language packs carry their own `icon`: embedded SVG markup. The app copies it on install, so the index stays free of artwork. |
| `modes` | no | Themes may declare supported `light` and/or `dark` modes. |

At least one of `style` and `script` must be present, unless `category` is
`language`, where `lang` replaces them. Paths are resolved against the
repository root on the `main` branch, so relative paths work as written here.

## Themes

Theme stylesheets contain only customizable `--theme-*` properties. The app
provides surface rules and applies them while a theme is active. Fixed dark
themes set tokens in one `.viewdock-theme` block. Adaptive themes set light
tokens in `.viewdock-theme` and dark tokens in
`.viewdock-theme.__fb-dark-mode`, matching Messenger's dark-mode marker.

To add a theme, copy `themes/midnight/style.css`, change the token values and add
a manifest entry with its `style` path and supported `modes` (`light`, `dark`,
or both). Use only the documented theme
selectors; keep surface rules out of theme files.

| Variable | Controls |
|----------|----------|
| `--theme-color-scheme` | Native control appearance: `dark` or `light`. |
| `--theme-bg` | Page and panel background. |
| `--theme-surface` | Input and composer background. |
| `--theme-text` | Text and caret color. |
| `--theme-muted` | Placeholder color. |
| `--theme-line` | Borders and separators. |
| `--theme-accent` | Links and other emphasized actions. |

Scrollbar colors stay `auto` in the app theme stylesheet so the browser paints
the native track rather than exposing the chat gradient through a transparent
one. Older app versions cannot render `.viewdock-theme` payloads correctly, so
ship app support before publishing themes that use this contract.

## Language packs

A language pack is declarative JSON and never runs code:

```json
{
  "schemaVersion": 1,
  "locale": "hu",
  "name": "Magyar",
  "strings": { "modal.about.title": "Névjegy" }
}
```

`locale` must equal the plugin `id` and `strings` maps the app's message keys to
translated text. A missing key falls back to English one lookup at a time, so a
partial pack is usable. Brand and product names stay untranslated.

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

1. Add a folder under `plugins/<id>/`, `themes/<id>/` or `locales/<code>/`
   depending on the entry category.
2. Add the entry to `index.json`.
3. Open a pull request describing what the plugin does and what it touches.

Styles should stay cosmetic. Scripts should be wrapped in an IIFE, must not use
`eval` or `new Function` (blocked by the page), must tolerate elements that are
not present, and must not break the page when Messenger changes its DOM.
