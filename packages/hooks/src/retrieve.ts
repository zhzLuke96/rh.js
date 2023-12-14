import stableHash from "stable-hash";
import { createContext, injectContext } from "./context";
import { createState } from "./state";
import { createWatcher } from "./watcher";

const fetchJson = (url: string) => fetch(url).then((res) => res.json());
const retrieveContext = createContext<{
  cache: Record<string, { data: any; updateAt: number }>;
  inflight: Record<string, Promise<any>>;
  errors: Record<string, any>;
}>({
  cache: {},
  inflight: {},
  errors: {},
});

export function createRetrieve<T, Payload extends any = string>(
  payload: string | (() => Payload),
  fetcher: (payload: Payload) => Promise<T> = fetchJson as any,
  options?: {
    onError?: (err?: any) => any;
    onSuccess?: (value: T) => any;
    initialData?: T;
    key?: (payload: Payload) => string;
    compare?: (a: T, b: T) => boolean;
    enabled?: () => boolean;
    noContextThrowError?: boolean;
  }
) {
  fetcher = fetcher || fetchJson;

  const { cache, inflight, errors } = injectContext(
    retrieveContext,
    options?.noContextThrowError ? undefined : retrieveContext.defaultValue
  );

  const [data, mutate] = createState<T | undefined>(options?.initialData);
  const [error, setError] = createState<any | undefined>(undefined);
  const [loading, setLoading] = createState(false);
  const [enabled, setEnabled] = createState(true);
  const [updateAt, setUpdateAt] = createState(0);

  const refetch = async (payload: Payload) => {
    const key = options?.key?.(payload) || stableHash(payload);
    const inflightPromise = inflight[key];
    if (inflightPromise) {
      return inflightPromise;
    }
    const cached = cache[key];
    if (cached) {
      mutate(cached.data);
      return cached.data;
    }
    const promise = fetcher(payload);
    inflight[key] = promise;
    setLoading(true);
    try {
      const result = await promise;
      mutate(result);
      cache[key] = { data: result, updateAt: Date.now() };
      options?.onSuccess?.(result);
      setUpdateAt(Date.now());
      return result;
    } catch (err) {
      errors[key] = err;
      options?.onError?.(err);
      setError(err);
      throw err;
    } finally {
      setLoading(false);
      delete inflight[key];
    }
  };

  const preload = (payload: Payload) => {
    const key = options?.key?.(payload) || stableHash(payload);
    if (cache[key] !== undefined || inflight[key] !== undefined) {
      return;
    }
    refetch(payload);
  };

  const clear = (payload?: Payload) => {
    if (payload === undefined) {
      for (const key of Object.keys(cache)) {
        delete cache[key];
      }
      return;
    }
    const key = options?.key?.(payload) || stableHash(payload);
    delete cache[key];
  };

  createWatcher(
    () => ({
      enabled: options?.enabled ? options.enabled() : true,
      payload: typeof payload === "function" ? payload() : payload,
    }),
    ({ enabled, payload }) => {
      setEnabled(enabled);
      if (!enabled) {
        return;
      }
      refetch(payload as Payload);
    }
  );

  return [
    data,
    {
      error,
      loading,
      enabled,
      updateAt,
      clear,
      mutate,
      refetch,
      preload,
    },
  ] as const;
}
createRetrieve.context = retrieveContext;
