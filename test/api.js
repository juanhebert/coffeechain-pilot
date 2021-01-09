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

  let dbActors;

  it('should be able to add actors to the database', async () => {
    const actors = [
      {
        name: 'Ernesto Cárdenas',
        location: 'Titiribí, Colombia',
        picture: null,
        type: 'FARMER',
      },
      {
        name: 'Cooperativa de Caficultores de Antioquia',
        location: 'Medellín, Colombia',
        picture: null,
        type: 'COOPERATIVE',
      },
      {
        name: 'Almacafé',
        location: 'Medellín, Colombia',
        picture: null,
        type: 'DRY_MILL',
      },
      {
        name: 'Löfberg',
        location: 'Karlstad, Sweden',
        picture: null,
        type: 'ROASTER',
      },
    ];

    return Promise.all(
      actors.map(async actor => {
        const res = await chai.request(server).post('/api/actor').send(actor);
        expect(res).to.have.status(200);
      }),
    );
  });

  it('should be able to GET a list of all actors', async () => {
    const res = await chai.request(server).get('/api/actor');
    const { actors } = res.body;
    dbActors = actors.map(({ id }) => id);
    expect(res).to.have.status(200);
    expect(actors).to.have.length(4);
  });

  it('should be able to create a product', async () => {
    const farmer = dbActors[0];

    const transformRes = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: farmer,
        inputs: [],
        outputs: [
          { productId: 'initial-product1', weight: 50000, type: 'DRY_PARCHMENT', variety: 'CASTILLO' },
          { productId: 'initial-product2', weight: 50000, type: 'DRY_PARCHMENT', variety: 'CASTILLO' },
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
    const farmer = dbActors[0];

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
    const [farmer, cooperative, intermediary] = dbActors;

    const ship1Res = await chai
      .request(server)
      .post('/api/ship')
      .send({
        sender: farmer,
        recipient: intermediary,
        inputs: [{ productId: 'derived-product1' }, { productId: 'derived-product2' }],
        timestamp: new Date().toISOString(),
      });
    expect(ship1Res).to.have.status(200);

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
    const [farmer, cooperative, intermediary] = dbActors;

    const shipRes = await chai
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
    expect(shipRes).to.have.status(200);

    const secondShipRes = await chai
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
    expect(secondShipRes).to.have.status(200);

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
    const [farmer, certifier] = dbActors;

    const res = await chai.request(server).post('/api/certificate').send({
      emitter: certifier,
      receiver: farmer,
      type: 'FLO',
      beginning: '2021-01-01',
      expiration: '2022-01-01',
    });
    expect(res).to.have.status(200);

    const certificateRes = await chai.request(server).get(`/api/actor/${farmer}`);
    const { certificates } = certificateRes.body;
    expect(certificates).to.have.length(1);
    expect(certificates[0].type).to.equal('FLO');
  });

  it('should be able to record a sustanability practice', async () => {
    const [farmer, certifier] = dbActors;

    const res = await chai.request(server).post('/api/practice').send({
      emitter: certifier,
      receiver: farmer,
      type: 'WTS',
      timestamp: '2021-01-01',
    });
    expect(res).to.have.status(200);

    const practiceRes = await chai.request(server).get(`/api/actor/${farmer}`);
    const { practices } = practiceRes.body;
    expect(practices).to.have.length(1);
    expect(practices[0].type).to.equal('WTS');
  });

  it('should only let farmers create new products', async () => {
    const cooperative = dbActors[1];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: cooperative,
        inputs: [],
        outputs: [{ productId: 'test', weight: 2000, type: 'PARCHMENT', variety: 'CASTILLO' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Only farmers can create new products');
  });

  it('should reject product creation with unspecified variety', async () => {
    const farmer = dbActors[0];

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
    const cooperative = dbActors[1];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: cooperative,
        inputs: [{ productId: 'derived-product2' }],
        outputs: [{ productId: 'test', weight: 2000, type: 'PARCHMENT', variety: 'CATURRA' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('The variety field is only supported for the initial creation of new products');
  });

  it('should reject vacuous transformations', async () => {
    const farmer = dbActors[0];

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

  it('should reject transformations when the in and out weight do not match', async () => {
    const cooperative = dbActors[1];

    const res = await chai
      .request(server)
      .post('/api/transform')
      .send({
        emitter: cooperative,
        inputs: [{ productId: 'derived-product2' }],
        outputs: [{ productId: 'test', weight: 2000, type: 'PARCHMENT' }],
        timestamp: new Date().toISOString(),
      });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('The cumulative weights of the inputs and outputs must be equal');
  });

  it('should reject transformations that consume a weight loss input', async () => {
    const cooperative = dbActors[1];

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
    const cooperative = dbActors[1];

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
    const cooperative = dbActors[1];

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

  it('should reject transformations that consume inputs the actor does not have', async () => {
    const farmer = dbActors[0];

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
    const [farmer, cooperative] = dbActors;

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
    const [farmer, cooperative] = dbActors;

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

  // By definition, covers also inputs that do not exist at all
  it("should reject sale of products not in the seller's ownership", async () => {
    const [farmer, cooperative] = dbActors;

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
    const [farmer, cooperative] = dbActors;

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
    const [farmer, certifier] = dbActors;

    const res = await chai.request(server).post('/api/certificate').send({
      emitter: certifier,
      receiver: farmer,
      type: 'FLO',
      beginning: '2022-01-01',
      expiration: '2021-01-01',
    });
    const { error } = res.body;
    expect(res).to.have.status(400);
    expect(error).to.equal('Invalid date range');
  });

  // TODO: evidence framework tests
});
