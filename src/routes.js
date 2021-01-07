const bodyParser = require('body-parser');
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
// const humps = require('humps');
const pgp = require('pg-promise')({});
const {
  getActors,
  getActorCertificates,
  getActorInventory,
  getActorOwnership,
  getActorPractices,
} = require('./database/queries');

const cn = process.env.DATABASE_URL || 'postgres://coffeechain:coffeechain-local@localhost:5432/coffeechain';
const db = pgp(cn);

const app = express();
app.use(bodyParser.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/img', express.static(path.join(__dirname, '..', 'img')));

app.get('/api', (req, res) => {
  res.send('OK');
});

app.get('/api/actor', async (req, res) => {
  res.send({ actors: await db.any(getActors) });
});

app.get('/api/certificates/:actor', async (req, res) => {
  const { actor } = req.params;
  const now = new Date().toISOString();
  res.send({ items: await db.any(getActorCertificates, [actor, now]) });
});

app.get('/api/inventory/:actor', async (req, res) => {
  const { actor } = req.params;
  res.send({ items: await db.any(getActorInventory, [actor]) });
});

app.get('/api/ownership/:actor', async (req, res) => {
  const { actor } = req.params;
  res.send({ items: await db.any(getActorOwnership, [actor]) });
});

app.get('/api/practices/:actor', async (req, res) => {
  const { actor } = req.params;
  res.send({ items: await db.any(getActorPractices, [actor]) });
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// eslint-disable-next-line no-console
app.listen(8080, () => console.log('Listening on port 8080'));
