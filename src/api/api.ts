import 'core-js/stable';
import 'regenerator-runtime/runtime';
import express from 'express';
import streamToString from 'stream-to-string';
import * as uuid from 'uuid';
import { writeFileSync } from 'fs';

const app = express();
const port = process.env.EXPRESS_PORT;

app.post('/coverage', async (req, res) => {
  const coverage = await streamToString(req);
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, coverage);
  res.sendStatus(204);
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

process.on('SIGINT', () => {
  writeFileSync(`.nyc_output/${uuid.v4()}.json`, JSON.stringify((global as any).__coverage__));
});
