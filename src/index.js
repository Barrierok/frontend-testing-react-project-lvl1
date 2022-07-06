import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import debug from 'debug';
import 'axios-debug-log';

import { getNameFromURL, types } from './utils';
import getLinksAndChangedHTML from './htmlWorker';

const log = debug('page-loader');

const loadResource = (url, resourceDir) => axios({
  method: 'get',
  url,
  responseType: 'stream',
}).then(({ data }) => {
  const resourceFileName = getNameFromURL(url);

  data.pipe(createWriteStream(path.join(resourceDir, resourceFileName)));

  return log(`Resource ${resourceFileName} has been loaded and written to the folder ${resourceDir}`);
});

const loadResources = (links, resourceDir) => (
  Promise.all(links.map((link) => loadResource(link, resourceDir)))
);

export default (requestUrl, outputDir = '') => axios
  .get(requestUrl)
  .then(({ data: html }) => {
    const resourceDirName = getNameFromURL(requestUrl, types.resourceDir);
    const resourceDir = path.join(outputDir, resourceDirName);

    const { links, changedHtml } = getLinksAndChangedHTML(html, requestUrl);
    log(`Links from HTML document: ${links}`);

    return fs.mkdir(resourceDir).then(() => {
      log(`Folder ${resourceDirName} was created in ${outputDir}`);

      return loadResources(links, resourceDir);
    }).then(() => {
      const indexFileName = getNameFromURL(requestUrl);

      return fs.writeFile(path.join(outputDir, indexFileName), changedHtml, 'utf-8');
    }).then(() => {
      const indexFileName = getNameFromURL(requestUrl);
      log(`File ${indexFileName} was created in folder ${outputDir}`);

      console.log(path.join(outputDir, indexFileName));
      return { filepath: path.join(outputDir, indexFileName) };
    });
  }).catch((err) => {
    log(err.message);
    throw err;
  });
