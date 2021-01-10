const bodyParser = require('body-parser');
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const short = require('short-uuid');
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

app.get('/api/actor/:id', async (req, res) => {
  const { id } = req.params;

  try {
    await db.one('select type from actor where id = $1', [id]);
  } catch (e) {
    return res.status(400).send({ error: 'Actor not found' });
  }

  const now = new Date().toISOString();

  const certificates = await db.any(getActorCertificates, [id, now]);
  const practices = await db.any(getActorPractices, [id]);
  const inventory = await db.any(getActorInventory, [id]);
  const ownership = await db.any(getActorOwnership, [id]);

  return res.send({ id, certificates, practices, inventory, ownership });
});

app.post('/api/actor', async (req, res) => {
  const { name, location, picture, type } = req.body;
  const id = short.generate();
  await db.none(newActor, [id, name, location, picture, type]);
  return res.send('OK');
});

app.post('/api/transform', async (req, res) => {
  const { emitter, inputs, outputs, timestamp } = req.body;
  const id = short.generate();

  let fullEmitter;
  try {
    fullEmitter = await db.one('select type from actor where id = $1', [emitter]);
  } catch (e) {
    return res.status(400).send({ error: 'Emitter not found' });
  }

  if (inputs.length === 0) {
    if (fullEmitter.type !== 'FARMER') {
      return res.status(400).send({ error: 'Only farmers can create new products' });
    }

    if (outputs.some(({ variety }) => !variety)) {
      return res.status(400).send({ error: 'The variety field is mandatory for the initial creation of new products' });
    }

    if (outputs.some(({ type }) => !['WET_PARCHMENT', 'DRY_PARCHMENT'].includes(type))) {
      return res.status(400).send({ error: 'A farmer can only create dry or wet parchment.' });
    }
  }

  if (inputs.length > 0 && outputs.some(({ variety }) => !!variety)) {
    return res
      .status(400)
      .send({ error: 'The variety field is only supported for the initial creation of new products' });
  }

  if (outputs.length === 0) {
    return res.status(400).send({ error: 'Transformations must have outputs' });
  }

  const outputIds = outputs.map(({ productId }) => productId);
  if (new Set(outputIds).size < outputs.length) {
    return res.status(400).send({ error: 'Found duplicated output id.' });
  }

  let fullInputs;
  try {
    fullInputs = await Promise.all(
      inputs.map(async ({ productId }) => db.one('select * from product where id = $1', [productId])),
    );
  } catch (e) {
    return res.status(400).send({ error: 'Cannot consume a product that does not exist' });
  }

  const inWeight = fullInputs.reduce((previous, current) => previous + current.weight, 0);
  const outWeight = outputs.reduce((previous, current) => previous + current.weight, 0);

  if (inputs.length > 0 && inWeight !== outWeight) {
    return res.status(400).send({ error: 'The cumulative weights of the inputs and outputs must be equal' });
  }

  if (outputs.some(({ weight }) => weight === 0)) {
    return res.status(400).send({ error: 'Cannot produce weightless products.' });
  }

  if (fullInputs.some(({ type }) => type === 'WEIGHT_LOSS')) {
    return res.status(400).send({ error: 'Cannot consume a product of the weight loss type' });
  }

  try {
    await Promise.all(
      outputs.map(async ({ productId }) => db.none('select * from product where id = $1', [productId])),
    );
  } catch (e) {
    return res.status(400).send({ error: 'Cannot use existing ids for new products' });
  }

  const emitterInventory = (await db.any(getActorInventory, [emitter])).map(({ id: productId }) => productId);
  if (inputs.some(({ productId }) => !emitterInventory.includes(productId))) {
    return res.status(400).send({ error: 'Cannot consume input not in inventory' });
  }

  await db.none(newTransformation, [id, emitter, timestamp]);
  await Promise.all(inputs.map(({ productId }) => db.none(newTransformationInput, [id, productId])));
  await Promise.all(
    outputs.map(async ({ productId, weight, type, variety }) => {
      await db.none(newProduct, [productId, weight, type, variety]);
      await db.none(newTransformationOutput, [id, productId]);
    }),
  );
  return res.send('OK');
});

