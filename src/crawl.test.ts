import { describe, expect, test } from 'vitest';
import { normalizeURL, getH1FromHTML, getFirstParagraphFromHTML } from './crawl'

// --- Test Suite for normalizeURL ---
describe('normalizeURL', () => {
  test('should normalize a simple HTTPS URL', () => {
    const input = 'https://blog.boot.dev/path';
    const expected = 'blog.boot.dev/path';
    expect(normalizeURL(input)).toBe(expected);
  });

  test('should normalize an HTTP URL', () => {
    const input = 'http://blog.boot.dev/path';
    const expected = 'blog.boot.dev/path';
    expect(normalizeURL(input)).toBe(expected);
  });

  test('should remove default port 80 (HTTP)', () => {
    const input = 'http://blog.boot.dev:80/path';
    const expected = 'blog.boot.dev/path';
    expect(normalizeURL(input)).toBe(expected);
  });

  test('should remove default port 443 (HTTPS)', () => {
    const input = 'https://blog.boot.dev:443/path';
    const expected = 'blog.boot.dev/path';
    expect(normalizeURL(input)).toBe(expected);
  });

  test('should keep non-default ports', () => {
    const input = 'https://blog.boot.dev:8080/path';
    const expected = 'blog.boot.dev:8080/path';
    expect(normalizeURL(input)).toBe(expected);
  });

  test('should convert hostname to lowercase', () => {
    const input = 'https://BLOG.bOot.dev/path';
    const expected = 'blog.boot.dev/path';
    expect(normalizeURL(input)).toBe(expected);
  });

  test('should handle URLs with multiple trailing slashes', () => {
    const input = 'https://blog.boot.dev/path///';
    const expected = 'blog.boot.dev/path';
    expect(normalizeURL(input)).toBe(expected);
  });

  test('should throw an error for an invalid URL string', () => {
    const input = 'invalid url string';
    expect(() => normalizeURL(input)).toThrow('Invalid URL');
  });

  test('should throw an error for an empty or whitespace-only string', () => {
    expect(() => normalizeURL('')).toThrow('Invalid URL');
    expect(() => normalizeURL('   ')).toThrow('Invalid URL');
  });
});

// --- Test Suite for getH1FromHTML ---
describe('getH1FromHTML', () => {
  test('should extract the h1 content correctly', () => {
    const html = '<html><body><h1>Welcome to the site</h1></body></html>';
    const expected = 'Welcome to the site';
    expect(getH1FromHTML(html)).toBe(expected);
  });

  test('should return an empty string if no h1 is present', () => {
    const html = '<html><body><h2>Not an h1</h2><p>some text</p></body></html>';
    const expected = '';
    expect(getH1FromHTML(html)).toBe(expected);
  });

  test('should handle extra whitespace in h1 content', () => {
    const html = '<html><body><h1>  Extra Whitespace  </h1></body></html>';
    const expected = 'Extra Whitespace';
    expect(getH1FromHTML(html)).toBe(expected);
  });
});

// --- Test Suite for getFirstParagraphFromHTML ---
describe('getFirstParagraphFromHTML', () => {
  test('should get the first paragraph within the main element', () => {
    const html = `
      <html>
        <body>
          <p>Ignored paragraph</p>
          <main>
            <p>This is the first main paragraph.</p>
            <p>This is the second main paragraph.</p>
          </main>
        </body>
      </html>
    `;
    const expected = 'This is the first main paragraph.';
    expect(getFirstParagraphFromHTML(html)).toBe(expected);
  });

  test('should get the first paragraph in the body if no main is present', () => {
    const html = `
      <html>
        <body>
          <p>This is the first paragraph.</p>
          <div>
            <p>This is inside a div.</p>
          </div>
        </body>
      </html>
    `;
    const expected = 'This is the first paragraph.';
    expect(getFirstParagraphFromHTML(html)).toBe(expected);
  });

  test('should return an empty string if no paragraphs are found', () => {
    const html = '<html><body><h1>Title</h1><div>No paragraphs here.</div></body></html>';
    const expected = '';
    expect(getFirstParagraphFromHTML(html)).toBe(expected);
  });

  test('should handle whitespace around the paragraph text', () => {
    const html = `
      <html>
        <body>
          <main>
            <p>  Some text with whitespace  </p>
          </main>
        </body>
      </html>
    `;
    const expected = 'Some text with whitespace';
    expect(getFirstParagraphFromHTML(html)).toBe(expected);
  });
});

// --- Test Suite for getFirstParagraphFromHTML ---
