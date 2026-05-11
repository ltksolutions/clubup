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
 *   4. Sanitizes Markdown patterns that are valid in Markdown but break MDX
 *      (HTML comments, type generics like Record<string, T> outside code,
 *      and stray <Something tokens that look like JSX openings).
 *   5. Skips the decisions/0000-template.md (it's a template, not a page)
 *
 * Why a script instead of symlinks: build determinism on Vercel (which
 * doesn't always preserve symlinks across workspaces) and the link
 * rewrite step, which is necessary because Nextra routes drop the .md
 * extension.
 *
 * Why we don't edit docs/ directly into MDX: that folder is the canonical
 * source consumed by editors, IDEs, GitHub renderers, and the REUSE
 * compliance tooling. Keeping it pure Markdown keeps it portable, and
 * REUSE headers in HTML-comment form are the standard pattern.
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
 * Sanitize MDX-hostile patterns OUTSIDE of code blocks and inline code.
 *
 * Why each pattern is here:
 *
 * 1) HTML comments `<!-- ... -->` are valid Markdown but MDX parses them
 *    as a JSX opening with `!` after `<`, which is illegal. REUSE-compliant
 *    docs/* files start with an SPDX HTML comment, so this fires a lot.
 *    Replacement: drop the comment entirely (the SPDX metadata is captured
 *    centrally by REUSE.toml; we don't need to render it).
 *
 * 2) Type generics like `Record<string, string[]>` written in plain text
 *    (typically inside table cells, where authors didn't wrap them in
 *    backticks). MDX reads `<string,` as a JSX tag with a comma, fails.
 *    Replacement: wrap the whole construct in backticks so it becomes
 *    inline code, which MDX leaves alone.
 *
 * 3) Lone `<` followed by uppercase letter (typically `<NázovEntity>`
 *    referring to a placeholder name in prose). MDX treats it as a JSX
 *    component. Replacement: HTML-escape the `<` to `&lt;`.
 *
 * The code-fence-aware splitting is the critical bit. Without it we'd
 * mangle TypeScript/JavaScript code samples that legitimately use these
 * patterns inside ```ts blocks.
 */
function sanitizeForMdx(content) {
  // Split on fenced code blocks (```...```), keeping the fences in place.
  // Even-indexed parts are prose, odd-indexed are code blocks (untouched).
  const parts = content.split(/(```[\s\S]*?```)/g);

  for (let i = 0; i < parts.length; i++) {
    if (i % 2 === 1) continue; // inside a fenced code block

    // Within prose, also temporarily mask inline code (`...`) so we don't
    // double-escape things authors already coded properly.
    const inlineCodes = [];
    let prose = parts[i].replace(/`[^`\n]+`/g, (m) => {
      inlineCodes.push(m);
      return `\u0000INLINE${inlineCodes.length - 1}\u0000`;
    });

    // (1) Drop HTML comments. Multi-line tolerant.
    prose = prose.replace(/<!--[\s\S]*?-->/g, '');

    // (2) Wrap generics like Record<X, Y>, Map<K, V>, Promise<T>, etc.
    //     Heuristic: an identifier (with optional dot, e.g. React.FC),
    //     immediately followed by `<`, then content up to a matching `>`
    //     that contains a comma or another generic. Conservative: only
    //     triggers when there's a comma or `[]` inside (typical generic).
    prose = prose.replace(
      /([A-Za-z_$][\w$.]*)<([^<>\n]*[,\[][^<>\n]*)>/g,
      (m) => '`' + m + '`',
    );

    // (3) Stray `<Word` not part of an HTML/JSX construct we recognize.
    //     Only escape if followed by an uppercase letter AND not closed
    //     by `>` on the same line (which would be a deliberate JSX use).
    //     This is conservative: we only escape `<` when the next char is
    //     a letter and there's no matching `>` within 80 chars on the
    //     same line.
    prose = prose.replace(/<(?=[A-Z])/g, (m, offset, str) => {
      const lineEnd = str.indexOf('\n', offset);
      const segment = str.slice(offset, lineEnd === -1 ? offset + 200 : lineEnd);
      // If a `>` appears within this line and the chunk looks tag-like,
      // assume the author meant a JSX tag and leave alone.
      if (/^<[A-Z][\w]*[\s/>]/.test(segment)) return m;
      return '&lt;';
    });

    // Restore inline codes.
    prose = prose.replace(/\u0000INLINE(\d+)\u0000/g, (_, idx) =>
      inlineCodes[Number(idx)],
    );

    parts[i] = prose;
  }

  return parts.join('');
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
      content = sanitizeForMdx(content);
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
