// ensure this file runs in Node.js context
export const runtime = "nodejs";

import { promises as fs } from "fs";
import path from "path";

/**
 * Creates parent folders if needed and writes `data` to
 * `${process.cwd()}/data/${filename}`
 */
export async function saveToFile(
  filename: string,
  data: string,
): Promise<void> {
  // build an absolute path under your project
  const dir = path.join(process.cwd(), "data");
  const file = path.join(dir, filename);

  // make sure the directory exists
  await fs.mkdir(dir, { recursive: true });
  // write the file
  await fs.writeFile(file, data, "utf8");
  console.log(`Saved ${filename} to ${file}`);
}
