import { ref, untrack } from "@rhjs/core";
import { createState } from "./state";

export type ResourceFetcher<T, ARGS extends any[] = any[]> = (
  ...args: ARGS
) => PromiseLike<T>;

export function createResource<T>(
  fetcher: ResourceFetcher<T>,
  options?: {
    onError?: (err?: any) => any;
    onSuccess?: (value: T) => any;
    initialData?: T;
    manual?: boolean;
  }
) {
  const [data, mutate] = createState<T | undefined>(options?.initialData);

  const fetching = ref(false);
  const enabled = ref(true);
  const error = ref<any>(null);

  let inflight = null as any;

  const refetch = async (): Promise<T | undefined> => {
    if (inflight) return inflight;
    if (!untrack(enabled)) {
      return;
    }
    try {
      fetching.value = true;
      inflight = fetcher();
      const result = await inflight;
      mutate(result);
      options?.onSuccess?.(result);
      return result;
    } catch (err) {
      error.value = err;
      options?.onError?.(err);
    } finally {
      inflight = null;
      fetching.value = false;
    }
  };

  if (!options?.manual) {
    refetch();
  }

  return [
    data,
    {
      mutate,
      refetch,
      fetching,
      enabled,
      error,
    },
  ] as const;
}
