/* eslint-disable no-console */
const yargs = require('yargs');
const pgPromise = require('pg-promise');
const short = require('short-uuid');

const cn = process.env.DATABASE_URL || 'postgres://coffeechain:coffeechain-local@localhost:5432/coffeechain';
const pgp = pgPromise();
const db = pgp(cn);

const { resetSchema, newActor } = require('./src/database/queries');

const { argv } = yargs.alias('r', 'reset').alias('a', 'actors');

const actors = [
  {
    name: 'Ernesto Cárdenas',
    location: 'Titiribí, Colombia',
    type: 'FARMER',
  },
  {
    name: 'Cooperativa de Caficultores de Antioquia',
    location: 'Medellín, Colombia',
    type: 'COOPERATIVE',
  },
  {
    name: 'Almacafé',
    location: 'Medellín, Colombia',
    type: 'DRY_MILL',
  },
  {
    name: 'Löfberg',
    location: 'Karlstad, Sweden',
    type: 'ROASTER',
  },
];

const runMigration = async () => {
  const { reset } = argv;

  if (reset || actors) {
    console.log('Wiping the database...');
    await db.none(resetSchema);
  }

  if (actors) {
    console.log('Adding actors to the database...');
    await Promise.all(
      actors.map(async ({ name, location, type, info }) => {
        const id = short.generate();
        await db.none(newActor, [id, name, location, null, type, info]);
      }),
    );
  }
};

runMigration()
  .then(() => {
    console.log('Done');
    process.exit(0);
  })
  .catch(err => {
    console.log(err);
    process.exit(1);
  });
