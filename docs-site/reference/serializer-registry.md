# Serializer Registry

The serializer layer now exposes a registry mechanism so new exporters can be plugged in without editing the CLI. Each entry defines the output suffix and the `Serializer` implementation to execute.

## Registering a Format

```ts
import { registerSerializerFormat } from 'tables/dist/serializer'
import { mySerializer } from './mySerializer'

registerSerializerFormat('my-format', {
  suffix: 'mf',
  serializer: mySerializer
})
```

Registered formats appear automatically in the CLI `--format` option and will be resolved at runtime by `serialize(...)`.

## Overriding an Existing Format

To replace a built-in format supply `override: true`:

```ts
registerSerializerFormat('json', {
  suffix: 'json',
  serializer: patchedJsonSerializer
}, { override: true })
```

Without `override` the registry rejects conflicting registrations to avoid accidental clobbering.

## Removing a Format

```ts
import { removeSerializerFormat } from 'tables/dist/serializer'

removeSerializerFormat('my-format')
```

This is useful in tests when a custom format should not leak into other suites.

## Default Formats

The following formats are registered at startup:

| name          | suffix |
| ------------- | ------ |
| `json`        | `json` |
| `js`          | `js`   |
| `ts`          | `ts`   |
| `ts-interface`| `ts`   |
| `jsonx`       | `json` |
| `go`          | `go`   |
| `csharp`      | `cs`   |

New emitters should register themselves during their module initialization so they are available to both API and CLI consumers.
