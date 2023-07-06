export * from "@tanstack/query-core";

export { injectQueryClient } from "./injectQueryClient";

export { QueryClient } from "./QueryClient";
export { QueryCache } from "./QueryCache";
export { MutationCache } from "./MutationCache";
export { createQuery } from "./createQuery";
export { createQueries } from "./createQueries";
export { createInfiniteQuery } from "./createInfiniteQuery";
export { createMutation } from "./createMutation";
export { RHJS_QUERY_CLIENT as VUE_QUERY_CLIENT } from "./utils";

export type {
  UseQueryOptions,
  UseQueryReturnType,
  UseQueryDefinedReturnType,
} from "./createQuery";
export type {
  UseInfiniteQueryOptions,
  UseInfiniteQueryReturnType,
} from "./createInfiniteQuery";
export type {
  UseMutationOptions,
  UseMutationReturnType,
} from "./createMutation";
export type { UseQueriesOptions, UseQueriesResults } from "./createQueries";
