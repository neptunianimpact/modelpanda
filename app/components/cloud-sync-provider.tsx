"use client";
import { useCloudSync } from "@/app/hooks/useCloudSync";

export function CloudSyncProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize cloud sync - this will automatically:
  // 1. Download from cloud on first login (if Pro)
  // 2. Upload changes with debouncing
  // 3. Periodic sync every 60 seconds
  useCloudSync();

  return <>{children}</>;
}
