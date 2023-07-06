import {
  onScopeDispose,
  toRefs,
  readonly,
  reactive,
  createWatcher,
  computed,
  unref,
} from "@rhjs/core";
import type { ToRefs, UnwrapRef } from "@rhjs/core";
import type {
  QueryObserver,
  QueryKey,
  QueryObserverOptions,
  QueryObserverResult,
  QueryFunction,
} from "@tanstack/query-core";
import { injectQueryClient } from "./injectQueryClient";
import { updateState, isQueryKey, cloneDeepUnref } from "./utils";
import type { MaybeRef, WithQueryClientKey } from "./types";
import type { UseQueryOptions } from "./createQuery";
import type { UseInfiniteQueryOptions } from "./createInfiniteQuery";

export type UseQueryReturnType<
  TData,
  TError,
  Result = QueryObserverResult<TData, TError>
> = ToRefs<Readonly<Result>> & {
  suspense: () => Promise<Result>;
};

type UseQueryOptionsGeneric<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey = QueryKey
> =
  | UseQueryOptions<TQueryFnData, TError, TData, TQueryKey>
  | UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryKey>;

export function createBaseQuery<
  TQueryFnData,
  TError,
  TData,
  TQueryKey extends QueryKey
>(
  Observer: typeof QueryObserver,
  arg1:
    | TQueryKey
    | UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>,
  arg2:
    | QueryFunction<TQueryFnData, UnwrapRef<TQueryKey>>
    | UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey> = {},
  arg3: UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey> = {}
): UseQueryReturnType<TData, TError> {
  const options = computed(() => parseQueryArgs(arg1, arg2, arg3));

  const queryClient =
    options.value.queryClient ??
    injectQueryClient(options.value.queryClientKey);

  const defaultedOptions = computed(() => {
    const defaulted = queryClient.defaultQueryOptions(options.value);
    defaulted._optimisticResults = queryClient.isRestoring.value
      ? "isRestoring"
      : "optimistic";

    return defaulted;
  });

  const observer = new Observer(queryClient, defaultedOptions.value);
  const state = reactive(observer.getCurrentResult());

  let unsubscribe = () => {
    // noop
  };

  createWatcher(
    queryClient.isRestoring,
    (isRestoring) => {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (!isRestoring) {
        unsubscribe();
        unsubscribe = observer.subscribe((result) => {
          updateState(state, result);
        });
      }
    },
    { lazy: false }
  );

  createWatcher(
    defaultedOptions,
    () => {
      observer.setOptions(defaultedOptions.value);
      updateState(state, observer.getCurrentResult());
    }
    // TODO deep watch
    // { deep: true },
  );

  onScopeDispose(() => {
    unsubscribe();
  });

  const suspense = () => {
    return new Promise<QueryObserverResult<TData, TError>>((resolve) => {
      let stopWatch = () => {
        //noop
      };
      const run = () => {
        if (defaultedOptions.value.enabled !== false) {
          const optimisticResult = observer.getOptimisticResult(
            defaultedOptions.value
          );
          if (optimisticResult.isStale) {
            stopWatch();
            resolve(observer.fetchOptimistic(defaultedOptions.value));
          } else {
            stopWatch();
            resolve(optimisticResult);
          }
        }
      };

      run();

      const effectRunner = createWatcher(
        defaultedOptions,
        run
        // TODO: deep watch
        //  { deep: true }
      );
      stopWatch = () => effectRunner.runner.effect.stop();
    });
  };

  return {
    ...(toRefs(readonly(state)) as UseQueryReturnType<TData, TError>),
    suspense,
  };
}

export function parseQueryArgs<
  TQueryFnData = unknown,
  TError = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TQueryKey extends QueryKey = QueryKey
>(
  arg1:
    | MaybeRef<TQueryKey>
    | MaybeRef<UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>>,
  arg2:
    | MaybeRef<QueryFunction<TQueryFnData, UnwrapRef<TQueryKey>>>
    | MaybeRef<
        UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
      > = {},
  arg3: MaybeRef<
    UseQueryOptionsGeneric<TQueryFnData, TError, TData, TQueryKey>
  > = {}
): WithQueryClientKey<
  QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
> {
  const plainArg1 = unref(arg1);
  const plainArg2 = unref(arg2);
  const plainArg3 = unref(arg3);

  let options = plainArg1;

  if (!isQueryKey(plainArg1)) {
    options = plainArg1;
  } else if (typeof plainArg2 === "function") {
    options = { ...plainArg3, queryKey: plainArg1, queryFn: plainArg2 };
  } else {
    options = { ...plainArg2, queryKey: plainArg1 };
  }

  return cloneDeepUnref(options) as WithQueryClientKey<
    QueryObserverOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>
  >;
}
