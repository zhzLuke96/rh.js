import { inject } from "@rhjs/core";

import type { QueryClient } from "./QueryClient";
import { getClientKey } from "./utils";

export function injectQueryClient(id = ""): QueryClient {
  const key = getClientKey(id);
  const queryClient = inject<QueryClient>(key);

  if (!queryClient) {
    throw new Error(
      "No 'queryClient' found in Vue context, use 'VueQueryPlugin' to properly initialize the library."
    );
  }

  return queryClient;
}
