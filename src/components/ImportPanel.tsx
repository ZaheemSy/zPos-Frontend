import { useState } from 'react';
import { Download, Upload, Check, X, AlertTriangle, CheckCircle2 } from 'lucide-react';
import Card from './ui/Card';
import Button from './ui/Button';
import Badge from './ui/Badge';
import { Table, THead, TBody, Tr, Th, Td } from './ui/Table';
import { downloadBlob } from '../utils/downloadBlob';
import { getErrorMessage } from '../utils/errorMessage';
import type { ImportPreviewResult } from '../api/import.types';

export interface ImportColumn<T> {
  key: keyof T;
  label: string;
  type?: 'text' | 'number';
}

interface ImportRowState<T> {
  row: number;
  data: T;
  status: 'ok' | 'warning' | 'error';
  message?: string;
  checked: boolean;
}

interface ImportPanelProps<T extends Record<string, string | number>> {
  title: string;
  columns: ImportColumn<T>[];
  templateFilename: string;
  onDownloadTemplate: () => Promise<Blob>;
  onValidateFile: (file: File) => Promise<ImportPreviewResult<T>>;
  onCommit: (rows: T[]) => Promise<{ created: number }>;
  validateRow: (data: T) => string | undefined;
  onImported: () => void;
}

export default function ImportPanel<T extends Record<string, string | number>>({
  title,
  columns,
  templateFilename,
  onDownloadTemplate,
  onValidateFile,
  onCommit,
  validateRow,
  onImported,
}: ImportPanelProps<T>) {
  const [expanded, setExpanded] = useState(false);
  const [rows, setRows] = useState<ImportRowState<T>[] | null>(null);
  const [parsing, setParsing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ created: number } | null>(null);

  async function handleDownloadTemplate() {
    try {
      const blob = await onDownloadTemplate();
      downloadBlob(blob, templateFilename);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to download template'));
    }
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setError(null);
    setResult(null);
    setParsing(true);
    try {
      const preview = await onValidateFile(file);
      setRows(
        preview.rows.map((r) => ({
          ...r,
          checked: r.status !== 'error',
        })),
      );
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to read this file'));
    } finally {
      setParsing(false);
    }
  }

  function updateCell(index: number, key: keyof T, value: string) {
    setRows((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      const row = { ...next[index] };
      row.data = { ...row.data, [key]: value };
      const message = validateRow(row.data);
      row.status = message ? 'error' : row.status === 'error' ? 'ok' : row.status;
      row.message = message ?? (row.status === 'warning' ? row.message : undefined);
      row.checked = !message;
      next[index] = row;
      return next;
    });
  }

  function toggleChecked(index: number) {
    setRows((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next[index] = { ...next[index], checked: !next[index].checked };
      return next;
    });
  }

  async function handleConfirm() {
    if (!rows) return;
    const toImport = rows.filter((r) => r.checked && r.status !== 'error').map((r) => r.data);
    if (toImport.length === 0) return;
    setError(null);
    setSubmitting(true);
    try {
      const res = await onCommit(toImport);
      setResult(res);
      setRows(null);
      onImported();
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to import'));
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancel() {
    setRows(null);
    setError(null);
    setResult(null);
  }

  const checkedCount = rows?.filter((r) => r.checked && r.status !== 'error').length ?? 0;
  const errorCount = rows?.filter((r) => r.status === 'error').length ?? 0;

  return (
    <Card className="mb-6">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between text-left"
      >
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-200">
          <Upload size={16} className="text-brand-400" />
          {title}
        </h2>
        <span className="text-xs text-zinc-500">{expanded ? 'Hide' : 'Show'}</span>
      </button>

      {expanded && (
        <div className="mt-4 flex flex-col gap-4">
          {!rows && (
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="secondary" onClick={handleDownloadTemplate} icon={<Download size={15} />}>
                Download template
              </Button>
              <label>
                <span className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-500">
                  <Upload size={15} />
                  {parsing ? 'Reading file...' : 'Upload file'}
                </span>
                <input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  disabled={parsing}
                  onChange={handleFileChange}
                />
              </label>
            </div>
          )}

          {error && (
            <p role="alert" className="text-sm text-red-400">
              {error}
            </p>
          )}

          {result && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
              <CheckCircle2 size={15} />
              Imported {result.created} record(s).
            </div>
          )}

          {rows && (
            <>
              <div className="flex flex-wrap items-center gap-3 text-sm text-zinc-400">
                <span>
                  <span className="font-medium text-zinc-100">{checkedCount}</span> ready to import
                </span>
                {errorCount > 0 && (
                  <Badge tone="danger">
                    {errorCount} row(s) need fixing
                  </Badge>
                )}
              </div>

              <Table>
                <THead>
                  <tr>
                    <Th></Th>
                    {columns.map((col) => (
                      <Th key={String(col.key)}>{col.label}</Th>
                    ))}
                    <Th>Status</Th>
                  </tr>
                </THead>
                <TBody>
                  {rows.map((r, index) => (
                    <Tr key={r.row}>
                      <Td>
                        <input
                          type="checkbox"
                          checked={r.checked && r.status !== 'error'}
                          disabled={r.status === 'error'}
                          onChange={() => toggleChecked(index)}
                          className="h-4 w-4 rounded border-surface-400 bg-surface-100 accent-brand-600"
                        />
                      </Td>
                      {columns.map((col) => (
                        <Td key={String(col.key)}>
                          <input
                            type={col.type ?? 'text'}
                            value={r.data[col.key] as string | number}
                            onChange={(e) => updateCell(index, col.key, e.target.value)}
                            className={
                              'w-full min-w-[7rem] rounded-md border bg-surface-100 px-2 py-1 text-xs text-zinc-100 ' +
                              (r.status === 'error' ? 'border-red-500/60' : 'border-surface-400')
                            }
                          />
                        </Td>
                      ))}
                      <Td>
                        {r.status === 'error' && (
                          <Badge tone="danger">
                            <AlertTriangle size={11} className="mr-1 inline" />
                            {r.message}
                          </Badge>
                        )}
                        {r.status === 'warning' && <Badge tone="warning">{r.message}</Badge>}
                        {r.status === 'ok' && <Badge tone="success">OK</Badge>}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>

              <div className="flex gap-2">
                <Button
                  onClick={handleConfirm}
                  disabled={submitting || checkedCount === 0}
                  icon={<Check size={16} />}
                >
                  {submitting ? 'Importing...' : `Confirm import (${checkedCount})`}
                </Button>
                <Button variant="ghost" onClick={handleCancel} icon={<X size={16} />}>
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
