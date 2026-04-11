'use client';

import { useRef, useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

export interface UploadedDoc {
  id: string;
  file: File;
  category: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  progress: number;
  errorMessage?: string;
  mockDocId?: string;
}

export interface DocumentsData {
  documents: UploadedDoc[];
}

interface Step4Props {
  data: DocumentsData;
  onChange: (data: DocumentsData) => void;
}

const CATEGORIES = [
  { value: 'strategic_plan', label: 'Strategic Plan' },
  { value: 'grant_proposal', label: 'Grant Proposal' },
  { value: 'donor_list', label: 'Donor / Supporter List' },
  { value: 'financial_statement', label: 'Financial Statement / Budget' },
  { value: 'program_description', label: 'Program Description' },
  { value: 'marketing_materials', label: 'Marketing Materials / Brand Guide' },
  { value: 'event_plan', label: 'Event Plan' },
  { value: 'staff_roster', label: 'Staff / Volunteer Roster' },
  { value: 'board_documents', label: 'Board Documents' },
  { value: 'other', label: 'Other' },
];

const ACCEPTED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function fileExtension(filename: string) {
  return filename.split('.').pop()?.toUpperCase() ?? 'FILE';
}

export function Step4Documents({ data, onChange }: Step4Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Internal docs state so we can use functional updates in async upload handlers
  const [docs, setDocsInternal] = useState<UploadedDoc[]>(data.documents);

  const setDocs = (updater: UploadedDoc[] | ((prev: UploadedDoc[]) => UploadedDoc[])) => {
    setDocsInternal((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      onChange({ documents: next });
      return next;
    });
  };

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArr = Array.from(files);
      const newDocs: UploadedDoc[] = [];

      for (const file of fileArr) {
        if (!ACCEPTED_TYPES.includes(file.type) && file.type !== '') {
          // still allow if type is empty (some OS don't report MIME correctly)
          const ext = file.name.split('.').pop()?.toLowerCase();
          const allowed = ['pdf', 'doc', 'docx', 'txt', 'csv', 'xls', 'xlsx'];
          if (!ext || !allowed.includes(ext)) continue;
        }
        if (file.size > MAX_SIZE_BYTES) {
          newDocs.push({
            id: crypto.randomUUID(),
            file,
            category: 'other',
            status: 'error',
            progress: 0,
            errorMessage: 'File exceeds 10MB limit',
          });
          continue;
        }
        newDocs.push({
          id: crypto.randomUUID(),
          file,
          category: 'other',
          status: 'pending',
          progress: 0,
        });
      }

      const combined = [...docs, ...newDocs];
      setDocs(combined);

      // Upload each pending doc
      for (const doc of newDocs) {
        if (doc.status === 'error') continue;
        uploadDoc(doc);
      }
    },
    [docs] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const uploadDoc = async (doc: UploadedDoc) => {
    const { id } = doc;

    // Mark uploading
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, status: 'uploading' as const, progress: 10 } : d));

    try {
      // Simulate progress ticks
      await simulateProgress(id);

      const formData = new FormData();
      formData.append('file', doc.file);
      formData.append('category', doc.category);

      const res = await fetch('/api/briefing/upload', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      setDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: 'done' as const, progress: 100, mockDocId: json.docId }
            : d
        )
      );
    } catch {
      setDocs((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, status: 'error' as const, progress: 0, errorMessage: 'Upload failed. Try again.' }
            : d
        )
      );
    }
  };

  const simulateProgress = (id: string) =>
    new Promise<void>((resolve) => {
      let progress = 10;
      const tick = setInterval(() => {
        progress = Math.min(progress + Math.random() * 25, 85);
        setDocs((prev) => prev.map((d) => d.id === id ? { ...d, progress: Math.round(progress) } : d));
        if (progress >= 85) {
          clearInterval(tick);
          resolve();
        }
      }, 200);
    });

  const updateCategory = (id: string, category: string) => {
    setDocs((prev) => prev.map((d) => d.id === id ? { ...d, category } : d));
  };

  const removeDoc = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-6 animate-slide-up">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50">
          <Upload className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Upload documents to brief your team
          </h2>
          <p className="text-sm text-slate-500">
            The more context your team has, the better they can help. You can also skip this and add documents later.
          </p>
        </div>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging
            ? 'border-brand-400 bg-brand-50'
            : 'border-slate-200 bg-slate-50 hover:border-brand-300 hover:bg-brand-50/50'
        }`}
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
          <Upload className="h-5 w-5 text-brand-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">
            Drop files here, or{' '}
            <span className="text-brand-600 underline underline-offset-2">browse</span>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            PDF, DOC, DOCX, TXT, CSV, XLS, XLSX &mdash; up to 10MB each
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.doc,.docx,.txt,.csv,.xls,.xlsx"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>

      {/* File list */}
      {docs.length > 0 && (
        <div className="space-y-3">
          {docs.map((doc) => (
            <div
              key={doc.id}
              className="rounded-xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start gap-3">
                {/* File icon */}
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-bold text-slate-600">
                  {fileExtension(doc.file.name)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">
                        {doc.file.name}
                      </p>
                      <p className="text-xs text-slate-400">{formatBytes(doc.file.size)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeDoc(doc.id)}
                      className="shrink-0 text-slate-300 hover:text-red-400 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Category */}
                  {doc.status !== 'error' && (
                    <div className="mt-2">
                      <select
                        value={doc.category}
                        onChange={(e) => updateCategory(doc.id, e.target.value)}
                        className="input-field py-1.5 text-xs"
                        disabled={doc.status === 'uploading'}
                      >
                        {CATEGORIES.map((c) => (
                          <option key={c.value} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Progress bar */}
                  {doc.status === 'uploading' && (
                    <div className="mt-2 space-y-1">
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                        <div
                          className="h-full rounded-full bg-brand-500 transition-all duration-300"
                          style={{ width: `${doc.progress}%` }}
                        />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        Uploading...
                      </div>
                    </div>
                  )}

                  {/* Done */}
                  {doc.status === 'done' && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-600">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Your team has this document
                    </div>
                  )}

                  {/* Error */}
                  {doc.status === 'error' && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" />
                      {doc.errorMessage ?? 'Something went wrong'}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {docs.length === 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-4 py-3">
          <FileText className="h-4 w-4 shrink-0 text-slate-400" />
          <p className="text-sm text-slate-500">
            No documents yet. You can skip this step and upload later from Settings.
          </p>
        </div>
      )}
    </div>
  );
}
