/**
 * Future import adapters (Google Maps Saved Places, CSV, Excel, Notion).
 * MVP uses manual entry only.
 */
export interface ImportAdapter {
  readonly name: string;
  parse(input: File | string): Promise<ImportRow[]>;
}

export interface ImportRow {
  name: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
  listName?: string;
}

export class CsvImportAdapter implements ImportAdapter {
  readonly name = "csv";

  async parse(input: File | string): Promise<ImportRow[]> {
    const text = typeof input === "string" ? input : await input.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    if (lines.length < 2) return [];
    const headers = lines[0]!.split(",").map((h) => h.trim().toLowerCase());
    return lines.slice(1).map((line) => {
      const cols = line.split(",");
      const row: Record<string, string> = {};
      headers.forEach((h, i) => {
        row[h] = (cols[i] ?? "").trim();
      });
      return {
        name: row.name || row.restaurant || "",
        address: row.address,
        latitude: row.latitude ? Number(row.latitude) : undefined,
        longitude: row.longitude ? Number(row.longitude) : undefined,
        notes: row.notes,
        listName: row.list || row.collection,
      };
    });
  }
}
