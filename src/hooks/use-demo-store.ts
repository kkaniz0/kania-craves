"use client";

import { useSyncExternalStore } from "react";
import {
  getStoreSnapshot,
  loadStore,
  subscribeStore,
} from "@/lib/demo/store";
import type { DemoStore } from "@/lib/types";
import { createDemoStore } from "@/lib/demo/seed";

const serverSnapshot = createDemoStore();

export function useDemoStore(): DemoStore {
  return useSyncExternalStore(
    subscribeStore,
    () => {
      loadStore();
      return getStoreSnapshot();
    },
    () => serverSnapshot,
  );
}
