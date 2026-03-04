import type { DropshipAdapter, DropshipSearchItem, DropshipProductDetail, OrderStatusResult } from "./types.ts";

const NOT_IMPL = "Not implemented — DSers requires OAuth integration (Phase 2)";

export const dsersAdapter: DropshipAdapter = {
  async searchProducts(): Promise<DropshipSearchItem[]> { throw new Error(NOT_IMPL); },
  async getProduct(): Promise<DropshipProductDetail> { throw new Error(NOT_IMPL); },
  async importProduct() { throw new Error(NOT_IMPL); },
  async createOrder() { throw new Error(NOT_IMPL); },
  async getOrderStatus(): Promise<OrderStatusResult> { throw new Error(NOT_IMPL); },
  async syncInventory() { throw new Error(NOT_IMPL); },
  async syncPrice() { throw new Error(NOT_IMPL); },
};
