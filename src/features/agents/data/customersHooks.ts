/** React Query hooks for the customer identity + memory layer. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { customersRepo, type Customer } from "./customersDb";
import { useOrgId } from "./hooks";

const K = {
  list: (search: string) => ["agents", "customers", "list", search] as const,
  detail: (id: string) => ["agents", "customers", id] as const,
  identities: (id: string) => ["agents", "customers", id, "identities"] as const,
  timeline: (id: string) => ["agents", "customers", id, "timeline"] as const,
  memories: (id: string) => ["agents", "customers", id, "memories"] as const,
  context: (id: string) => ["agents", "customers", id, "context"] as const,
  calls: (id: string) => ["agents", "customers", id, "calls"] as const,
  conversations: (id: string) => ["agents", "customers", id, "conversations"] as const,
  appointments: (id: string) => ["agents", "customers", id, "appointments"] as const,
};

export function useCustomers(search = "") {
  const { data: orgId } = useOrgId();
  return useQuery({
    queryKey: [...K.list(search), orgId ?? "none"],
    queryFn: () => customersRepo.list(search),
    enabled: !!orgId,
  });
}

export function useCustomer(id?: string) {
  return useQuery({
    queryKey: K.detail(id ?? "none"),
    queryFn: () => customersRepo.get(id!),
    enabled: !!id,
  });
}

export function useCustomerIdentities(id?: string) {
  return useQuery({
    queryKey: K.identities(id ?? "none"),
    queryFn: () => customersRepo.identities(id!),
    enabled: !!id,
  });
}

export function useCustomerTimeline(id?: string) {
  return useQuery({
    queryKey: K.timeline(id ?? "none"),
    queryFn: () => customersRepo.timeline(id!),
    enabled: !!id,
  });
}

export function useCustomerMemories(id?: string) {
  return useQuery({
    queryKey: K.memories(id ?? "none"),
    queryFn: () => customersRepo.memories(id!),
    enabled: !!id,
  });
}

export function useCustomerContext(id?: string) {
  return useQuery({
    queryKey: K.context(id ?? "none"),
    queryFn: () => customersRepo.context(id!),
    enabled: !!id,
  });
}

export function useCustomerCalls(id?: string) {
  return useQuery({ queryKey: K.calls(id ?? "none"), queryFn: () => customersRepo.calls(id!), enabled: !!id });
}

export function useCustomerConversations(id?: string) {
  return useQuery({ queryKey: K.conversations(id ?? "none"), queryFn: () => customersRepo.conversations(id!), enabled: !!id });
}

export function useCustomerAppointments(id?: string) {
  return useQuery({ queryKey: K.appointments(id ?? "none"), queryFn: () => customersRepo.appointments(id!), enabled: !!id });
}

export function useUpdateCustomer(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<Customer>) => customersRepo.update(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.detail(id) });
      qc.invalidateQueries({ queryKey: ["agents", "customers", "list"] });
      toast.success("Customer updated");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not update customer"),
  });
}

export function useSaveCustomerMemory(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { memoryType: string; content: string; memoryKey?: string | null; confidence?: number }) =>
      customersRepo.saveMemory({ customerId, ...input }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.memories(customerId) });
      qc.invalidateQueries({ queryKey: K.timeline(customerId) });
      qc.invalidateQueries({ queryKey: K.context(customerId) });
      toast.success("Memory saved");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save memory"),
  });
}

export function useDeleteCustomerMemory(customerId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (memoryId: string) => customersRepo.deleteMemory(memoryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: K.memories(customerId) });
      qc.invalidateQueries({ queryKey: K.context(customerId) });
      toast.success("Memory deleted");
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not delete memory"),
  });
}

export function useResolveCustomer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { phone?: string | null; email?: string | null; name?: string | null; channel?: string | null }) =>
      customersRepo.resolve(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "customers", "list"] }),
    onError: (e: any) => toast.error(e?.message ?? "Could not resolve customer"),
  });
}
