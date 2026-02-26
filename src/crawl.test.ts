import { describe, expect, test } from 'vitest';
import { normalizeURL, getH1FromHTML, getFirstParagraphFromHTML, getImagesFromHTML, getURLsFromHTML, extractPageData } from './crawl'
import type { ExtractedPageData } from './crawl';

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


// --- Additional Tests for getURLsFromHTML --- //

test("getURLsFromHTML handles absolute URLs", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html>
      <body>
        <a href="https://example.com/page">External</a>
      </body>
    </html>
  `;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://example.com/page"];

  expect(actual).toEqual(expected);
});

test("getURLsFromHTML handles multiple links", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html>
      <body>
        <a href="/one">One</a>
        <a href="/two">Two</a>
      </body>
    </html>
  `;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = [
    "https://blog.boot.dev/one",
    "https://blog.boot.dev/two"
  ];

  expect(actual).toEqual(expected);
});

test("getURLsFromHTML ignores anchor tags without href", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html>
      <body>
        <a>No href</a>
        <a href="/valid">Valid</a>
      </body>
    </html>
  `;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev/valid"];

  expect(actual).toEqual(expected);
});

test("getURLsFromHTML returns empty array if no links exist", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><div>No links</div></body></html>`;

  const actual = getURLsFromHTML(inputBody, inputURL);
  const expected: string[] = [];

  expect(actual).toEqual(expected);
});


// --- Additional Tests for getImagesFromHTML --- //

test("getImagesFromHTML handles absolute image URLs", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html>
      <body>
        <img src="https://example.com/image.png" />
      </body>
    </html>
  `;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = ["https://example.com/image.png"];

  expect(actual).toEqual(expected);
});

test("getImagesFromHTML handles multiple images", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html>
      <body>
        <img src="/one.png" />
        <img src="/two.png" />
      </body>
    </html>
  `;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = [
    "https://blog.boot.dev/one.png",
    "https://blog.boot.dev/two.png"
  ];

  expect(actual).toEqual(expected);
});

test("getImagesFromHTML ignores img tags without src", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `
    <html>
      <body>
        <img />
        <img src="/valid.png" />
      </body>
    </html>
  `;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected = ["https://blog.boot.dev/valid.png"];

  expect(actual).toEqual(expected);
});

test("getImagesFromHTML returns empty array if no images exist", () => {
  const inputURL = "https://blog.boot.dev";
  const inputBody = `<html><body><div>No images</div></body></html>`;

  const actual = getImagesFromHTML(inputBody, inputURL);
  const expected: string[] = [];

  expect(actual).toEqual(expected);
});

// --- Test Suite for extractPageData --- //

describe('extractPageData', () => {
  test('should extract all page data correctly', () => {
    const inputURL = 'https://blog.boot.dev';

    const html = `
      <html>
        <body>
          <h1>Page Title</h1>
          <main>
            <p>This is the first paragraph.</p>
            <p>Second paragraph.</p>
          </main>
          <a href="/about">About</a>
          <a href="https://example.com/contact">Contact</a>
          <img src="/image.png" />
          <img src="https://cdn.com/logo.jpg" />
        </body>
      </html>
    `;

    const actual = extractPageData(html, inputURL);

    const expected: ExtractedPageData = {
      url: inputURL,
      h1: 'Page Title',
      first_paragraph: 'This is the first paragraph.',
      outgoing_links: [
        'https://blog.boot.dev/about',
        'https://example.com/contact'
      ],
      image_urls: [
        'https://blog.boot.dev/image.png',
        'https://cdn.com/logo.jpg'
      ]
    };

    expect(actual).toEqual(expected);
  });

  test('should return empty strings and arrays when no content exists', () => {
    const inputURL = 'https://blog.boot.dev';
    const html = `<html><body></body></html>`;

    const actual = extractPageData(html, inputURL);

    const expected: ExtractedPageData = {
      url: inputURL,
      h1: '',
      first_paragraph: '',
      outgoing_links: [],
      image_urls: []
    };

    expect(actual).toEqual(expected);
  });

  test('should correctly resolve relative URLs', () => {
    const inputURL = 'https://blog.boot.dev/blog/';
    const html = `
      <html>
        <body>
          <a href="post">Post</a>
          <img src="image.jpg" />
        </body>
      </html>
    `;

    const actual = extractPageData(html, inputURL);

    expect(actual.outgoing_links).toEqual([
      'https://blog.boot.dev/blog/post'
    ]);

    expect(actual.image_urls).toEqual([
      'https://blog.boot.dev/blog/image.jpg'
    ]);
  });

  test('should still return the correct URL even if HTML is empty', () => {
    const inputURL = 'https://blog.boot.dev';
    const html = '';

    const actual = extractPageData(html, inputURL);

    expect(actual.url).toBe(inputURL);
  });
});