app.post('/api/ship', async (req, res) => {
  const { sender, recipient, inputs, timestamp } = req.body;
  const id = short.generate();

  if (sender === recipient) {
    return res.status(400).send({ error: 'Sender and recipient must be different.' });
  }

  if (inputs.length === 0) {
    return res.status(400).send({ error: 'Shipments must have inputs' });
  }

  const inputIds = inputs.map(({ productId }) => productId);
  if (new Set(inputIds).size < inputs.length) {
    return res.status(400).send({ error: 'Found duplicated input id.' });
  }

  try {
    await db.one('select type from actor where id = $1', [sender]);
  } catch (e) {
    return res.status(400).send({ error: 'Sender not found' });
  }

  try {
    await db.one('select type from actor where id = $1', [recipient]);
  } catch (e) {
    return res.status(400).send({ error: 'Recipient not found' });
  }

  const senderInventory = (await db.any(getActorInventory, [sender])).map(({ id: productId }) => productId);
  if (inputs.some(({ productId }) => !senderInventory.includes(productId))) {
    return res.status(400).send({ error: 'Cannot ship product not in inventory' });
  }

  await db.none(newShipment, [id, sender, recipient, timestamp]);
  await Promise.all(inputs.map(({ productId }) => db.none(newShipmentInput, [id, productId])));
  return res.send('OK');
});

app.post('/api/sell', async (req, res) => {
  const { seller, buyer, inputs, price, currency, timestamp } = req.body;
  const id = short.generate();

  if (inputs.length === 0) {
    return res.status(400).send({ error: 'Sales must have inputs' });
  }

  try {
    await db.one('select type from actor where id = $1', [seller]);
  } catch (e) {
    return res.status(400).send({ error: 'Seller not found' });
  }

  try {
    await db.one('select type from actor where id = $1', [buyer]);
  } catch (e) {
    return res.status(400).send({ error: 'Buyer not found' });
  }

  const sellerOwnership = (await db.any(getActorOwnership, [seller])).map(({ id: productId }) => productId);
  if (inputs.some(({ productId }) => !sellerOwnership.includes(productId))) {
    return res.status(400).send({ error: 'Cannot sell product not in ownership' });
  }

  await db.none(newSale, [id, seller, buyer, price, currency, timestamp]);
  await Promise.all(inputs.map(({ productId }) => db.none(newSaleInput, [id, productId])));
  return res.send('OK');
});

app.post('/api/certificate', async (req, res) => {
  const { emitter, receiver, type, beginning, expiration } = req.body;

  try {
    await db.one('select type from actor where id = $1', [emitter]);
  } catch (e) {
    return res.status(400).send({ error: 'Emitter not found' });
  }

  try {
    await db.one('select type from actor where id = $1', [receiver]);
  } catch (e) {
    return res.status(400).send({ error: 'Receiver not found' });
  }

  if (new Date(beginning) >= new Date(expiration)) {
    return res.status(400).send({ error: 'Invalid date range' });
  }

  await db.none(newCertificate, [emitter, receiver, type, beginning, expiration]);
  return res.send('OK');
});

app.post('/api/practice', async (req, res) => {
  const { emitter, receiver, type, timestamp } = req.body;

  try {
    await db.one('select type from actor where id = $1', [emitter]);
  } catch (e) {
    return res.status(400).send({ error: 'Emitter not found' });
  }

  try {
    await db.one('select type from actor where id = $1', [receiver]);
  } catch (e) {
    return res.status(400).send({ error: 'Receiver not found' });
  }

  await db.none(newPractice, [emitter, receiver, type, timestamp]);
  return res.send('OK');
});

app.post('/api/textAttachment', async (req, res) => {
  const { eventId, eventType, content, emitter } = req.body;
  // TODO: generate id, add timestamp to database schema for attachments
  await db.none(newAttachment, ['id', eventId, eventType, 'TEXT', content, emitter]);
  return res.send('OK');
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

// eslint-disable-next-line no-console
const port = process.env.NODE_ENV === 'test' ? 8081 : 8080;
app.listen(port, () => console.log('Listening on port 8080'));

// For testing
module.exports = app;
