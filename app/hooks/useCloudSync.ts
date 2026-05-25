"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/lib/auth-context";
import { useChatStore } from "@/app/store";
import { showToast } from "@/app/components/ui-lib";

const SYNC_DEBOUNCE_MS = 5000; // Wait 5 seconds after last change before syncing
const SYNC_INTERVAL_MS = 60000; // Auto-sync every 60 seconds if there are changes

interface SyncState {
  isSyncing: boolean;
  lastSyncTime: number | null;
  cloudVersion: number;
  error: string | null;
}

export function useCloudSync() {
  const { user, session } = useAuth();
  const [syncState, setSyncState] = useState<SyncState>({
    isSyncing: false,
    lastSyncTime: null,
    cloudVersion: 0,
    error: null,
  });

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const lastUploadHash = useRef<string>("");
  const hasInitialSync = useRef(false);
  const isPro = useRef(false);

  // Check if user is Pro by querying usage API
  useEffect(() => {
    if (!user || !session?.access_token) {
      isPro.current = false;
      return;
    }

    fetch(`/api/usage?userId=${user.id}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        isPro.current = data.plan === "pro";
        // If Pro, do initial sync (download from cloud)
        if (data.plan === "pro" && !hasInitialSync.current) {
          hasInitialSync.current = true;
          downloadFromCloud();
        }
      })
      .catch(() => {
        isPro.current = false;
      });
  }, [user, session?.access_token]);

  // Generate a simple hash of sessions to detect changes
  const getSessionsHash = useCallback((): string => {
    const sessions = useChatStore.getState().sessions;
    // Use lastUpdate timestamps and message counts as a quick hash
    return sessions
      .map((s) => `${s.id}:${s.lastUpdate}:${s.messages.length}`)
      .join("|");
  }, []);

  // Download sessions from cloud
  const downloadFromCloud = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));

      const res = await fetch("/api/sync", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (res.status === 403) {
        // Not a Pro user
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          error: "Pro feature",
        }));
        return;
      }

      if (!res.ok) {
        throw new Error(`Sync download failed: ${res.status}`);
      }

      const data = await res.json();

      if (data.sessions && data.sessions.length > 0) {
        const localSessions = useChatStore.getState().sessions;

        // Merge strategy: if local is empty or cloud is newer, use cloud data
        if (localSessions.length <= 1 && localSessions[0]?.messages.length === 0) {
          // Local is empty (only default empty session), replace with cloud
          useChatStore.setState({ sessions: data.sessions, currentSessionIndex: 0 });
          showToast("Cloud sync: Chat history restored");
        } else {
          // Both have data - merge by adding cloud sessions that don't exist locally
          const localIds = new Set(localSessions.map((s) => s.id));
          const newSessions = data.sessions.filter(
            (s: any) => !localIds.has(s.id),
          );

          if (newSessions.length > 0) {
            useChatStore.setState({
              sessions: [...localSessions, ...newSessions],
            });
            showToast(`Cloud sync: ${newSessions.length} conversations restored`);
          }
        }

        setSyncState((prev) => ({
          ...prev,
          cloudVersion: data.version,
          lastSyncTime: Date.now(),
        }));
      }

      setSyncState((prev) => ({ ...prev, isSyncing: false }));
    } catch (error: any) {
      console.error("[CloudSync] Download error:", error);
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error.message,
      }));
    }
  }, [session?.access_token]);

  // Upload sessions to cloud
  const uploadToCloud = useCallback(async () => {
    if (!session?.access_token || !isPro.current) return;

    const currentHash = getSessionsHash();
    if (currentHash === lastUploadHash.current) return; // No changes

    try {
      setSyncState((prev) => ({ ...prev, isSyncing: true, error: null }));

      const sessions = useChatStore.getState().sessions;

      // Filter out empty sessions and limit data size
      const sessionsToSync = sessions
        .filter((s) => s.messages.length > 0)
        .map((s) => ({
          id: s.id,
          topic: s.topic,
          messages: s.messages.slice(-100), // Keep last 100 messages per session
          stat: s.stat,
          lastUpdate: s.lastUpdate,
          lastSummarizeIndex: s.lastSummarizeIndex,
          mask: {
            ...s.mask,
            context: s.mask.context?.slice(-10) || [], // Limit context
          },
        }));

      const res = await fetch("/api/sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          sessions: sessionsToSync,
          version: syncState.cloudVersion,
        }),
      });

      if (res.status === 403) {
        setSyncState((prev) => ({
          ...prev,
          isSyncing: false,
          error: "Pro feature",
        }));
        return;
      }

      if (!res.ok) {
        throw new Error(`Sync upload failed: ${res.status}`);
      }

      const data = await res.json();
      lastUploadHash.current = currentHash;

      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        cloudVersion: data.version,
        lastSyncTime: Date.now(),
      }));
    } catch (error: any) {
      console.error("[CloudSync] Upload error:", error);
      setSyncState((prev) => ({
        ...prev,
        isSyncing: false,
        error: error.message,
      }));
    }
  }, [session?.access_token, syncState.cloudVersion, getSessionsHash]);

  // Debounced upload - called when sessions change
  const scheduleUpload = useCallback(() => {
    if (!isPro.current) return;

    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      uploadToCloud();
    }, SYNC_DEBOUNCE_MS);
  }, [uploadToCloud]);

  // Subscribe to store changes
  useEffect(() => {
    if (!user || !session?.access_token) return;

    const unsubscribe = useChatStore.subscribe((state, prevState) => {
      // Only trigger sync if sessions actually changed
      if (state.sessions !== prevState.sessions) {
        scheduleUpload();
      }
    });

    return () => {
      unsubscribe();
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [user, session?.access_token, scheduleUpload]);

  // Periodic sync interval
  useEffect(() => {
    if (!user || !session?.access_token || !isPro.current) return;

    const interval = setInterval(() => {
      uploadToCloud();
    }, SYNC_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [user, session?.access_token, uploadToCloud]);

  return {
    ...syncState,
    uploadToCloud,
    downloadFromCloud,
  };
}
