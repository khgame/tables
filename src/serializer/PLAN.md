# Serializer Roadmap

1. **Test Coverage Sweep**
   - Convert existing serializer-format snapshots into smaller, focused cases.
   - Add regression specs for context dealer edge cases (duplicate enums, empty blobs).

2. **Schema Intermediate Model**
   - ✅ Extract language-agnostic schema description from current `tsInterface` helpers (`core/schemaModel.ts`).
   - ✅ Define translation layer for TypeScript to ensure the refactor preserves behaviour (`formats/tsInterface.ts`).

3. **New Language Emitters**
   - ✅ Implement Go serializer on top of the new intermediate model (`formats/go.ts`).
   - ✅ Implement C# serializer on top of the new intermediate model (`formats/csharp.ts`).
   - Provide sample outputs + golden tests mirroring current TS snapshots.

4. **CLI Format Registration**
   - Introduce registry-based format configuration so new targets plug in without touching `exec.ts`.
   - Document extension workflow alongside examples in `docs/`.
