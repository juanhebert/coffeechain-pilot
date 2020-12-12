/* eslint-disable no-console */
const yargs = require('yargs');
const pgPromise = require('pg-promise');

const cn = process.env.DATABASE_URL || 'postgres://coffeechain:coffeechain-local@localhost:5432/coffeechain';
const pgp = pgPromise();
const db = pgp(cn);

const { resetSchema } = require('./src/database/queries');

const { argv } = yargs.alias('r', 'reset');

const runMigration = async () => {
  const { reset } = argv;

  if (reset) {
    console.log('Wiping the database...');
    await db.none(resetSchema);
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
