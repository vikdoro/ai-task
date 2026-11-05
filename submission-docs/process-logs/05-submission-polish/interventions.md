# Interventions · Submission polish

Rejections and course corrections, in order. Checks that passed are in [`checks.md`](checks.md); a check that found something links here. Rules are in [`CLAUDE.md`](../../../CLAUDE.md#process-logs). Prompt IDs link to [`prompts/prompts.md`](prompts/prompts.md).

- `REJECT`: output thrown away.
- `CORRECT`: output kept but changed in direction or substance.

`Caught by` names who found it: the user, a test, the reviewer, or Claude checking its own claim.

### I-63 · CORRECT · [P-233](prompts/prompts.md#p-233)
- **Claude did:** recommended fixing the `feature-design/` paths in every file, closed phase logs included, once the folder moves into `submission-docs/` ([P-232](prompts/prompts.md#p-232)).
- **Caught by:** user: "closed logs should not be updated"
- **Why wrong:** not stated.
- **Changed:** closed phase logs keep their paths as written, even where links break. Only live documents and the open phase's logs are updated. See D-131.

### I-64 · CORRECT · [P-236](prompts/prompts.md#p-236)
- **Claude did:** said `tsc` across the four Nuxt tsconfigs covered `tests/` and that the TS check was clean ([P-235](prompts/prompts.md#p-235)).
- **Caught by:** user, through C-112: "Cannot find module '../../app/components/alert/Panel.vue'" and "Type '\"text\"' is not assignable to type '\"json\"'".
- **Why wrong:** no Nuxt tsconfig includes `tests/`, so the IDE checked those files in a loose inferred project without Nuxt's types. Claude did not confirm which files the tsconfigs included.
- **Changed:** added `tests/tsconfig.json`, which extends the app tsconfig, and referenced it from the root `tsconfig.json`. Fixed a cast in `tests/e2e/alerts.test.ts` that this exposed.

### I-65 · CORRECT · [P-237](prompts/prompts.md#p-237)
- **Claude did:** said the new `tests/tsconfig.json` would clear the `Panel.vue` import error, checking it only with `vue-tsc` on TypeScript 5.9 ([P-236](prompts/prompts.md#p-236)).
- **Caught by:** user, through C-113: "still errors on line 4".
- **Why wrong:** the project's TypeScript 7 cannot load Vue's plugin, so plain `tsc` does not resolve `.vue` imports. Running `tsc` 7 on the new config had already shown this error, and Claude did not act on it.
- **Changed:** added `tests/shims-vue.d.ts`, which declares `*.vue` modules for TypeScript without the Vue plugin.

### I-66 · CORRECT · [P-249](prompts/prompts.md#p-249)
- **Claude did:** added links to `plan-of-attack.md` and `highlights.md` to the root `README.md`, with a note that `original-brief.md` is kept out of git on purpose ([P-248](prompts/prompts.md#p-248)).
- **Caught by:** user, through C-124: "I edited the README.md, keep it as I left it."
- **Why wrong:** not stated.
- **Changed:** the user reordered the links and removed the `original-brief.md` note. Claude leaves the README as the user left it.
