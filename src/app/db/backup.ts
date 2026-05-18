import 'dexie-export-import';
import { db } from './schema';

export async function exportDatabase(): Promise<Blob> {
  return db.export({ prettyJson: true });
}

export async function downloadBackup(): Promise<void> {
  const blob = await exportDatabase();
  const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `gymdaily-backup-${stamp}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export async function importDatabase(file: File): Promise<void> {
  await db.delete();
  await db.open();
  await db.import(file, { acceptVersionDiff: true, clearTablesBeforeImport: true });
}
