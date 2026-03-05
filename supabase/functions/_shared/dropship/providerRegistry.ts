import type { DropshipAdapter } from "./types.ts";
import { cjAdapter } from "./cj.adapter.ts";
import { modernDropshipAdapter } from "./moderndropship.adapter.ts";
import { dsersAdapter } from "./dsers.adapter.ts";
import { aliexpressAdapter } from "./aliexpress.adapter.ts";

const adapters: Record<string, DropshipAdapter> = {
  cj: cjAdapter,
  moderndropship: modernDropshipAdapter,
  dsers: dsersAdapter,
  aliexpress: aliexpressAdapter,
};

export function getAdapter(providerKey: string): DropshipAdapter | null {
  return adapters[providerKey] || null;
}
