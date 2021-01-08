const bodyParser = require('body-parser');
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const short = require('short-uuid');
// const humps = require('humps');
const pgp = require('pg-promise')({});
const {
  getActors,
  getActorCertificates,
  getActorInventory,
  getActorOwnership,
  getActorPractices,
  newTransformation,
  newTransformationInput,
  newTransformationOutput,
  newProduct,
  newShipment,
  newShipmentInput,
  newSale,
  newSaleInput,
  newCertificate,
  newPractice,
  newAttachment,
  newActor,
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

app.post('/api/actor', async (req, res) => {
  const { name, location, picture, type } = req.body;
  const id = short.generate();
  await db.none(newActor, [id, name, location, picture, type]);
  res.send('OK');
});

app.post('/api/transform', async (req, res) => {
  const { emitter, inputs, outputs, timestamp } = req.body;
  const id = timestamp; // TODO: generate randomly
  await db.none(newTransformation, [id, emitter, timestamp]);
  await Promise.all(inputs.map(({ productId }) => db.none(newTransformationInput, [id, productId])));
  await Promise.all(
    outputs.map(async ({ productId, weight, type }) => {
      await db.none(newProduct, [productId, weight, type, null]);
      await db.none(newTransformationOutput, [id, productId]);
    }),
  );
  res.send('OK');
});

app.post('/api/ship', async (req, res) => {
  const { sender, recipient, inputs, timestamp } = req.body;
  const id = timestamp;
  await db.none(newShipment, [id, sender, recipient, timestamp]);
  await Promise.all(inputs.map(({ productId }) => db.none(newShipmentInput, [id, productId])));
  res.send('OK');
});

app.post('/api/sell', async (req, res) => {
  const { seller, buyer, inputs, price, currency, timestamp } = req.body;
  const id = timestamp;
  await db.none(newSale, [id, seller, buyer, price, currency, timestamp]);
  await Promise.all(inputs.map(({ productId }) => db.none(newSaleInput, [id, productId])));
  res.send('OK');
});

app.post('/api/certificate', async (req, res) => {
  const { emitter, receiver, type, beginning, expiration } = req.body;
  await db.none(newCertificate, [emitter, receiver, type, beginning, expiration]);
  res.send('OK');
});

app.post('/api/practice', async (req, res) => {
  const { emitter, receiver, type, timestamp } = req.body;
  await db.none(newPractice, [emitter, receiver, type, timestamp]);
  res.send('OK');
});

app.post('/api/textAttachment', async (req, res) => {
  const { eventId, eventType, content, emitter } = req.body;
  // TODO: generate id, add timestamp to database schema for attachments
  await db.none(newAttachment, ['id', eventId, eventType, 'TEXT', content, emitter]);
  res.send('OK');
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// eslint-disable-next-line no-console
app.listen(8080, () => console.log('Listening on port 8080'));

// For testing
module.exports = app;
