import path from 'path';

export const tags = {
  link: 'href',
  script: 'src',
  img: 'src',
};

export const getKebabName = (link) => link
  .replace(/[^A-z0-9]/g, '-')
  .split('-')
  .filter(Boolean)
  .join('-');

export const types = {
  htmlFile: 'htmlFile',
  resourceDir: 'sourceDir',
  resourceFile: 'sourceFile',
};

export const getNameFromURL = (url, type = types.resourceFile) => {
  const dispatcher = {
    [types.resourceDir]: ({ host, pathname }) => (
      `${getKebabName(path.join(host, pathname))}_files`
    ),
    [types.htmlFile]: ({ host, pathname }) => (
      `${getKebabName(path.join(host, pathname))}.html`
    ),
    [types.resourceFile]: ({ host, pathname }) => {
      const filePath = getKebabName(pathname);
      const withoutExtname = filePath.slice(0, filePath.lastIndexOf('-'));

      return `${getKebabName(host)}-${withoutExtname}${path.extname(pathname)}`;
    },
  };
  return dispatcher[type](new URL(url));
};
