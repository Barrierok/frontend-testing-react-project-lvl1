import program from 'commander';
import loadPage from '.';

export default () => {
  program
    .version('0.0.1', '-v, --vers', 'output the current version')
    .description('Download the specified address from the Internet')
    .option('-o, --output [dir]', 'Output directory', process.cwd())
    .arguments('<url>')
    .action((url) => {
      loadPage(url, program.output)
        .then((fileName) => console.log(`Page was downloaded as ${fileName}`))
        .catch((err) => {
          console.log(err.message);
          process.exit(1);
        });
    })
    .parse(process.argv);
};
