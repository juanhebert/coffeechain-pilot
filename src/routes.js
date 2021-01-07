const bodyParser = require('body-parser');
const express = require('express');
const fileUpload = require('express-fileupload');
const path = require('path');
const humps = require('humps');

const options = {
  receive: data => {
    const template = data[0];
    template.forEach(prop => {
      const camel = humps.camelize(prop);
      if (!(camel in template)) {
        for (let i = 0; i < data.length; i += 1) {
          const d = data[i];
          d[camel] = d[prop];
          delete d[prop];
        }
      }
    });
  },
};

const pgp = require('pg-promise')(options);

const cn = process.env.DATABASE_URL || 'postgres://coffeebrain:coffeebrain-local@localhost:5432/coffeebrain';
const db = pgp(cn);

const app = express();
app.use(bodyParser.json());
app.use(fileUpload());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/img', express.static(path.join(__dirname, '..', 'img')));

app.get('/api', (req, res) => {
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
