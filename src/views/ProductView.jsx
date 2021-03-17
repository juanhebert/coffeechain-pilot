import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Cell, Legend, Pie, PieChart } from 'recharts';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import {
  Avatar,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { AccountCircle, Schedule, Note } from '@material-ui/icons';

import InventoryTable from '../components/InventoryTable';

import UtzLogo from '../img/utz-certified-logo.svg';
import FloLogo from '../img/flocert-logo.svg';
import DefaultCertLogo from '../img/certificate.svg';

const useStyles = makeStyles(theme => ({
  main: {
    margin: '12px 0',
    maxWidth: '100%',
  },
  paper: {
    padding: theme.spacing(2),
    overflow: 'scroll',
  },
  modalPaper: {
    padding: theme.spacing(2),
    width: 300,
    margin: '100px auto',
    whiteSpace: 'pre-wrap',
  },
  heading: {
    marginBottom: 25,
  },
  avatarLogo: {
    height: '80%',
    width: '80%',
  },
  table: {
    minWidth: 0, // TODO
    marginBottom: 30,
  },
  tableHeadCell: {
    fontWeight: 700,
  },
  pie: {
    margin: 'auto',
  },
  section: {
    width: '95%',
    minWidth: 320,
  },
  sectionDesktop: {
    width: '95%',
    maxWidth: 750,
  },
}));

const certificateTypeTranslations = {
  FLO: 'Fair Trade Organization (FLO)',
  UTZ: 'UTZ Certified',
  '4C': '4C',
  WTS: 'Tratamiento de aguas mieles',
  ST: 'Árboles de sombra',
  RE: 'Uso de energías renovelables',
  PH: 'Uso de herbicidas',
  PF: 'Uso de fungicidas',
  PI: 'Uso de insecticidas',
  PN: 'No se usan pesticidas',
  MM: 'Manejo responsable de productos químicos',
  CM: 'Compostaje',
  CC: 'Cultivos de cobertora/alternativos',
  HM: 'Medidor de humedad',
  GR: 'Germinador',
  AB: 'Camas africanas',
};

const productTypeVarieties = {
  WET_PARCHMENT: 'Pergamino húmedo',
  DRY_PARCHMENT: 'Pergamino seco',
  GREEN: 'Café verde',
  ROASTED: 'Café tostado',
  WEIGHT_LOSS: 'Pérdidas',
  CENICAFE: 'Cenicafé uno',
  CASTILLO: 'Castillo',
  CATURRA: 'Caturra',
  TIPICA: 'Típica',
  TABI: 'Tabí',
  BORBON: 'Borbón',
  MARAGOGIPE: 'Maragogipe',
  DOSMIL: 'Variedad 2000',
  CATIMORO: 'Catimoro',
};

const getCertLogo = certType => {
  switch (certType) {
    case 'FLO':
      return FloLogo;
    case 'UTZ':
      return UtzLogo;
    default:
      return DefaultCertLogo;
  }
};

const InfoListItem = ({ value, title, isDate = false, isType = false, isCert = false, showFalsey = false }) => {
  if (!showFalsey && !value) return null;

  const classes = useStyles();

  const Icon = () => {
    if (isDate) {
      return <Schedule />;
    }
    if (isType) {
      return <Note />;
    }
    if (isCert) {
      return <Avatar src={getCertLogo(value)} alt={value} imgProps={{ className: classes.avatarLogo }} />;
    }
    return <AccountCircle />;
  };

  let secondary = value;
  if (isDate) {
    secondary = value ? new Date(value).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Sin confirmar';
  }
  if (isCert) {
    secondary = certificateTypeTranslations[value];
  }

  return (
    <ListItem>
      <ListItemAvatar>
        <Avatar>
          <Icon />
        </Avatar>
      </ListItemAvatar>
      <ListItemText primary={title} secondary={secondary} />
    </ListItem>
  );
};

const PracticeTable = ({ items, isCert = false }) => {
  const classes = useStyles();

  return (
    <Table className={classes.table} aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell className={classes.tableHeadCell}>
            {isCert ? 'Certificado' : 'Práctica de sostenibilidad'}
          </TableCell>
          <TableCell className={classes.tableHeadCell}>Porcentaje de caficultores</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(({ name, percentage }) => (
          <TableRow key={name}>
            <TableCell component="th" scope="row">
              {certificateTypeTranslations[name]}
            </TableCell>
            <TableCell>{`${percentage}%`}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const ProducerTable = ({ items }) => {
  const classes = useStyles();

  return (
    <Table className={classes.table} aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell className={classes.tableHeadCell}>Nombre</TableCell>
          <TableCell className={classes.tableHeadCell}>Contribución</TableCell>
          <TableCell className={classes.tableHeadCell}>Pago</TableCell>
          <TableCell className={classes.tableHeadCell}>Ubicación</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(({ name, contribution, payout: { amount, currency }, location }) => (
          <TableRow key={name}>
            <TableCell component="th" scope="row">
              {name}
            </TableCell>
            <TableCell>{`${contribution * 100}%`}</TableCell>
            <TableCell>{`${currency} ${amount}`}</TableCell>
            <TableCell>{location}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const CustodyTable = ({ items }) => {
  const classes = useStyles();

  return (
    <Table className={classes.table} aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell className={classes.tableHeadCell}>Actor</TableCell>
          <TableCell className={classes.tableHeadCell}>Desde</TableCell>
          <TableCell className={classes.tableHeadCell}>Hasta</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(({ actorName, start, end }) => (
          <TableRow key={actorName}>
            <TableCell component="th" scope="row">
              {actorName}
            </TableCell>
            <TableCell>{new Date(start).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</TableCell>
            <TableCell>
              {end ? new Date(end).toLocaleString('es-CO', { timeZone: 'America/Bogota' }) : 'Ahora'}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const pieColors = ['#003f5c', '#2f4b7c', '#665191', '#a05195', '#d45087', '#f95d6a', '#ff7c43', '#ffa600'];

const ProductView = () => {
  const classes = useStyles();

  const geqDesktopBreakpoint = useMediaQuery('(min-width: 600px)');
  const sectionClassName = geqDesktopBreakpoint ? classes.sectionDesktop : classes.section;

  const [productData, setProductData] = useState();

  const { productId } = useParams();

  useEffect(async () => {
    const { data } = await axios.get(`/api/product/${productId}`);
    setProductData(data);
  }, [productId]);

  if (!productData) {
    return null;
  }

  const {
    weight,
    type,
    varieties: variety,
    emittername,
    timestamp,
    provenance,
    tallies,
    farmerInfo,
    custody,
  } = productData;
  const { varieties, certificates, practices } = tallies;

  const varietyPieData = Object.entries(varieties).map(([name, portion]) => ({ name, value: portion * 100 }));
  const certificateItems = Object.entries(certificates).map(([name, percentage]) => ({
    name,
    percentage: percentage * 100,
  }));
  const practiceItems = Object.entries(practices).map(([name, percentage]) => ({
    name,
    percentage: percentage * 100,
  }));

  return (
    <Grid container spacing={3} direction="column" alignItems="center" className={classes.main}>
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Typography variant="h5" className={classes.heading}>
            Información básica
          </Typography>
          <List className={classes.root}>
            <InfoListItem value={productId} isType title="ID" />
            <InfoListItem value={productTypeVarieties[type]} title="Tipo" />
            <InfoListItem value={weight / 1000} title="Peso (kg)" />
            <InfoListItem value={productTypeVarieties[variety]} title="Variedad" />
            <InfoListItem value={emittername} title="Emisor" />
            <InfoListItem value={timestamp} isDate title="Fecha y hora de producción" />
          </List>
        </Paper>
      </Grid>
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Typography variant="h5" className={classes.heading}>
            Proveniencia
          </Typography>
          <InventoryTable
            inventory={provenance.map(({ fraction, ...rest }) => ({ weight: weight * fraction, ...rest }))}
            displayFarmer
          />
        </Paper>
      </Grid>
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Typography variant="h5" className={classes.heading}>
            Custodia
          </Typography>
          <CustodyTable items={custody} />
        </Paper>
      </Grid>
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Typography variant="h5" className={classes.heading}>
            Composición
          </Typography>
          <PieChart width={280} height={280} className={classes.pie}>
            <Pie data={varietyPieData} nameKey="name" dataKey="value" cx="50%" cy="50%" fill="#8884d8" label>
              {varietyPieData.map(({ name }, i) => (
                <Cell key={`cell-${name}`} fill={pieColors[i % pieColors.length]} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </Paper>
      </Grid>
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Typography variant="h5" className={classes.heading}>
            Caficultores
          </Typography>
          <ProducerTable items={farmerInfo} />
        </Paper>
      </Grid>
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Typography variant="h5" className={classes.heading}>
            Certificados
          </Typography>
          <PracticeTable isCert items={certificateItems} />
        </Paper>
      </Grid>
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Typography variant="h5" className={classes.heading}>
            Practicas de sostenibilidad
          </Typography>
          <PracticeTable items={practiceItems} />
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ProductView;
