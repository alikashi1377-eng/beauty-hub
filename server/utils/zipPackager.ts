import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const EXCLUDED_NAMES = new Set([
  'node_modules',
  '.git',
  '.aistudio',
  'dist',
  '.env',
  '.env.local',
  '.env.production',
  'beautyhub-liara-production.zip',
  '.DS_Store',
]);

const CRC_TABLE = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[n] = c >>> 0;
}

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function collectProjectFiles(
  dir: string,
  relPrefix = ''
): Array<{ fullPath: string; relPath: string }> {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files: Array<{ fullPath: string; relPath: string }> = [];

  for (const entry of entries) {
    if (EXCLUDED_NAMES.has(entry.name)) continue;
    if (entry.name.startsWith('.env') && entry.name !== '.env.example') {
      continue;
    }
    const fullPath = path.join(dir, entry.name);
    const relPath = relPrefix ? `${relPrefix}/${entry.name}` : entry.name;

    if (entry.isDirectory()) {
      files = files.concat(collectProjectFiles(fullPath, relPath));
    } else if (entry.isFile()) {
      files.push({ fullPath, relPath });
    }
  }

  return files;
}

export function buildProductionZipBuffer(
  rootDir = process.cwd()
): {
  buffer: Buffer;
  fileCount: number;
  relativePaths: string[];
} {
  const files = collectProjectFiles(rootDir).sort((a, b) =>
    a.relPath.localeCompare(b.relPath)
  );
  const localParts: Buffer[] = [];
  const centralParts: Buffer[] = [];
  let offset = 0;

  for (const file of files) {
    const rawData = fs.readFileSync(file.fullPath);
    const compressed = zlib.deflateRawSync(rawData, { level: 9 });
    const nameBuf = Buffer.from(file.relPath, 'utf8');
    const crc = crc32(rawData);

    const localHeader = Buffer.alloc(30);
    localHeader.writeUInt32LE(0x04034b50, 0);
    localHeader.writeUInt16LE(20, 4);
    localHeader.writeUInt16LE(0x0800, 6);
    localHeader.writeUInt16LE(8, 8);
    localHeader.writeUInt16LE(0, 10);
    localHeader.writeUInt16LE(0, 12);
    localHeader.writeUInt32LE(crc, 14);
    localHeader.writeUInt32LE(compressed.length, 18);
    localHeader.writeUInt32LE(rawData.length, 22);
    localHeader.writeUInt16LE(nameBuf.length, 26);
    localHeader.writeUInt16LE(0, 28);

    localParts.push(localHeader, nameBuf, compressed);

    const centralHeader = Buffer.alloc(46);
    centralHeader.writeUInt32LE(0x02014b50, 0);
    centralHeader.writeUInt16LE(20, 4);
    centralHeader.writeUInt16LE(20, 6);
    centralHeader.writeUInt16LE(0x0800, 8);
    centralHeader.writeUInt16LE(8, 10);
    centralHeader.writeUInt16LE(0, 12);
    centralHeader.writeUInt16LE(0, 14);
    centralHeader.writeUInt32LE(crc, 16);
    centralHeader.writeUInt32LE(compressed.length, 20);
    centralHeader.writeUInt32LE(rawData.length, 24);
    centralHeader.writeUInt16LE(nameBuf.length, 28);
    centralHeader.writeUInt16LE(0, 30);
    centralHeader.writeUInt16LE(0, 32);
    centralHeader.writeUInt16LE(0, 34);
    centralHeader.writeUInt16LE(0, 36);
    centralHeader.writeUInt32LE(0, 38);
    centralHeader.writeUInt32LE(offset, 42);

    centralParts.push(centralHeader, nameBuf);
    offset += localHeader.length + nameBuf.length + compressed.length;
  }

  const centralSize = centralParts.reduce((acc, b) => acc + b.length, 0);
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);
  eocd.writeUInt16LE(0, 4);
  eocd.writeUInt16LE(0, 6);
  eocd.writeUInt16LE(files.length, 8);
  eocd.writeUInt16LE(files.length, 10);
  eocd.writeUInt32LE(centralSize, 12);
  eocd.writeUInt32LE(offset, 16);
  eocd.writeUInt16LE(0, 20);

  const buffer = Buffer.concat([...localParts, ...centralParts, eocd]);
  return {
    buffer,
    fileCount: files.length,
    relativePaths: files.map((f) => f.relPath),
  };
}
