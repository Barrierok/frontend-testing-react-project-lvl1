import cheerio from 'cheerio';
import path from 'path';
import { uniq } from 'lodash';

import { tags, getNameFromURL, types } from './utils';

export default (html, url) => {
  const $ = cheerio.load(html);
  const { origin } = new URL(url);
  const resourceDir = getNameFromURL(url, types.resourceDir);

  const links = [];

  Object.entries(tags).forEach(([key, attribute]) => {
    $(key).each((i, el) => {
      const link = $(el).attr(attribute);
      if (!link) return;

      const preparedUrl = new URL(link, origin);
      if (!origin.includes(preparedUrl.host)) return;

      const stringifiedUrl = preparedUrl.toString();
      const newPath = path.join(resourceDir, getNameFromURL(stringifiedUrl));

      $(el).attr(attribute, newPath);
      links.push(stringifiedUrl);
    });
  });
  return { changedHtml: $.html(), links: uniq(links) };
};
