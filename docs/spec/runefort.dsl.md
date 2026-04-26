# .rune DSL — v0.1

**Author-friendly syntax that compiles to runefort.json (and to `<rune-*>` HTML).**

Status: draft v0.1
Position: optional sugar. Not normative — `runefort.json` is the canonical format. The DSL is one of several authoring surfaces.
Companion to: `runefort.protocol.md`, `runefort.core.md`

---

## 0. What this is

A small declarative DSL with curly-brace blocks (HCL/Terraform-shaped) for writing Runefort layouts by hand. Compiles to `runefort.json` and/or to `<rune-floor>` HTML via the `runefort` CLI or a build plugin.

Why a DSL when JSON works? Because layouts are read more often than written, and `position: [3, 2]` reads worse than `at = (3, 2)`. Because `link memory -> deploy` is shorter than `{ "from": "memory", "to": "deploy" }`. Because diffs of `.rune` files are reviewable in a way that JSON arrays of objects are not.

The DSL is not required. Authors who prefer JSON, YAML, or programmatic generation should use those directly.

## 1. File extension

`.rune` — recognized by the compiler, syntax-highlightable as HCL or Nix in editors that don't yet have native support.

## 2. Grammar (informal)

```
file       := floor+
floor      := "floor" IDENT "{" floor_body "}"
floor_body := (attr | room | link | bind | comment)*

room       := "room" IDENT "{" room_body "}"
room_body  := (attr | claim | comment)*

claim      := "claim" STRING ("anchor" "=" STRING)?
link       := "link" IDENT "->" IDENT ("," "->")*  ("[" link_attrs "]")?
            | "link" IDENT "<->" IDENT  ("[" link_attrs "]")?
bind       := "bind" IDENT "on" IDENT "{" threshold+ "}"
threshold  := IDENT "=" STRING

attr       := IDENT "=" value
value      := STRING | INT | FLOAT | BOOL | tuple | list
tuple      := "(" value ("," value)+ ")"
list       := "[" value ("," value)* "]"

comment    := "#" .* "\n"
```

Everything is whitespace-insensitive except newlines inside strings. Trailing commas are allowed and ignored.

## 3. Minimal example

```hcl
floor my_app_forge {
  columns    = 6
  rows       = 4
  vocabulary = "supervisor-floor.v1"
  editor     = "vscode"

  room memory {
    at     = (0, 0)
    size   = (3, 2)
    label  = "memory.ex"
    anchor = "lib/my_app/forge/memory.ex:24"
    claim  "lib/my_app/memory/**/*.ex"
  }

  room deploy {
    at     = (3, 0)
    size   = (3, 2)
    label  = "deploy.ex"
    anchor = "lib/my_app/forge/deploy.ex"
    claim  "lib/my_app/deploy/**/*.ex"
  }

  room pulse {
    at     = (0, 2)
    size   = (2, 1)
    label  = "pulse.ex"
    anchor = "lib/my_app/forge/pulse.ex"
  }

  link memory <-> deploy
  link memory  -> pulse

  bind memory on kappa {
    cold = "< 0.3"
    warm = "< 0.6"
    hot  = ">= 0.6"
  }
}
```

## 4. Compilation

```sh
runefort compile floor.rune --out runefort.json
runefort compile floor.rune --out floor.html        # emits <rune-*> elements
runefort compile floor.rune --out floor.html --inline-theme foundry
```

The CLI is one binary, three outputs:

| `--out` extension | Result |
|---|---|
| `.json` | Canonical `runefort.json` |
| `.html` | Static HTML using `<rune-*>` elements + `<script type="module">` import |
| `.svelte`, `.tsx`, `.vue` | Framework-adapter component (uses corresponding `@runefort/<framework>`) |

The compiler is a pure function: same `.rune` input → byte-identical output. No timestamps, no environment, no network.

## 5. Multiple floors

