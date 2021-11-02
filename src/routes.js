/* eslint-disable no-await-in-loop */
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
  getPendingSales,
  getPendingShipments,
  getProduct,
  newTransformation,
  newTransformationInput,
  newTransformationOutput,
  newProduct,
  newShipment,
  newShipmentConfirmation,
  newShipmentInput,
  newSale,
  newSaleConfirmation,
  newSaleInput,
  newCertificate,
  newPractice,
  newAttachment,
  newActor,
  getAttachments,
  getCertificate,
  getEvents,
  getPractice,
  getTransformation,
  getTransformationInputs,
  getTransformationOutputs,
  getSale,
  getSaleInputs,
  getShipment,
  getShipmentInputs,
  getProductInputs,
  getProductShipments,
  getProductInitialTransformation,
  getProductPayout,
  getActor,
} = require('./database/queries');

const cn = {
  connectionString: process.env.DATABASE_URL || 'postgres://coffeechain:coffeechain-local@localhost:5432/coffeechain',
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : null,
};
const db = pgp(cn);

const app = express();
app.use(express.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/img', express.static(path.join(__dirname, '..', 'img')));
app.use((req, res, next) => {
  if (process.env.NODE_ENV === 'production' && !req.secure) {
    return res.redirect(`https://${req.headers.host}${req.url}`);
  }
  return next();
});

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

app.get('/api/event', async (req, res) => {
  res.send({ events: await db.any(getEvents) });
});

app.get('/api/transformation/:id', async (req, res) => {
  const { id } = req.params;
  let basicInfo;

  try {
    basicInfo = await db.one(getTransformation, [id]);
  } catch (e) {
    return res.status(400).send({ error: 'Transformation not found' });
  }

  const inputs = await db.any(getTransformationInputs, [id]);
  const outputs = await db.any(getTransformationOutputs, [id]);
  const attachments = await db.any(getAttachments, [id, 'transformation']);

  return res.send({ basicInfo, inputs, outputs, attachments });
});

app.get('/api/shipment/:id', async (req, res) => {
  const { id } = req.params;
  let basicInfo;

  try {
    basicInfo = await db.one(getShipment, [id]);
  } catch (e) {
    return res.status(400).send({ error: 'Shipment not found' });
  }

  const inputs = await db.any(getShipmentInputs, [id]);
  const attachments = await db.any(getAttachments, [id, 'shipment']);

  return res.send({ basicInfo, inputs, attachments });
});

app.get('/api/sale/:id', async (req, res) => {
  const { id } = req.params;
  let basicInfo;

  try {
    basicInfo = await db.one(getSale, [id]);
  } catch (e) {
    return res.status(400).send({ error: 'Sale not found' });
  }

  const inputs = await db.any(getSaleInputs, [id]);
  const attachments = await db.any(getAttachments, [id, 'sale']);

  return res.send({ basicInfo, inputs, attachments });
});

app.get('/api/certificate/:id', async (req, res) => {
  const { id } = req.params;
  let basicInfo;

  try {
    basicInfo = await db.one(getCertificate, [id]);
  } catch (e) {
    return res.status(400).send({ error: 'Certificate not found' });
  }

  const attachments = await db.any(getAttachments, [id, 'certificate']);

  return res.send({ basicInfo, attachments });
});

app.get('/api/practice/:id', async (req, res) => {
  const { id } = req.params;
  let basicInfo;

  try {
    basicInfo = await db.one(getPractice, [id]);
  } catch (e) {
    return res.status(400).send({ error: 'Practice not found' });
  }

  const attachments = await db.any(getAttachments, [id, 'practice']);

  return res.send({ basicInfo, attachments });
});

app.get('/api/pending/:actorId', async (req, res) => {
  const { actorId } = req.params;
  try {
    await db.one('select type from actor where id = $1', [actorId]);
  } catch (e) {
    return res.status(400).send({ error: 'Actor not found' });
  }

  const pendingSales = await db.any(getPendingSales, [actorId]);
  const pendingShipments = await db.any(getPendingShipments, [actorId]);
  return res.send({ pendingSales, pendingShipments });
});

const aggregateObjectToArray = arr => Object.entries(arr).map(([id, rest]) => ({ id, ...rest }));

const getProductProvenance = async productId => {
  const recurProvenance = async (currentId, factor = 1) => {
    const inputs = await db.any(getProductInputs, [currentId]);

    if (inputs.length === 0) {
      const { type, varieties, emitter, emittername, timestamp } = await db.one(getProduct, [currentId]);
      return [{ id: currentId, fraction: factor, type, varieties, emitter, emittername, timestamp }];
    }

    const ancestors = await Promise.all(inputs.map(({ id, fraction }) => recurProvenance(id, fraction * factor)));

    return ancestors.flat();
  };

  const ancestors = await recurProvenance(productId);

  // Turn ancestor array into object to filter out duplicates
  const ancestorAggregate = {};
  ancestors.forEach(({ id: currentId, fraction, ...rest }) => {
    const { fraction: prevFraction = 0 } = ancestorAggregate[currentId] || {};
    ancestorAggregate[currentId] = { fraction: prevFraction + fraction, ...rest };
  });

  const provenance = aggregateObjectToArray(ancestorAggregate);

  return provenance;
};

const getFarmerInfo = async products => {
  const dbProductInfo = await Promise.all(
    products.map(async ({ id, fraction, timestamp, emitter }) => {
      const payout = await db.oneOrNone(getProductPayout, [id]);
      const actor = await db.one(getActor, [emitter]);
      const certificates = await db.any(getActorCertificates, [emitter, timestamp]);
      const practices = await db.any(getActorPractices, [emitter]);

      return { fraction, actor, payout, certificates, practices };
    }),
  );

  const producerAggregate = {};
  dbProductInfo.forEach(({ fraction, actor, certificates, practices, payout }) => {
    const { id, name, location, picture, type } = actor;
    const { amount = 0, currency = 'USD' } = payout || {};
    const { payout: prevPayout, contribution: prevContribution = 0 } = producerAggregate[id] || {};
    const { amount: prevAmount = 0 } = prevPayout || {};

    // OBS: Here, we make the assumption that all payouts for a single actor are in only one currency
    producerAggregate[id] = {
      name,
      type,
      location,
      picture,
      certificates,
      practices,
      contribution: prevContribution + fraction,
      payout: {
        amount: prevAmount + amount,
        currency,
      },
    };
  });

  return aggregateObjectToArray(producerAggregate);
};

const getPracticeCertTallies = farmerInfo => {
  const certificates = {};
  const practices = {};
  farmerInfo.forEach(({ certificates: certs, practices: practs, contribution }) => {
    certs.forEach(({ type }) => {
      const prev = certificates[type] || 0;
      certificates[type] = prev + contribution;
    });

    practs.forEach(({ type }) => {
      const prev = practices[type] || 0;
      practices[type] = prev + contribution;
    });
  });

  return { certificates, practices };
};

const getVarietyTally = products => {
  const varieties = {};
  products.forEach(({ fraction, varieties: productVarieties }) => {
    JSON.parse(productVarieties).forEach(({ name, amount }) => {
      const prev = varieties[name] || 0;
      varieties[name] = prev + fraction * amount;
    });
  });

  return varieties;
};

const getProductCustody = async productId => {
  const initialTransformation = await db.one(getProductInitialTransformation, [productId]);
  const shipments = await db.any(getProductShipments, [productId]);

  const custody = [];

  const { emitter, emittername, timestamp } = initialTransformation;
  custody.push({
    actor: emitter,
    actorName: emittername,
    start: timestamp,
    end: shipments.length > 0 ? shipments[0].from : null,
  });

  shipments.forEach((shipment, i) => {
    const { recipient, recipientname, to } = shipment;

    let end = null;
    if (i < shipments.length - 1) {
      end = shipments[i + 1].to;
    }

    if (to) {
      custody.push({
        actor: recipient,
        actorName: recipientname,
        start: to,
        end,
      });
    }
  });

  return custody;
};

app.get('/api/product/:productId', async (req, res) => {
  const { productId } = req.params;

  let info;
  try {
    info = await db.one(getProduct, [productId]);
  } catch (e) {
    return res.status(400).send({ error: 'Product not found.' });
  }

  const provenance = await getProductProvenance(productId, info);
  const custody = await getProductCustody(productId);
  const farmerInfo = await getFarmerInfo(provenance);
  const pcTallies = getPracticeCertTallies(farmerInfo);
  const varieties = getVarietyTally(provenance);

  return res.send({ ...info, provenance, custody, farmerInfo, tallies: { varieties, ...pcTallies } });
});

app.post('/api/actor', async (req, res) => {
  const { name, location, pluscode, picture, type, info } = req.body;
  const id = short.generate();
  await db.none(newActor, [id, name, location, pluscode, picture, type, info]);
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

    if (outputs.some(({ varieties }) => !varieties)) {
      return res.status(400).send({ error: 'The variety field is mandatory for the initial creation of new products' });
    }

    if (outputs.some(({ type }) => !['WET_PARCHMENT', 'DRY_PARCHMENT'].includes(type))) {
      return res.status(400).send({ error: 'A farmer can only create dry or wet parchment.' });
    }
  }

  if (inputs.length > 0 && outputs.some(({ varieties }) => !!varieties)) {
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
    if (outputs.some(({ type }) => type === 'WEIGHT_LOSS') || outWeight > inWeight) {
      return res.status(400).send({ error: 'The cumulative weights of the inputs and outputs must be equal' });
    }

    outputs.push({
      productId: short.generate(),
      type: 'WEIGHT_LOSS',
      weight: inWeight - outWeight,
      varieties: null,
    });
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
    outputs.map(async ({ productId, weight, type, varieties }) => {
      await db.none(newProduct, [productId, weight, type, varieties && JSON.stringify(varieties)]);
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
  return res.send({ id });
});

app.post('/api/receive', async (req, res) => {
  const { recipient, shipment, timestamp } = req.body;

  try {
    await db.one('select * from shipment where id = $1 and recipient = $2;', [shipment, recipient]);
  } catch (e) {
    return res.status(400).send({ error: 'Shipment not found' });
  }

  try {
    await db.none(newShipmentConfirmation, [shipment, timestamp]);
  } catch (e) {
    return res.status(400).send({ error: 'Shipment already confirmed' });
  }

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
  return res.send({ id });
});

app.post('/api/buy', async (req, res) => {
  const { buyer, sale, timestamp } = req.body;

  try {
    await db.one('select * from sale where id = $1 and buyer = $2;', [sale, buyer]);
  } catch (e) {
    return res.status(400).send({ error: 'Sale not found' });
  }

  try {
    await db.none(newSaleConfirmation, [sale, timestamp]);
  } catch (e) {
    return res.status(400).send({ error: 'Sale already confirmed' });
  }

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

  const id = short.generate();
  await db.none(newCertificate, [id, emitter, receiver, type, beginning, expiration]);
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

  const id = short.generate();
  await db.none(newPractice, [id, emitter, receiver, type, timestamp]);
  return res.send('OK');
});

const uploadMedia = async file => {
  let extension;
  switch (file.mimetype) {
    case 'image/jpeg':
      extension = '.jpg';
      break;
    case 'image/png':
      extension = '.png';
      break;
    case 'application/pdf':
      extension = '.pdf';
      break;
    default:
      throw new Error('Evidence documents can only be images or PDF documents');
  }

  const evidenceDocumentName = short.generate() + extension;
  const filepath = path.join('/uploads', evidenceDocumentName);

  await file.mv(path.join(__dirname, '..', 'uploads', evidenceDocumentName));

  return { filepath };
};

app.post('/api/fileAttachment', async (req, res) => {
  const {
    files: { file },
    body: { document },
  } = req;
  const { emitter, eventId, eventType, timestamp, title, content } = JSON.parse(document);
  const id = short.generate();

  let filepath;
  try {
    ({ filepath } = await uploadMedia(file));
  } catch (e) {
    return res.status(400).send({ error: e.message });
  }

  try {
    await db.none(newAttachment, [id, eventId, eventType, 'FILE', title, content, filepath, emitter, timestamp]);
  } catch (e) {
    return res.status(400).send({ error: 'Could not register in database' });
  }

  return res.send('OK');
});

app.post('/api/textAttachment', async (req, res) => {
  const {
    body: { document },
  } = req;
  const { emitter, eventId, eventType, timestamp, title, content } = JSON.parse(document);
  const id = short.generate();

  try {
    await db.none(newAttachment, [id, eventId, eventType, 'TEXT', title, content, null, emitter, timestamp]);
  } catch (e) {
    return res.status(400).send({ error: 'Could not register in database' });
  }

  return res.send('OK');
});

if (process.env.NODE_ENV === 'production') {
  app.use(express.static('build'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../build', 'index.html'));
  });
}

const port = process.env.PORT || (process.env.NODE_ENV === 'test' ? 8081 : 8080);
// eslint-disable-next-line no-console
app.listen(port, () => console.log('Listening on port 8080'));

// For testing
module.exports = app;
