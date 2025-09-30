# Serializer Roadmap

1. **Test Coverage Sweep**
   - Convert existing serializer-format snapshots into smaller, focused cases.
   - Add regression specs for context dealer edge cases (duplicate enums, empty blobs).

2. **Schema Intermediate Model**
   - Extract language-agnostic schema description from current `tsInterface` helpers.
   - Define translation layer for TypeScript to ensure the refactor preserves behaviour.

3. **New Language Emitters**
   - Implement Go and C# serializers on top of the new intermediate model.
   - Provide sample outputs + golden tests mirroring current TS snapshots.

4. **CLI Format Registration**
   - Introduce registry-based format configuration so new targets plug in without touching `exec.ts`.
   - Document extension workflow alongside examples in `docs/`.