A `.rune` file may declare multiple floors. They compile to separate JSON documents (or to multiple `<rune-floor>` elements in HTML mode).

```hcl
floor home_dashboard {
  columns = 4
  room overview { at = (0,0) size = (4,1) }
  room metrics  { at = (0,1) size = (2,2) }
  room alerts   { at = (2,1) size = (2,2) }
}

floor settings_panel {
  columns = 3
  room profile { at = (0,0) size = (3,1) }
  room api     { at = (0,1) size = (3,1) }
}
```

## 6. Includes and composition

For larger projects, split floors across files:

```hcl
# main.rune
include "rooms/forge.rune"
include "rooms/dashboard.rune"

floor app {
  columns = 12
  use forge       at = (0, 0) size = (6, 4)   # mounts another floor as a sub-region
  use dashboard   at = (6, 0) size = (6, 4)
}
```

`use <floor>` mounts a previously-declared floor as a nested region. This compiles to v0.2 nesting in the protocol; in v0.1 it inlines as a flat layout with prefixed room ids (`forge.memory`, `dashboard.metrics`).

## 7. Variables and parameters

Floors can take parameters for reuse:

```hcl
floor supervisor_tile(name, anchor, region) {
  columns = 1
  rows    = 1
  room main {
    at     = (0, 0)
    size   = (1, 1)
    label  = name
    anchor = anchor
    claim  region
  }
}

floor my_forge {
  columns = 6
  use supervisor_tile(name="memory.ex", anchor="lib/forge/memory.ex:24",
                      region="lib/my_app/memory/**")
       at = (0, 0) size = (3, 2)
}
```

Parameters are simple string substitution at compile time. No expressions, no loops. (For programmatic generation, drop down to JSON.)

## 8. Comments

```hcl
# Single-line comment.
# No multi-line form. If you need a docblock, use multiple lines.

floor app {
  columns = 6
  # rows is auto, content-driven
  room memory { ... }
}
```

## 9. Vocabulary attributes

Vocabulary-defined fields go inside a `meta` block:

```hcl
room memory {
  at     = (0, 0)
  size   = (3, 2)
  anchor = "lib/forge/memory.ex"

  meta {
    autonomy        = "advise"
    uptime_seconds  = 957840
    last_action     = "consolidated 47 nodes"
  }
}
```

The compiler does not validate `meta` against any vocabulary schema in v0.1 — that's the consumer's job. v0.2 may add `vocabulary "supervisor-floor.v1" { schema = ... }` for compile-time validation.

## 10. What the DSL deliberately does not have

- **No expressions, no math, no string interpolation.** It's a layout file, not a program. Programmatic generation should produce JSON.
- **No conditionals.** `if cluster == "prod"` belongs in the build pipeline that picks which `.rune` file to compile.
- **No imports of code.** The DSL never executes anything.
- **No theme or style declarations.** Themes are CSS; the DSL is layout only.
- **No event handlers.** Event wiring belongs in JS/your framework adapter.

## 11. Editor support (v0.1)

- **TextMate grammar** (`.rune.tmLanguage.json`) for VS Code, Zed, Cursor, Sublime — basic keyword + string + comment highlighting.
- **Tree-sitter grammar** (`tree-sitter-rune`) for Neovim, Helix, and anyone using tree-sitter-based highlighting/folding.
- **LSP** is deferred to v0.2 (validation, completion, jump-to-room).

Treating the file as `hcl` or `nix` is a usable fallback in any editor.

## 12. Round-trip

Every `.rune` file has a canonical JSON form. Every canonical JSON has a canonical `.rune` form. The CLI can convert in either direction:

```sh
runefort fmt floor.rune              # canonicalize formatting
runefort to-rune runefort.json       # JSON → .rune
runefort compile floor.rune          # .rune → JSON
```

Round-tripping `JSON → .rune → JSON` is byte-identical. This guarantees the DSL is never lossy and never adds semantics not expressible in JSON.
