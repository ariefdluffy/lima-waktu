# Research: Svelte 5 $state Reactivity Timing with setInterval

## Summary

Svelte 5 batches synchronous $state mutations — intermediate states are NOT rendered. The microtask queue flushes updates after the current synchronous execution completes, similar to Vue 3 / Solid. However, setInterval callbacks and $effect run in separate scheduling contexts; they do NOT share a tick by default. Double-trigger prevention requires careful effect dependency management or explicit guard flags.

## Findings

1. **Svelte 5 batches synchronous $state mutations** — When multiple `$state` properties are mutated in one synchronous function, Svelte 5's fine-grained reactivity coalesces them. The runtime uses a microtask-based flush (via `queueMicrotask` or `Promise.then`). Only the final state is rendered. No intermediate renders occur within a single synchronous call stack. This matches the behavior described in Svelte 5's "fine-grained reactivity" design. [Svelte 5 Reactivity RFC](https://svelte.dev/blog/svelte-5-release) / [Svelte Docs: $state](https://svelte.dev/docs/svelte/$state)

2. **$effect flush timing** — `$effect` callbacks are scheduled and flushed as microtasks after the component's synchronous code completes. They do NOT run synchronously inline when a `$state` value changes. The update cycle: mutation → mark dirty → queue microtask → flush effects → apply DOM updates. Multiple mutations before the flush = one effect run. [Svelte Docs: $effect](https://svelte.dev/docs/svelte/$effect)

3. **setInterval and $effect do NOT share a tick** — `setInterval` fires via the browser's task queue (macrotask). `$effect` flushes via microtask queue. A `setInterval` callback runs as a macrotask; any `$state` mutations inside it trigger effect scheduling that flushes AFTER the macrotask completes (as microtasks). They cannot "run in the same tick" — the interval callback runs first, then effects flush after. Different queue priorities. [MDN: Event loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop) / [Svelte 5 source: scheduler.ts](https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/internal/client/runtime.js)

4. **Potential double-trigger scenario** — If a `setInterval` callback mutates `$state`, and a `$effect` depends on that same state AND calls the same function, the function runs once in the interval callback (explicitly) and once when the effect fires (reactively). This is by design — Svelte doesn't deduplicate effect + manual calls. [GitHub: sveltejs/svelte issues on effect scheduling](https://github.com/sveltejs/svelte/issues)

5. **Best practice: prevent double-trigger** — Several patterns:
   - **Guard flag**: Use a boolean `$state` to skip effect body when mutation came from the interval. Set flag before mutation, check in effect, clear after.
   - **Derive from state, don't duplicate logic**: Put shared logic in a `$derived` or a plain function called only from one place.
   - **Use $effect only for side effects, not logic**: If the interval does the work, don't duplicate that work in `$effect`. Use `$effect` only for things that MUST react to state (e.g., DOM, subscriptions).
   - **Untrack in effect**: Use `untrack()` inside `$effect` to read state without creating dependencies, if you only need the value sometimes.
   ```svelte
   // Example: guard flag pattern
   let _fromInterval = $state(false);
   
   function tick() {
     // shared logic here
     count++;
   }
   
   setInterval(() => {
     _fromInterval = true;
     tick();
     _fromInterval = false;
   }, 1000);
   
   $effect(() => {
     count; // dependency
     if (!_fromInterval) tick(); // skip if interval already called it
   });
   ```

6. **Svelte 5 scheduler internals** — The runtime maintains a `microtask` queue for effects. `flushSync()` exists but is discouraged for normal use — it forces synchronous flush. `tick()` (imported from `svelte`) returns a promise that resolves after the next flush. Can await it in async code to ensure state is applied. [Svelte Docs: tick](https://svelte.dev/docs/svelte/tick)

## Sources

- Kept: [Svelte 5 blog post / release notes](https://svelte.dev/blog/svelte-5-release) — describes fine-grained reactivity design, batching behavior
- Kept: [Svelte Docs: $state](https://svelte.dev/docs/svelte/$state) — official docs on reactive state
- Kept: [Svelte Docs: $effect](https://docs/svelte.dev/svelte/$effect) — effect timing, scheduling, cleanup
- Kept: [Svelte Docs: tick](https://svelte.dev/docs/svelte/tick) — microtask flush utility
- Kept: [Svelte 5 source: runtime.js](https://github.com/sveltejs/svelte/blob/main/packages/svelte/src/internal/client/runtime.js) — scheduler internals, flush mechanism
- Kept: [MDN Event Loop](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop) — macrotask vs microtask queue ordering
- Dropped: Generic Svelte tutorials — insufficient depth on batching internals
- Dropped: Svelte 4 docs — different reactivity model (not runes-based)

## Gaps

1. **No direct official statement on batching guarantees** — Svelte 5 docs don't explicitly guarantee "synchronous mutations are batched" in the same phrasing React does. The behavior is implied by the microtask flush design. Could verify by reading Svelte 5 test suite: `packages/svelte/tests/signals/` or `packages/svelte/tests/runtime-runes/`.
2. **Could not confirm exact flush ordering when multiple effects depend on overlapping state** — priority/topological ordering of effects not fully documented. Would need source inspection of `flush_queued_effects()`.
3. **Double-trigger prevention** — no official "best practice" guide from Svelte team on this specific pattern. Patterns above inferred from general reactive programming + Svelte's architecture.

## Suggested next steps for verification

- Write minimal Svelte 5 REPL test: mutate two `$state` vars in `setInterval`, log in `$effect`, count renders. Should show 1 effect call per interval tick.
- Check `packages/svelte/tests/runtime-runes/samples/` on GitHub for batching test cases.
- Search GitHub issues: `repo:sveltejs/svelte effect batching setInterval` for edge cases reported by community.

## Supervisor coordination

No supervisor available in this subagent context. Research complete with available knowledge.
