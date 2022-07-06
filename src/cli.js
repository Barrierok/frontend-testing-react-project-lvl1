import program from 'commander';
import loadPage from '.';

export default () => {
  program
    .version('0.0.1', '-v, --vers', 'output the current version')
    .description('Download the specified address from the Internet')
    .option('-o, --output [dir]', 'Output directory', process.cwd())
    .arguments('<url>')
    .action((url, options) => {
      loadPage(url, options.output)
        .then(({ filepath }) => console.log(filepath))
        .catch((err) => {
          console.log(err.message);
          process.exit(1);
        });
    })
    .parse(process.argv);
};
