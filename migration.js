/* eslint-disable no-console */
const yargs = require('yargs');
const pgPromise = require('pg-promise');
const short = require('short-uuid');

const cn = process.env.DATABASE_URL || 'postgres://coffeechain:coffeechain-local@localhost:5432/coffeechain';
const pgp = pgPromise();
const db = pgp(cn);

const { resetSchema, newActor, newCertificate, newPractice } = require('./src/database/queries');

const { argv } = yargs.alias('r', 'reset').alias('a', 'actors');

const actors = [
  {
    name: 'Carlos Mauricio Correa Gutiérrez',
    location: 'Heliconia, Antioquia, Colombia',
    pluscode: '6748+PM',
    type: 'FARMER',
    info: {
      area: 2,
      varieties: [{ variety: 'CASTILLO', amount: 1 }],
    },
    certificates: ['4C', 'FLO'],
    practices: ['CM', 'PH', 'CC', 'HM', 'AB', 'ST'],
  },
  {
    name: 'Alonso Dejesús Ramírez',
    location: 'Titiribí, Antioquia, Colombia',
    pluscode: '35MM+58',
    type: 'FARMER',
    info: {
      area: 1.2,
      varieties: [
        { variety: 'CASTILLO', amount: 1 },
        { variety: 'CENICAFE', amount: 1 },
      ],
    },
    certificates: ['UTZ', '4C', 'FLO'],
    practices: ['CM', 'GR', 'PH', 'CC', 'ST'],
  },
  {
    name: 'Rosa Inés Ramírez De Cano',
    location: 'Titiribí, Antioquia, Colombia',
    pluscode: '35MM+58',
    type: 'FARMER',
    info: {
      area: 1.4,
      varieties: [
        { variety: 'CASTILLO', amount: 2 },
        { variety: 'CATIMORO', amount: 1 },
      ],
    },
    certificates: ['FLO'],
    practices: ['CM', 'GR', 'CC', 'AB', 'ST'],
  },
  {
    name: 'Luz Marina Calle Mejía',
    location: 'Titiribí, Antioquia, Colombia',
    pluscode: '35MM+58',
    type: 'FARMER',
    info: {
      area: 5,
      varieties: [
        { variety: 'CASTILLO', amount: 23000 },
        { variety: 'CENICAFE', amount: 2000 },
      ],
    },
    certificates: ['4C', 'FLO'],
    practices: ['CM', 'PH', 'CC', 'AB', 'ST'],
  },
  {
    name: 'Dúver Alexander Bedoya',
    location: 'Heliconia, Antioquia, Colombia',
    pluscode: '6748+PM',
    type: 'FARMER',
    info: {
      area: 6,
      varieties: [{ variety: 'CASTILLO', amount: 1 }],
    },
  },
  {
    name: 'Edwin David Bedoya Ramírez',
    location: 'Heliconia, Antioquia, Colombia',
    pluscode: '66MX+73',
    type: 'FARMER',
    info: {
      area: 1,
      varieties: [
        { variety: 'CASTILLO', amount: 800 },
        { variety: 'DOSMIL', amount: 2000 },
      ],
    },
    certificates: ['FLO'],
    practices: ['PH', 'CC', 'ST'],
  },
  {
    name: 'PSCC Titiribí',
    location: 'Titiribí, Antioquia, Colombia',
    pluscode: '3674+CJ',
    type: 'PURCHASING_POINT',
  },
  {
    name: 'PSCC Heliconia',
    location: 'Heliconia, Antioquia, Colombia',
    pluscode: '6748+PM',
    type: 'PURCHASING_POINT',
  },
  {
    name: 'Cooperativa de Caficultores de Antioquia',
    location: 'Medellín, Antioquia, Colombia',
    pluscode: '6CR2+9W',
    type: 'COOPERATIVE',
  },
  {
    name: 'Almacafé',
    location: 'Bello, Antioquia, Colombia',
    pluscode: '8C8V+QF',
    type: 'DRY_MILL',
  },
  {
    name: 'Almacafé Exportación',
    location: 'Buenaventura, Valle del Cauca, Colombia',
    pluscode: 'VXMJ+56',
    type: 'EXPORTER',
  },
  {
    name: 'Löfberg Import',
    location: 'Viborg, Danmark',
    pluscode: 'C9XF+JM',
    type: 'IMPORTER',
  },
  {
    name: 'Löfberg',
    location: 'Karlstad, Sverige',
    pluscode: '9GH4+24',
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

    let cooperativeId;
    let almacafeId;
    await Promise.all(
      actors.map(async ({ name, location, pluscode, type, info }, index) => {
        const id = short.generate();
        await db.none(newActor, [id, name, location, pluscode, null, type, info]);

        if (index === 8) {
          cooperativeId = id;
        }

        if (index === 9) {
          almacafeId = id;
        }

        actors[index].id = id;
      }),
    );

    const start = new Date('01 January 2020 00:00 UTC-5').toISOString();
    const end = new Date('31 December 2023 23:59 UTC-5').toISOString();

    await Promise.all(
      actors.map(async ({ id, certificates = [], practices = [] }) => {
        await Promise.all(
          certificates.map(certificate => {
            const certificateId = short.generate();
            return db.none(newCertificate, [certificateId, cooperativeId, id, certificate, start, end]);
          }),
        );

        await Promise.all(
          practices.map(practice => {
            const practiceId = short.generate();
            return db.none(newPractice, [practiceId, almacafeId, id, practice, start]);
          }),
        );
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
