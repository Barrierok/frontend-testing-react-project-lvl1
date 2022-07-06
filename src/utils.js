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
  resourceDir: 'sourceDir',
  resourceFile: 'sourceFile',
};

export const getNameFromURL = (url, type = types.resourceFile) => {
  const dispatcher = {
    [types.resourceDir]: ({ host, pathname }) => (
      `${getKebabName(path.join(host, pathname))}_files`
    ),
    [types.resourceFile]: ({ host, pathname }) => {
      const { dir, name, ext } = path.parse(pathname);
      return `${getKebabName(path.join(host, dir, name))}${ext || '.html'}`;
    },
  };
  return dispatcher[type](new URL(url));
};
