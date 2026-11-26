import { isTauri } from './env';

export interface PickedFile {
  name: string;
  size: number;
  type: string;
  file: File;
}

const MIME_BY_EXT: Record<string, string> = {
  pdf: 'application/pdf',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc: 'application/msword',
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',
  html: 'text/html',
  css: 'text/css',
  js: 'text/javascript',
  py: 'text/x-python',
  txt: 'text/plain',
  json: 'application/json',
};

function guessMime(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return MIME_BY_EXT[ext] || 'application/octet-stream';
}

export async function pickFiles(opts: {
  multiple?: boolean;
  accept?: string;
  extensions?: string[];
  title?: string;
}): Promise<PickedFile[]> {
  if (isTauri()) {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const { readFile } = await import('@tauri-apps/plugin-fs');
      const selected = await open({
        multiple: opts.multiple ?? false,
        title: opts.title,
        filters: opts.extensions
          ? [{ name: opts.title || 'Files', extensions: opts.extensions }]
          : undefined,
      });
      if (!selected) return [];
      const paths = Array.isArray(selected) ? selected : [selected];
      const results: PickedFile[] = [];
      for (const p of paths) {
        const bytes = await readFile(p);
        const name = p.split(/[\\/]/).pop() || 'file';
        const type = guessMime(name);
        const file = new File([bytes], name, { type });
        results.push({ name, size: file.size, type, file });
      }
      return results;
    } catch {
      // fall through to browser file input
    }
  }

  return new Promise<PickedFile[]>((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = !!opts.multiple;
    if (opts.accept) {
      input.accept = opts.accept;
    } else if (opts.extensions) {
      input.accept = opts.extensions.map((e) => `.${e}`).join(',');
    }
    input.onchange = () => {
      const files = Array.from(input.files || []);
      resolve(
        files.map((file) => ({
          name: file.name,
          size: file.size,
          type: file.type || guessMime(file.name),
          file,
        }))
      );
    };
    input.oncancel = () => resolve([]);
    input.click();
  });
}

export async function saveTextFile(filename: string, content: string): Promise<boolean> {
  if (isTauri()) {
    try {
      const { save } = await import('@tauri-apps/plugin-dialog');
      const { writeTextFile } = await import('@tauri-apps/plugin-fs');
      const dest = await save({ defaultPath: filename });
      if (!dest) return false;
      await writeTextFile(dest, content);
      return true;
    } catch {
      return false;
    }
  }

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return true;
}
