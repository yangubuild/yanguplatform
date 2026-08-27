import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrgId } from "./hooks";
import {
  listThreads, getThread, listMessages, deleteThread, sendBuilderTurn,
  saveDraftAgent, voiceOps, type BuilderThread,
} from "./builderDb";

const K = {
  threads: ["agents", "builder", "threads"] as const,
  thread: (id?: string) => ["agents", "builder", "thread", id] as const,
  messages: (id?: string) => ["agents", "builder", "messages", id] as const,
};

export function useBuilderThreads() {
  const { data: orgId } = useOrgId();
  return useQuery({ queryKey: K.threads, queryFn: listThreads, enabled: !!orgId, staleTime: 15_000 });
}

export function useBuilderThread(id: string | undefined) {
  return useQuery({ queryKey: K.thread(id), queryFn: () => getThread(id!), enabled: !!id });
}

export function useBuilderMessages(id: string | undefined) {
  return useQuery({ queryKey: K.messages(id), queryFn: () => listMessages(id!), enabled: !!id });
}

export function useSendBuilderTurn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: sendBuilderTurn,
    onSuccess: (turn) => {
      qc.invalidateQueries({ queryKey: K.threads });
      qc.invalidateQueries({ queryKey: K.thread(turn.threadId) });
      qc.invalidateQueries({ queryKey: K.messages(turn.threadId) });
    },
  });
}

export function useDeleteBuilderThread() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteThread,
    onSuccess: () => qc.invalidateQueries({ queryKey: K.threads }),
  });
}

export function useSaveDraftAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (thread: BuilderThread) => saveDraftAgent(thread),
    onSuccess: (_id, thread) => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.invalidateQueries({ queryKey: K.thread(thread.id) });
      qc.invalidateQueries({ queryKey: K.threads });
    },
  });
}

export function useVoiceStatus() {
  return useQuery({ queryKey: ["agents", "voice", "status"], queryFn: voiceOps.status, staleTime: 60_000, retry: 0 });
}

export function useDeployAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => voiceOps.deploy(agentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["agents"] });
      qc.invalidateQueries({ queryKey: K.threads });
    },
  });
}

export function useSetAgentRunState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ agentId, next }: { agentId: string; next: "pause" | "resume" }) =>
      next === "pause" ? voiceOps.pause(agentId) : voiceOps.resume(agentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents"] }),
  });
}

export function useSyncAgentCalls() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (agentId: string) => voiceOps.syncCalls(agentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["agents", "calls"] }),
  });
}
