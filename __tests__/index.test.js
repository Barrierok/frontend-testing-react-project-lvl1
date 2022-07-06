import nock from 'nock';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { describe, test, expect } from '@jest/globals';
import loadPage from '../src';

nock.disableNetConnect();

const getFixturePath = (fileName) => path.join(__dirname, '..', '__fixtures__', fileName);
const getExpectedAssetPath = (fileName) => getFixturePath(`expected/site-com-blog-about_files/${fileName}`);

let TEMP_DIR = '';
let OUTPUT_FILES_DIR = '';

const BASE_URL = new URL('https://site.com/blog/about');

const requestUrl = BASE_URL.toString();

const HTML_FILE_NAME = 'site-com-blog-about.html';
const HTML_FILE_PATH = getFixturePath(HTML_FILE_NAME);
const EXPECTED_HTML_FILE_PATH = getFixturePath(`expected/${HTML_FILE_NAME}`);

const ASSETS = [
  {
    fixturePath: getExpectedAssetPath('site-com-photos-me.jpg'),
    contentType: { 'Content-Type': 'image/jpeg' },
    url: '/photos/me.jpg',
    fileName: 'site-com-photos-me.jpg',
  },
  {
    fixturePath: getExpectedAssetPath('site-com-blog-about-assets-styles.css'),
    contentType: { 'Content-Type': 'text/css' },
    url: '/blog/about/assets/styles.css',
    fileName: 'site-com-blog-about-assets-styles.css',
  },
  {
    fixturePath: getExpectedAssetPath('site-com-assets-scripts.js'),
    contentType: { 'Content-Type': 'application/javascript' },
    url: '/assets/scripts.js',
    fileName: 'site-com-assets-scripts.js',
  },
  {
    fixturePath: getExpectedAssetPath(HTML_FILE_NAME),
    contentType: { 'Content-Type': 'text/html' },
    url: '/blog/about',
    fileName: HTML_FILE_NAME,
  },
];

const NON_AVAILABLE_ASSETS = ['/assets/gtm.js'];

beforeAll(() => {
  nock(BASE_URL.origin)
    .persist(true)
    .get(BASE_URL.pathname)
    .replyWithFile(200, HTML_FILE_PATH, { 'Content-Type': 'text/html' });
  ASSETS.forEach((asset) => nock(BASE_URL.origin)
    .persist(true)
    .get(asset.url)
    .replyWithFile(200, asset.fixturePath, asset.contentType));
  NON_AVAILABLE_ASSETS.forEach((url) => nock(BASE_URL.origin)
    .persist(true)
    .get(url)
    .reply(404));
});

beforeEach(async () => {
  TEMP_DIR = await fs.mkdtemp(path.join(os.tmpdir(), 'page-loader-'));
  OUTPUT_FILES_DIR = path.join(TEMP_DIR, 'site-com-blog-about_files');
});

afterEach(async () => {
  await fs.rmdir(TEMP_DIR, { recursive: true });
});

describe('positive cases', () => {
  test('load main page', async () => {
    const { filepath } = await loadPage(requestUrl, TEMP_DIR);
    const expectedPath = path.join(TEMP_DIR, HTML_FILE_NAME);
    expect(filepath).toEqual(expectedPath);

    const resultHtml = await fs.readFile(filepath, 'utf8');
    const expectedHtml = await fs.readFile(EXPECTED_HTML_FILE_PATH, 'utf8');
    expect(resultHtml).toEqual(expectedHtml);
  });

  test.each(ASSETS)('download correct $fileName', async (asset) => {
    await loadPage(requestUrl, TEMP_DIR);
    const expectedAsset = await fs.readFile(asset.fixturePath, 'utf8');
    const result = await fs.readFile(path.join(OUTPUT_FILES_DIR, asset.fileName), 'utf8');
    expect(result).toEqual(expectedAsset);
  });
});

describe('negative cases', () => {
  test('application error handling', async () => {
    await expect(loadPage(requestUrl, 'output')).rejects.toMatchSnapshot();
  });

  test('throw exception if run with invalid url', async () => {
    await expect(loadPage('invalidURL', TEMP_DIR)).rejects.toThrow();
  });

  test('throw exception if output dir is undefined', async () => {
    await expect(loadPage('invalidURL')).rejects.toThrow();
  });

  test.each([401, 403, 404, 500, 503])(
    "throw exception if main url doesn't available, server returns %d",
    async (code) => {
      const url = 'https://example.com';
      nock(url).get('/').reply(code);
      await expect(loadPage(url, TEMP_DIR)).rejects.toThrow();
    },
  );
});
