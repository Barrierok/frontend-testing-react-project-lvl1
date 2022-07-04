import axios from 'axios';
import { promises as fs, createWriteStream } from 'fs';
import path from 'path';
import debug from 'debug';
import Listr from 'listr';
import 'axios-debug-log';

import { getNameFromURL, types } from './utils';
import getLinksAndChangedHTML from './htmlWorker';

const log = debug('page-loader');

const loadReresource = (url, resourceDir) => axios({
  method: 'get',
  url,
  responseType: 'stream',
}).then(({ data }) => {
  const resourceFileName = getNameFromURL(url);
  data.pipe(createWriteStream(path.join(resourceDir, resourceFileName)));

  return log(`Reresource ${resourceFileName} has been loaded and written to the folder ${resourceDir}`);
});

const loadReresources = (links, resourceDir) => {
  const data = links.map((link) => (
    { title: `${link}`, task: () => loadReresource(link, resourceDir) }
  ));

  const tasks = new Listr(data, { concurrent: true, exitOnError: false });
  return tasks.run();
};

export default (requestUrl, outputDir) => axios.get(requestUrl)
  .then(({ data: html }) => {
    const resourceDirName = getNameFromURL(requestUrl, types.resourceDir);
    const resourceDir = path.join(outputDir, resourceDirName);

    const { links, changedHtml } = getLinksAndChangedHTML(html, requestUrl);
    log(`Links from HTML document: ${links}`);

    return fs.mkdir(resourceDir)
      .then(() => {
        log(`Folder ${resourceDirName} was created in ${outputDir}`);

        return loadReresources(links, resourceDir);
      })
      .then(() => {
        const indexFileName = getNameFromURL(requestUrl, types.htmlFile);

        return fs.writeFile(path.join(outputDir, indexFileName), changedHtml, 'utf-8');
      })
      .then(() => {
        const indexFileName = getNameFromURL(requestUrl, types.htmlFile);
        log(`File ${indexFileName} was created in folder ${outputDir}`);

        return indexFileName;
      });
  })
  .catch((err) => {
    log(err.message);
    throw err;
  });
