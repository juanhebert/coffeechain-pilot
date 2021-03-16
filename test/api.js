process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const pgp = require('pg-promise')({ noWarnings: true });
const server = require('../src/routes');
const { resetSchema } = require('../src/database/queries');

const cn = 'postgres://coffeechain:coffeechain-local@localhost:5432/coffeechain';
const db = pgp(cn);

const { expect } = chai;

chai.use(chaiHttp);

describe('The API', () => {
  before(() => db.none(resetSchema));

  let actors;

  it('should be able to add actors to the database', async () => {
    const inputActors = [
      {
        name: 'Ernesto Cárdenas',
        location: 'Titiribí, Colombia',
        pluscode: '',
        picture: null,
        type: 'FARMER',
        info: {
          name: 'Finca Cafetera El Descanso',
          varieties: [
            { variety: 'CASTILLO', amount: 2 },
            { variety: 'CENICAFE', amount: 1 },
          ],
        },
      },
      {
        name: 'Cooperativa de Caficultores de Antioquia',
        location: 'Medellín, Colombia',
        pluscode: '',
        picture: null,
        type: 'COOPERATIVE',
      },
      {
        name: 'Almacafé',
        location: 'Medellín, Colombia',
        pluscode: '',
        picture: null,
        type: 'DRY_MILL',
      },
      {
        name: 'Amacafé Exportación',
        location: 'Medellín, Colombia',
        pluscode: '',
        picture: null,
        type: 'EXPORTER',
      },
      {
        name: 'Löfberg Import',
        location: 'Viborg, Denmark',
        pluscode: '',
        picture: null,
        type: 'IMPORTER',
      },
      {
        name: 'Löfberg',
        location: 'Karlstad, Sweden',
        pluscode: '',
        picture: null,
        type: 'ROASTER',
      },
    ];

    return Promise.all(
      inputActors.map(async actor => {
        const res = await chai.request(server).post('/api/actor').send(actor);
        expect(res).to.have.status(200);
      }),
    );
  });

  it('should be able to GET a list of all actors', async () => {
    const res = await chai.request(server).get('/api/actor');
    const { actors: dbActors } = res.body;
    actors = dbActors.map(({ id }) => id);
    expect(res).to.have.status(200);
    expect(dbActors).to.have.length(6);
  });

  it('should be able to create a product', async () => {
    const farmer = actors[3];

    const transformRes = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [],
        outputs: [
          {
            productId: 'initial-product1',
            weight: 50000,
            type: 'DRY_PARCHMENT',
            varieties: [{ name: 'CASTILLO', amount: 1 }],
          },
          {
            productId: 'initial-product2',
            weight: 50000,
            type: 'DRY_PARCHMENT',
            varieties: [{ name: 'CASTILLO', amount: 1 }],
          },
        ],
        timestamp: new Date().toISOString(),
      });
    expect(transformRes).to.have.status(200);

    const actorRes = await chai.request(server).get(`/api/actor/${farmer}`);
    const { inventory, ownership } = actorRes.body;
    expect(inventory).to.have.length(2);
    expect(inventory.map(({ id }) => id)).to.have.members(['initial-product1', 'initial-product2']);
    expect(ownership).to.have.length(2);
    expect(ownership.map(({ id }) => id)).to.have.members(['initial-product1', 'initial-product2']);
  });

  it('should be able to transform products', async () => {
    const farmer = actors[3];

    const transformRes = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [{ productId: 'initial-product1' }, { productId: 'initial-product2' }],
        outputs: [
          { productId: 'derived-product1', weight: 25000, type: 'ROASTED' },
          { productId: 'derived-product2', weight: 25000, type: 'ROASTED' },
          { productId: 'weight-loss1', weight: 50000, type: 'WEIGHT_LOSS' },
        ],
        timestamp: new Date().toISOString(),
      });
    expect(transformRes).to.have.status(200);

    const actorRes = await chai.request(server).get(`/api/actor/${farmer}`);
    const { inventory, ownership } = actorRes.body;
    expect(inventory).to.have.length(2);
    expect(inventory.map(({ id }) => id)).to.have.members(['derived-product1', 'derived-product2']);
    expect(ownership).to.have.length(2);
    expect(ownership.map(({ id }) => id)).to.have.members(['derived-product1', 'derived-product2']);
  });

  it('should be able to ship products', async () => {
    const [, intermediary, cooperative, farmer] = actors;

    const firstShipRes = await chai
      .request(server)
      .post('/api/ship')
      .send({
        sender: farmer,
        recipient: intermediary,
        inputs: [{ productId: 'derived-product1' }, { productId: 'derived-product2' }],
        timestamp: new Date().toISOString(),
      });
    expect(firstShipRes).to.have.status(200);

    const { id: firstShipId } = firstShipRes.body;
    const firstShipConfirm = await chai.request(server).post('/api/receive').send({
      recipient: intermediary,
      shipment: firstShipId,
      timestamp: new Date().toISOString(),
    });
    expect(firstShipConfirm).to.have.status(200);

    const secondShipRes = await chai
      .request(server)
      .post('/api/ship')
      .send({
        sender: intermediary,
        recipient: cooperative,
        inputs: [{ productId: 'derived-product1' }, { productId: 'derived-product2' }],
        timestamp: new Date().toISOString(),
      });
    expect(secondShipRes).to.have.status(200);

    const { id: secondShipId } = secondShipRes.body;
    const secondShipConfirm = await chai.request(server).post('/api/receive').send({
      recipient: cooperative,
      shipment: secondShipId,
      timestamp: new Date().toISOString(),
    });
    expect(secondShipConfirm).to.have.status(200);

    const farmerInventoryRes = await chai.request(server).get(`/api/actor/${farmer}`);
    const { inventory: farmerInventory } = farmerInventoryRes.body;
    expect(farmerInventory).to.have.length(0);

    const intermediaryInventoryRes = await chai.request(server).get(`/api/actor/${intermediary}`);
    const { inventory: intermediaryInventory } = intermediaryInventoryRes.body;
    expect(intermediaryInventory).to.have.length(0);

    const cooperativeInventoryRes = await chai.request(server).get(`/api/actor/${cooperative}`);
    const { inventory: cooperativeInventory } = cooperativeInventoryRes.body;
    expect(cooperativeInventory).to.have.length(2);
    expect(cooperativeInventory.map(({ id }) => id)).to.have.members(['derived-product1', 'derived-product2']);
  });

  it('should be able to sell products', async () => {
    const [, intermediary, cooperative, farmer] = actors;

    const firstSellRes = await chai
      .request(server)
      .post('/api/sell')
      .send({
        seller: farmer,
        buyer: intermediary,
        inputs: [{ productId: 'derived-product1' }, { productId: 'derived-product2' }],
        price: 2000,
        currency: 'COP',
        timestamp: new Date().toISOString(),
      });
    expect(firstSellRes).to.have.status(200);

    const { id: firstSellId } = firstSellRes.body;
    const firstSellConfirm = await chai.request(server).post('/api/buy').send({
      buyer: intermediary,
      sale: firstSellId,
      timestamp: new Date().toISOString(),
    });
    expect(firstSellConfirm).to.have.status(200);

    const secondSellRes = await chai
      .request(server)
      .post('/api/sell')
      .send({
        seller: intermediary,
        buyer: cooperative,
        inputs: [{ productId: 'derived-product1' }, { productId: 'derived-product2' }],
        price: 2500,
        currency: 'COP',
        timestamp: new Date().toISOString(),
      });
    expect(secondSellRes).to.have.status(200);

    const { id: secondSellId } = secondSellRes.body;
    const secondSellConfirm = await chai.request(server).post('/api/buy').send({
      buyer: cooperative,
      sale: secondSellId,
      timestamp: new Date().toISOString(),
    });
    expect(secondSellConfirm).to.have.status(200);

    const farmerOwnershipRes = await chai.request(server).get(`/api/actor/${farmer}`);
    const { ownership: farmerOwnership } = farmerOwnershipRes.body;
    expect(farmerOwnership).to.have.length(0);

    const intermediaryOwnershipRes = await chai.request(server).get(`/api/actor/${intermediary}`);
    const { ownership: intermediaryOwnership } = intermediaryOwnershipRes.body;
    expect(intermediaryOwnership).to.have.length(0);

    const cooperativeOwnershipRes = await chai.request(server).get(`/api/actor/${cooperative}`);
    const { ownership: cooperativeOwnership } = cooperativeOwnershipRes.body;
    expect(cooperativeOwnership).to.have.length(2);
    expect(cooperativeOwnership.map(({ id }) => id)).to.have.members(['derived-product1', 'derived-product2']);
  });

  it('should be able to certify an actor', async () => {
    const [, , certifier, certifiee] = actors;

    const res = await chai.request(server).post('/api/certificate').send({
      emitter: certifier,
      receiver: certifiee,
      type: 'FLO',
      beginning: '2021-01-01',
      expiration: '2022-01-01',
    });
    expect(res).to.have.status(200);

    const certificateRes = await chai.request(server).get(`/api/actor/${certifiee}`);
    const { certificates } = certificateRes.body;
    expect(certificates).to.have.length(1);
    expect(certificates[0].type).to.equal('FLO');
  });

  it('should be able to record a sustanability practice', async () => {
    const [, , certifier, certifiee] = actors;

    const res = await chai.request(server).post('/api/practice').send({
      emitter: certifier,
      receiver: certifiee,
      type: 'WTS',
      timestamp: '2021-01-01',
    });
    expect(res).to.have.status(200);

    const practiceRes = await chai.request(server).get(`/api/actor/${certifiee}`);
    const { practices } = practiceRes.body;
    expect(practices).to.have.length(1);
    expect(practices[0].type).to.equal('WTS');
  });

  it('should be able to retrieve pending shipments and sales', async () => {
    const [, , recipient, farmer] = actors;

    const resTransform = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [],
        outputs: [
          {
            productId: 'test-product',
            weight: 1000,
            type: 'DRY_PARCHMENT',
            varieties: [{ name: 'CASTILLO', amount: 1 }],
          },
        ],
        timestamp: new Date().toISOString(),
      });
    expect(resTransform).to.have.status(200);

    const resShip = await chai
      .request(server)
      .post('/api/ship')
      .send({
        sender: farmer,
        recipient,
        inputs: [{ productId: 'test-product' }],
        timestamp: new Date().toISOString(),
      });
    expect(resShip).to.have.status(200);

    const resSell = await chai
      .request(server)
      .post('/api/sell')
      .send({
        seller: farmer,
        buyer: recipient,
        inputs: [{ productId: 'test-product' }],
        price: 2000,
        currency: 'COP',
        timestamp: new Date().toISOString(),
      });
    expect(resSell).to.have.status(200);

    const resPending = await chai.request(server).get(`/api/pending/${recipient}`);
    expect(resPending).to.have.status(200);
    const { pendingSales, pendingShipments } = resPending.body;
    expect(pendingSales).to.have.length(1);
    expect(pendingShipments).to.have.length(1);
  });

  it('should only let farmers create new products', async () => {
    const actor = actors[0];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: actor,
        inputs: [],
        outputs: [{ productId: 'test', weight: 2000, type: 'PARCHMENT', variety: 'CASTILLO' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Only farmers can create new products');
  });

  it('should reject creation with wrong type', async () => {
    const farmer = actors[3];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [],
        outputs: [
          { productId: 'test', weight: 20000, type: 'ROASTED_COFFEE', varieties: [{ name: 'CATURRA', amount: 1 }] },
        ],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('A farmer can only create dry or wet parchment.');
  });

  it('should reject product creation with unspecified variety', async () => {
    const farmer = actors[3];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [],
        outputs: [{ productId: 'test', weight: 2000, type: 'PARCHMENT' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('The variety field is mandatory for the initial creation of new products');
  });

  it('should reject product transformation with specified variety', async () => {
    const cooperative = actors[2];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: cooperative,
        inputs: [{ productId: 'derived-product2' }],
        outputs: [{ productId: 'test', weight: 2000, type: 'PARCHMENT', varieties: [{ name: 'CATURRA', amount: 1 }] }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('The variety field is only supported for the initial creation of new products');
  });

  it('should reject vacuous transformations', async () => {
    const farmer = actors[3];

    const res = await chai.request(server).post('/api/transform').send({
      emitter: farmer,
      inputs: [],
      outputs: [],
      timestamp: new Date().toISOString(),
    });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Transformations must have outputs');
  });

  it('should reject weightless outputs', async () => {
    const farmer = actors[3];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [],
        outputs: [{ productId: 'test', weight: 0, type: 'DRY_PARCHMENT', varieties: [{ name: 'CATURRA', amount: 1 }] }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Cannot produce weightless products.');
  });

  it('should reject transformations when the in and out weight do not match (explicit weight loss)', async () => {
    const cooperative = actors[2];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: cooperative,
        inputs: [{ productId: 'derived-product2' }],
        outputs: [
          { productId: 'test', weight: 2000, type: 'PARCHMENT' },
          { productId: 'wl-x', weight: 0, type: 'WEIGHT_LOSS' },
        ],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('The cumulative weights of the inputs and outputs must be equal');
  });

  it('should reject transformations that consume a weight loss input', async () => {
    const cooperative = actors[2];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: cooperative,
        inputs: [{ productId: 'weight-loss1' }],
        outputs: [{ productId: 'test', weight: 50000, type: 'PARCHMENT' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Cannot consume a product of the weight loss type');
  });

  it('should reject transformations that consume an unexisting input', async () => {
    const cooperative = actors[2];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: cooperative,
        inputs: [{ productId: 'i-do-not-exist' }],
        outputs: [{ productId: 'test', weight: 50000, type: 'PARCHMENT' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Cannot consume a product that does not exist');
  });

  it('should reject transformations that use existing product ids for their outputs', async () => {
    const cooperative = actors[2];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: cooperative,
        inputs: [{ productId: 'derived-product2' }],
        outputs: [{ productId: 'derived-product1', weight: 25000, type: 'ROASTED' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Cannot use existing ids for new products');
  });

  it('should reject transformations with duplicated output ids', async () => {
    const cooperative = actors[2];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: cooperative,
        inputs: [{ productId: 'derived-product2' }],
        outputs: [
          { productId: 'derived-product-dup', weight: 20000, type: 'ROASTED' },
          { productId: 'derived-product-dup', weight: 5000, type: 'ROASTED' },
        ],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Found duplicated output id.');
  });

  it('should reject transformations that consume inputs the actor does not have', async () => {
    const farmer = actors[3];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [{ productId: 'derived-product2' }],
        outputs: [{ productId: 'derived-product3', weight: 25000, type: 'ROASTED' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Cannot consume input not in inventory');
  });

  // By definition, covers also inputs that do not exist at all
  it("should reject shipment of products not in the sender's inventory", async () => {
    const [, , cooperative, farmer] = actors;

    const res = await chai
      .request(server)
      .post('/api/ship')
      .send({
        sender: farmer,
        recipient: cooperative,
        inputs: [{ productId: 'derived-product2' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Cannot ship product not in inventory');
  });

  it('should reject shipments with no inputs', async () => {
    const [, , cooperative, farmer] = actors;

    const res = await chai.request(server).post('/api/ship').send({
      sender: farmer,
      recipient: cooperative,
      inputs: [],
      timestamp: new Date().toISOString(),
    });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Shipments must have inputs');
  });

  it('should reject shipments with duplicated output ids', async () => {
    const cooperative = actors[2];
    const intermediary = actors[0];

    const res = await chai
      .request(server)
      .post('/api/ship')
      .send({
        sender: cooperative,
        recipient: intermediary,
        inputs: [{ productId: 'derived-product1' }, { productId: 'derived-product1' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Found duplicated input id.');
  });

  it('should reject shipments when sender and recipient are the same actor', async () => {
    const cooperative = actors[2];

    const res = await chai
      .request(server)
      .post('/api/ship')
      .send({
        sender: cooperative,
        recipient: cooperative,
        inputs: [{ productId: 'derived-product1' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Sender and recipient must be different.');
  });

  // By definition, covers also inputs that do not exist at all
  it("should reject sale of products not in the seller's ownership", async () => {
    const [, , cooperative, farmer] = actors;

    const res = await chai
      .request(server)
      .post('/api/sell')
      .send({
        seller: farmer,
        buyer: cooperative,
        inputs: [{ productId: 'derived-product2' }],
        price: 2000,
        currency: 'COP',
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Cannot sell product not in ownership');
  });

  it('should reject shipments with no inputs', async () => {
    const [, , cooperative, farmer] = actors;

    const res = await chai.request(server).post('/api/sell').send({
      seller: farmer,
      buyer: cooperative,
      inputs: [],
      price: 2000,
      currency: 'COP',
      timestamp: new Date().toISOString(),
    });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Sales must have inputs');
  });

  it('should reject empty certification validity intervals', async () => {
    const [certifiee, certifier] = actors;

    const res = await chai.request(server).post('/api/certificate').send({
      emitter: certifier,
      receiver: certifiee,
      type: 'FLO',
      beginning: '2022-01-01',
      expiration: '2021-01-01',
    });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Invalid date range');
  });

  it('should compute fractions correctly in the provenance route', async () => {
    const farmer = actors[3];

    const firstTransformation = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [],
        outputs: [
          {
            productId: 'provenance-wp-1',
            weight: 25000,
            varieties: [{ name: 'CASTILLO', amount: 1 }],
            type: 'WET_PARCHMENT',
          },
          {
            productId: 'provenance-wp-2',
            weight: 25000,
            varieties: [{ name: 'CENICAFE', amount: 1 }],
            type: 'WET_PARCHMENT',
          },
          {
            productId: 'provenance-dp-1',
            weight: 25000,
            varieties: [
              { name: 'CATURRA', amount: 0.6 },
              { name: 'MARAGOGIPE', amount: 0.3 },
              { name: 'DOSMIL', amount: 0.1 },
            ],
            type: 'DRY_PARCHMENT',
          },
        ],
        timestamp: new Date().toISOString(),
      });
    expect(firstTransformation).to.have.status(200);

    const secondTransformatinon = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [{ productId: 'provenance-wp-1' }, { productId: 'provenance-wp-2' }],
        outputs: [{ productId: 'provenance-dp-2', weight: 25000, type: 'DRY_PARCHMENT' }],
        timestamp: new Date().toISOString(),
      });
    expect(secondTransformatinon).to.have.status(200);

    const thirdTransformation = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [{ productId: 'provenance-dp-1' }, { productId: 'provenance-dp-2' }],
        outputs: [{ productId: 'provenance-green-1', weight: 40000, type: 'GREEN' }],
        timestamp: new Date().toISOString(),
      });
    expect(thirdTransformation).to.have.status(200);

    const res = await chai.request(server).get('/api/product/provenance-green-1');
    const { provenance } = res.body;

    const total = provenance.reduce((prev, { fraction }) => prev + fraction, 0);

    expect(total).to.equal(1);
  });
});
