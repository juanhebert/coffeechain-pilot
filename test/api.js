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

describe('API tests', () => {
  before(() => db.none(resetSchema));

  let dbActors;

  it('should be able to add actors to the database', async () => {
    const actors = [
      { name: 'Claire', location: 'Bordeaux', picture: null, type: 'FARMER' },
      { name: 'Pierre', location: 'Strasbourg', picture: null, type: 'FARMER' },
      { name: 'Jean', location: 'Paris', picture: null, type: 'FARMER' },
      { name: 'Huguette', location: 'Marseille', picture: null, type: 'FARMER' },
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
          { productId: 'initial-product1', weight: 50000, type: 'GREEN' },
          { productId: 'initial-product2', weight: 50000, type: 'GREEN' },
        ],
        timestamp: new Date().toISOString(),
      });
    expect(transformRes).to.have.status(200);

    const inventoryRes = await chai.request(server).get(`/api/inventory/${farmer}`);
    const { items: inventory } = inventoryRes.body;
    expect(inventory).to.have.length(2);
    expect(inventory[0].id).to.equal('initial-product1');
    expect(inventory[1].id).to.equal('initial-product2');

    const ownershipRes = await chai.request(server).get(`/api/inventory/${farmer}`);
    const { items: ownership } = ownershipRes.body;
    expect(ownership).to.have.length(2);
    expect(ownership[0].id).to.equal('initial-product1');
    expect(ownership[1].id).to.equal('initial-product2');
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

    const inventoryRes = await chai.request(server).get(`/api/inventory/${farmer}`);
    const { items: inventory } = inventoryRes.body;
    expect(inventory).to.have.length(2);
    expect(inventory.map(({ id }) => id)).to.have.members(['derived-product1', 'derived-product2']);

    const ownershipRes = await chai.request(server).get(`/api/ownership/${farmer}`);
    const { items: ownership } = ownershipRes.body;
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

    const farmerInventoryRes = await chai.request(server).get(`/api/inventory/${farmer}`);
    const { items: farmerInventory } = farmerInventoryRes.body;
    expect(farmerInventory).to.have.length(0);

    const intermediaryInventoryRes = await chai.request(server).get(`/api/inventory/${farmer}`);
    const { items: intermediaryInventory } = intermediaryInventoryRes.body;
    expect(intermediaryInventory).to.have.length(0);

    const cooperativeInventoryRes = await chai.request(server).get(`/api/inventory/${cooperative}`);
    const { items: cooperativeInventory } = cooperativeInventoryRes.body;
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

    const farmerOwnershipRes = await chai.request(server).get(`/api/ownership/${farmer}`);
    const { items: farmerOwnership } = farmerOwnershipRes.body;
    expect(farmerOwnership).to.have.length(0);

    const intermediaryOwnershipRes = await chai.request(server).get(`/api/ownership/${farmer}`);
    const { items: intermediaryOwnership } = intermediaryOwnershipRes.body;
    expect(intermediaryOwnership).to.have.length(0);

    const cooperativeOwnershipRes = await chai.request(server).get(`/api/ownership/${cooperative}`);
    const { items: cooperativeOwnership } = cooperativeOwnershipRes.body;
    expect(cooperativeOwnership).to.have.length(2);
    expect(cooperativeOwnership.map(({ id }) => id)).to.have.members(['derived-product1', 'derived-product2']);
  });
});
