// SPDX-FileCopyrightText: 2026 Ján Letko / LTK Solutions
// SPDX-License-Identifier: EUPL-1.2

/**
 * Mirror script — docs/ → src/apps/doc/content/
 *
 * The source of truth for documentation is /docs at the repository root.
 * Nextra 4 expects MDX content under content/ inside the doc app.
 * This script bridges the two:
 *
 *   1. Reads every .md and .mdx file from /docs
 *   2. Writes a corresponding .mdx file under content/
 *   3. Rewrites relative links from "*.md" → "" (Nextra route style)
 *   4. Renames internal directory references (case-sensitive on Linux)
 *   5. Skips the decisions/0000-template.md (it's a template, not a page)
 *
 * Why a script instead of symlinks: build determinism on Vercel (which
 * doesn't always preserve symlinks across workspaces) and the link
 * rewrite step, which is necessary because Nextra routes drop the .md
 * extension.
 *
 * Why we don't edit docs/ directly into MDX: that folder is the canonical
 * source consumed by editors, IDEs, GitHub renderers, and the REUSE
 * compliance tooling. Keeping it pure Markdown keeps it portable.
 *
 * The generated content/ folder is git-ignored.
 */

import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// /Users/.../clubup/src/apps/doc/scripts → /Users/.../clubup
const repoRoot = path.resolve(__dirname, '..', '..', '..', '..');
const sourceDir = path.join(repoRoot, 'docs');
const targetDir = path.join(__dirname, '..', 'content');

// Files we deliberately skip — templates, READMEs that would clash with
// folder index pages, etc.
const skip = new Set([
  'decisions/0000-template.md',
]);

/**
 * Recursively walk a directory and yield every file path (relative to root).
 */
async function* walk(dir, rel = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const abs = path.join(dir, entry.name);
    const relPath = rel ? `${rel}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      yield* walk(abs, relPath);
    } else if (entry.isFile()) {
      yield { abs, rel: relPath };
    }
  }
}

/**
 * Rewrite Markdown internal links so they work as Nextra routes.
 *
 *   [link](../foo.md)       → [link](../foo)
 *   [link](./bar/baz.md)    → [link](./bar/baz)
 *   [link](../../baz.md#h)  → [link](../../baz#h)
 *
 * External URLs (http*, mailto:) are left alone. So are non-doc files
 * referenced from docs (rare, but possible — e.g. ../LICENSE).
 */
function rewriteLinks(content) {
  // Markdown links: [text](url)
  return content.replace(/\]\(([^)]+)\)/g, (match, url) => {
    if (/^(https?:|mailto:|tel:|#)/i.test(url)) return match;
    // Strip .md / .mdx extension (preserving anchors and query strings)
    const rewritten = url.replace(/\.mdx?(?=$|[#?])/, '');
    return `](${rewritten})`;
  });
}

/**
 * Some docs files start with "# Title" but no YAML front-matter.
 * Nextra works fine without front-matter, but we add a minimal block
 * so the page title in browser tabs and OG metadata is set explicitly.
 */
function ensureFrontMatter(content, fallbackTitle) {
  if (content.startsWith('---\n')) return content;
  const titleMatch = content.match(/^#\s+(.+)$/m);
  const title = (titleMatch?.[1] ?? fallbackTitle).trim();
  return `---\ntitle: "${title.replace(/"/g, '\\"')}"\n---\n\n${content}`;
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

async function main() {
  // Clean target directory to avoid stale files after deletions in docs/.
  await fs.rm(targetDir, { recursive: true, force: true });
  await ensureDir(targetDir);

  let copied = 0;
  let skipped = 0;

  for await (const file of walk(sourceDir)) {
    if (skip.has(file.rel)) {
      skipped++;
      continue;
    }

    // Only .md and .mdx are content. Everything else (images, .json
    // examples) is copied verbatim so relative references keep working.
    const ext = path.extname(file.rel).toLowerCase();
    const isMarkdown = ext === '.md' || ext === '.mdx';

    const targetRel = isMarkdown ? file.rel.replace(/\.md$/, '.mdx') : file.rel;
    const targetPath = path.join(targetDir, targetRel);
    await ensureDir(path.dirname(targetPath));

    if (isMarkdown) {
      let content = await fs.readFile(file.abs, 'utf8');
      content = rewriteLinks(content);
      const fallback = path
        .basename(file.rel, path.extname(file.rel))
        .replace(/^\d+-/, '')
        .replace(/-/g, ' ');
      content = ensureFrontMatter(content, fallback);
      await fs.writeFile(targetPath, content, 'utf8');
    } else {
      await fs.copyFile(file.abs, targetPath);
    }
    copied++;
  }

  // eslint-disable-next-line no-console
  console.log(
    `[mirror-content] ${copied} files written to content/ (${skipped} skipped)`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error('[mirror-content] failed:', err);
  process.exit(1);
});
