"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type {
  MoodRecord,
  MoodRecordDraft,
} from "@/domain/entities/MoodRecord";
import { AppError } from "@/domain/repositories/AppError";
import { container } from "@/application/container";

interface RecordsContextValue {
  records: MoodRecord[];
  loading: boolean;
  error: AppError | null;
  reload: () => Promise<void>;
  createRecord: (draft: MoodRecordDraft) => Promise<MoodRecord>;
  updateRecord: (
    id: string,
    patch: Partial<MoodRecordDraft>
  ) => Promise<MoodRecord>;
  deleteRecord: (id: string) => Promise<void>;
  deleteAllRecords: () => Promise<void>;
}

const RecordsContext = createContext<RecordsContextValue | null>(null);

export function RecordsProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<MoodRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<AppError | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await container.recordService.listRecords();
      setRecords(list);
    } catch (e) {
      setError(
        AppError.isAppError(e)
          ? e
          : new AppError("STORAGE_UNAVAILABLE", "读取本地记录失败。")
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  const createRecord = useCallback(
    async (draft: MoodRecordDraft) => {
      const created = await container.recordService.createRecord(draft);
      await reload();
      return created;
    },
    [reload]
  );

  const updateRecord = useCallback(
    async (id: string, patch: Partial<MoodRecordDraft>) => {
      const updated = await container.recordService.updateRecord(id, patch);
      await reload();
      return updated;
    },
    [reload]
  );

  const deleteRecord = useCallback(
    async (id: string) => {
      await container.recordService.deleteRecord(id);
      await reload();
    },
    [reload]
  );

  const deleteAllRecords = useCallback(async () => {
    await container.recordRepository.deleteAll();
    await reload();
  }, [reload]);

  const value = useMemo<RecordsContextValue>(
    () => ({
      records,
      loading,
      error,
      reload,
      createRecord,
      updateRecord,
      deleteRecord,
      deleteAllRecords,
    }),
    [
      records,
      loading,
      error,
      reload,
      createRecord,
      updateRecord,
      deleteRecord,
      deleteAllRecords,
    ]
  );

  return (
    <RecordsContext.Provider value={value}>
      {children}
    </RecordsContext.Provider>
  );
}

export function useRecords(): RecordsContextValue {
  const ctx = useContext(RecordsContext);
  if (!ctx) {
    throw new Error("useRecords must be used within a RecordsProvider.");
  }
  return ctx;
}
