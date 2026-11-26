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

| Field          | Required            | Meaning                                                                                                                       |
| -------------- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `id`           | yes                 | Stable identifier, lowercase, `[a-z0-9-]`. Used as the storage key.                                                           |
| `name`         | yes                 | Display name.                                                                                                                 |
| `description`  | yes                 | One sentence shown in the app.                                                                                                |
| `author`       | yes                 | Author or maintainer name.                                                                                                    |
| `official`     | yes                 | `true` only for plugins reviewed by the app maintainer.                                                                       |
| `version`      | yes                 | Semver string.                                                                                                                |
| `style`        | no                  | Repo-relative path to a CSS file.                                                                                             |
| `script`       | no                  | Repo-relative path to a JS file.                                                                                              |
| `category`     | no                  | `theme`, `plugin` or `language`. Defaults to a guess from `style`/`script`.                                                   |
| `lang`         | language only       | Repo-relative path to the language pack JSON.                                                                                 |
| `icon`         | in the package JSON | Language packs carry their own `icon`: embedded SVG markup. The app copies it on install, so the index stays free of artwork. |
| `modes`        | no                  | Themes may declare supported `light` and/or `dark` modes.                                                                     |
| `status`       | no                  | `active` (default), `deprecated`, `disabled`, or `removed`. See lifecycle controls below.                                     |
| `statusReason` | no                  | Plain-text explanation displayed with a lifecycle warning.                                                                    |
| `renamedFrom`  | no                  | Previous IDs that can upgrade to this entry, unless those IDs are present in the current catalog.                             |

Active and deprecated entries need at least one of `style` and `script`, unless
`category` is `language`, where `lang` replaces them. Disabled and removed
entries do not need downloadable payload paths. Paths are resolved against the
selected repository source, so relative paths work as written here.

## Lifecycle controls

These fields require an app version that supports lifecycle controls. Older
clients do not enforce them; publishing metadata alone does not stop an older
installed client.

| Status               | Effect                                                                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `active`, or omitted | Normal installation and use. Clearing a restriction does not automatically enable a previously disabled item.                  |
| `deprecated`         | Shows a warning and optional reason. Existing installations and new installs remain usable.                                    |
| `disabled`           | Prevents installation and activation. A matching installed item is switched off but its package remains available for removal. |
| `removed`            | Removes the matching installed package's saved payload and record before hiding its card.                                      |

For a removal, retain an explicit entry with the item's ID, usual metadata,
`"status": "removed"`, and an optional `statusReason`. Payload paths are not
needed for a removal entry. Keep this tombstone in the catalog so clients that
were offline can receive the instruction later. Merely deleting an entry from
`index.json`, a failed request, or an invalid response never means uninstall.

For example, a blocked entry can include:

```json
{
  "id": "example-tool",
  "name": "Example Tool",
  "description": "An example lifecycle-controlled plugin.",
  "author": "maintainer",
  "official": false,
  "version": "1.0.0",
  "category": "plugin",
  "status": "disabled",
  "statusReason": "Temporarily unavailable while a compatibility issue is fixed."
}
```

Enforcement is automatic, but scoped to an installation's recorded Marketplace
source. A PR or branch cannot remove a package installed from another source.
Local imports and built-in English are not remotely removable. Legacy
installations without proven source ownership must first acquire it through a
normal package update.

Removal covers the package record and saved JS, CSS, or language catalog,
including its native storage chunks. It does not erase arbitrary user files or
unknown data created by a plugin. Failed storage operations must not be presented
as successful removal. Lifecycle-capable clients use a native batch operation
to commit payload changes and the installed index together; this requires the
corresponding native app update, not just refreshed injected JavaScript. Builds
without that operation keep working for install, update, toggle and deprecation,
but refuse removal and identity upgrades instead of deleting only part of a
package.

A newly blocked or removed running script may require a WebView restart to stop
its existing timers and listeners. An ordinary catalog refresh without such a
state change does not restart the app.

### Renaming an item

Changing `name` changes only the display label. To change identity, publish the
replacement under its new `id` and list previous IDs in `renamedFrom`:

```json
{
  "id": "new-tool",
  "name": "New Tool",
  "description": "The replacement identity for an existing tool.",
  "author": "maintainer",
  "official": false,
  "version": "1.0.0",
  "category": "plugin",
  "script": "plugins/new-tool/index.js",
  "renamedFrom": ["old-tool"]
}
```

