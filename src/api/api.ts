import express from 'express';

const app = express();
const port = process.env.EXPRESS_PORT;

app.get('/coverage', (req, res) => {
  res.json((global as any).__coverage__).send();
});

app.get('/hello', (req, res) => {
  res.send('Hello World!');
});

app.use(express.static(`${process.cwd()}/dist/ui`));

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
  /* istanbul ignore else */
  if (process.send !== undefined) {
    process.send('ready');
  }
});
