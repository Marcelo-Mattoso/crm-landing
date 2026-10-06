import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const siteDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function findHtml(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'tests') return [];
    if (statSync(path).isDirectory()) return findHtml(path);
    return name.endsWith('.html') ? [path] : [];
  });
}

const pages = findHtml(siteDir);

function findText(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === 'tests') return [];
    if (statSync(path).isDirectory()) return findText(path);
    return /[.](html|css|js|svg)$/.test(name) ? [path] : [];
  });
}

test('tokens.css defines every minimum token', () => {
  const css = readFileSync(join(siteDir, 'css', 'tokens.css'), 'utf8');
  const required = ['primary', 'secondary', 'bg', 'bg-raised', 'text', 'muted', 'primary-deep', 'line', 'gradient', 'radius', 'font-body', 'font-accent', 'on-primary'];
  for (const token of required) {
    assert.match(css, new RegExp(`--${token}\\s*:`), `missing --${token}`);
  }
});

test('every page has exactly one h1', () => {
  for (const page of pages) {
    const count = (readFileSync(page, 'utf8').match(/<h1[\s>]/g) || []).length;
    assert.equal(count, 1, page);
  }
});

test('every img has alt', () => {
  for (const page of pages) {
    for (const tag of readFileSync(page, 'utf8').match(/<img\b[^>]*>/g) || []) {
      assert.match(tag, /\balt="/, `${page}: ${tag}`);
    }
  }
});

test('internal links and stylesheets resolve', () => {
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    for (const [, href] of html.replace(/<base [^>]*>/, "").matchAll(/(?:href|src)="([^"]*)"/g)) {
      if (/^(https?:|mailto:|tel:|#$)/.test(href)) continue;
      const [file, hash] = href.split('#');
      const target = file ? resolve(dirname(page), file) : page;
      const path = existsSync(target) && statSync(target).isDirectory() ? join(target, 'index.html') : target;
      assert.ok(existsSync(path), `${page}: ${href}`);
      if (hash) {
        assert.match(readFileSync(path, 'utf8'), new RegExp(`id="${hash}"`), `${page}: ${href}`);
      }
    }
  }
});

test('removed features are gone from the site', () => {
  const forbidden = ['theme-toggle', 'theme-boot', 'theme.js', 'data-theme', 'prefers-color-scheme', 'localStorage', 'Space Grotesk', 'space-grotesk', 'Georgia', '--font-brand', 'ornament', 'hero-art', 'device-bar', 'device-dot', 'button-outline', 'button-icon'];
  for (const file of findText(siteDir)) {
    const text = readFileSync(file, 'utf8');
    for (const word of forbidden) {
      assert.ok(!text.includes(word), `${file}: ${word}`);
    }
  }
  assert.ok(!existsSync(join(siteDir, 'fonts', 'space-grotesk.woff2')));
});

test('every page has a single theme-color and preloads Anton', () => {
  for (const page of pages) {
    const html = readFileSync(page, 'utf8');
    assert.equal((html.match(/<meta name="theme-color"/g) || []).length, 1, page);
    assert.match(html, /<link rel="preload" href="[^"]*fonts[/]anton[.]woff2"/, page);
  }
});
