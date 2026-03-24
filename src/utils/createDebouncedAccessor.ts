import { createEffect, createSignal, onCleanup, type Accessor } from 'solid-js';

export function createDebouncedAccessor<T>(
  source: Accessor<T>,
  delayMs: number,
): Accessor<T> {
  const [debounced, setDebounced] = createSignal<T>(source());

  createEffect(() => {
    const nextValue = source();

    if (nextValue === null || delayMs <= 0) {
      setDebounced(() => nextValue);
      return;
    }

    const timeoutId = setTimeout(() => {
      setDebounced(() => nextValue);
    }, delayMs);

    onCleanup(() => clearTimeout(timeoutId));
  });

  return debounced;
}
