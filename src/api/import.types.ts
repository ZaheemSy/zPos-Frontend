export interface ImportPreviewRow<T> {
  row: number;
  data: T;
  status: 'ok' | 'warning' | 'error';
  message?: string;
}

export interface ImportPreviewResult<T> {
  rows: ImportPreviewRow<T>[];
}