The user gets an explicit Update action even when the version is unchanged.
The client downloads and validates the replacement before moving the installed
identity and deleting the old record. A catalog refresh does not silently run
replacement code. Active selection and enabled state are preserved where
applicable.

An ID present in the current catalog always wins over an alias. If `old-tool`
is reused by another entry, its previous rename mapping no longer applies.
Display names are not identity keys. Do not create competing aliases, alias
chains or cycles, cross-category replacements, or migrations that overwrite an
already installed target. Matching source ownership is required for migration.

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

| Variable                       | Controls                                      |
| ------------------------------ | --------------------------------------------- |
| `--theme-color-scheme`         | Native control appearance: `dark` or `light`. |
| `--theme-bg`                   | Page and panel background.                    |
| `--theme-shell`                | Window background behind the chat column.     |
| `--theme-panel`                | Conversation list panel background.           |
| `--theme-surface`              | Input and composer background.                |
| `--theme-button-background`    | Button and toggle-track background.           |
| `--theme-wallpaper-fade`       | What a chat wallpaper fades into.             |
| `--theme-text`                 | Text and caret color.                         |
| `--theme-muted`                | Placeholder color.                            |
| `--theme-line`                 | Borders and separators.                       |
| `--theme-accent`               | Links and other emphasized actions.           |
| `--theme-hover-background`     | Hover background.                             |
| `--theme-hover-text`           | Hover text.                                   |
| `--theme-active-background`    | Selected/active background.                   |
| `--theme-active-text`          | Selected/active text.                         |
| `--theme-selection-background` | Text-selection background.                    |
| `--theme-selection-text`       | Text-selection text.                          |
| `--theme-input-background`     | Input/search background.                      |
| `--theme-input-text`           | Input/search text.                            |
| `--theme-input-placeholder`    | Input/search placeholder.                     |
| `--theme-input-border`         | Input/search border.                          |
| `--theme-input-focus`          | Input/search focus border and caret.          |
| `--theme-outgoing-background`  | Own-message bubble background.                |
| `--theme-outgoing-text`        | Own-message bubble text.                      |

Themes own literal values for all nineteen base and state tokens in every
supported mode block; `--theme-panel`, `--theme-button-background` and
`--theme-wallpaper-fade`, `--theme-outgoing-background` and
`--theme-outgoing-text` are optional on top of them.
`--theme-button-background` fills plain buttons and the toggle track; keep it a
step below `--theme-surface` so a control reads as a control, and it falls back
to the surface when a package omits it.
`--theme-shell` is the outer window shade; keep it a clear step apart from
`--theme-bg` so the chat column and the conversation list keep their edges.
`--theme-panel` is the conversation list panel; themes that omit it fall back to
their own `--theme-surface`, and a theme that keeps the list on `--theme-bg`
still reads as long as the surface stays a step above it.
`--theme-wallpaper-fade` is the colour a chat wallpaper dims into at low
wallpaper opacity. A dark theme should name a shade above its base so the image
does not sink into black; a light theme can keep its own `--theme-bg`.
Shared app CSS maps these semantic tokens to interface elements and states; it
does not generate colors with `color-mix()`. Maintain readable text/background
pairs in each mode. Existing third-party themes may omit state tokens; shared
CSS may alias missing state values to the seven base tokens for compatibility.
Incoming bubbles use `--theme-surface` with `--theme-text`. Own-message bubbles
use `--theme-outgoing-background` (falling back to `--theme-accent`) with
`--theme-outgoing-text` (falling back to `--theme-bg`), so the default light
bubble never glares on a dark theme; keep that pair readable if you override it.
The app does not set the chat wallpaper itself. Search styling targets a label
directly wrapping `input[type="search"]`; different markup may need separate
styling.

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

### English reference

Use [`locales/en/lang.json`](locales/en/lang.json) as the complete English source
when contributing a translation. Copy it to `locales/<locale>/lang.json`, change
the locale, name and flag, and translate the string values without changing their
keys or placeholders.

English is built into the app. Its Marketplace card only selects English; it is
not an installable or removable package and does not need an index entry.
The app's stable-release workflow generates this reference from the released
app's built-in catalogs and updates it automatically. Ordinary string edits,
drafts, and previews do not publish a new snapshot. The reference has no package
version and does not require a Marketplace package update.

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
