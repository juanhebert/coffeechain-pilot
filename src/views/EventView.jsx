import React, { useState, useEffect } from 'react';
import { Link, useHistory, useParams } from 'react-router-dom';

import {
  Avatar,
  Button,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Modal,
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
    margin: '50px 50px 0',
  },
  paper: {
    padding: theme.spacing(2),
    minWidth: 600,
  },
  modalPaper: {
    padding: theme.spacing(2),
    width: 450,
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
}));

const eventTypeTranslations = {
  transformation: 'Transformación',
  shipment: 'Envío',
  sale: 'Venta',
  certificate: 'Certificado',
  practice: 'Práctica de sostenibilidad',
};

const certificateTypeTranslations = {
  FLO: 'Fair Trade Organization (FLO)',
  UTZ: 'UTZ Certified',
  WTS: 'Tratamiento de aguas mieles',
  ST: 'Árboles de sombra',
  RE: 'Uso de energías renovelables',
  PH: 'Uso de herbicidas',
  PF: 'Uso de fungicidas',
  PI: 'Uso de insecticidas',
  PN: 'No se usan pesticidas',
  MM: 'Manejo responsable de productos químicos',
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

const EvidenceTable = ({ items, handleSeeText }) => {
  const classes = useStyles();

  return (
    <Table className={classes.table} aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell className={classes.tableHeadCell}>ID del documento</TableCell>
          <TableCell className={classes.tableHeadCell}>Tipo de documento</TableCell>
          <TableCell className={classes.tableHeadCell}>Título</TableCell>
          <TableCell className={classes.tableHeadCell}>Autor</TableCell>
          <TableCell className={classes.tableHeadCell}>Fecha y hora</TableCell>
          <TableCell className={classes.tableHeadCell}>Acceso</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(({ id, type, timestamp, title, description, filename, emittername }) => (
          <TableRow key={id}>
            <TableCell component="th" scope="row">
              {id}
            </TableCell>
            <TableCell>{type === 'TEXT' ? 'Texto' : 'Archivo'}</TableCell>
            <TableCell>{title}</TableCell>
            <TableCell>{emittername}</TableCell>
            <TableCell>{new Date(timestamp).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</TableCell>
            <TableCell>
              {type === 'TEXT' ? (
                <Button variant="contained" color="secondary" onClick={handleSeeText(title, description)}>
                  Ver
                </Button>
              ) : (
                <>
                  <Button variant="contained" color="secondary" onClick={handleSeeText(title, description)}>
                    Info
                  </Button>
                  <Button variant="contained" color="secondary" target="_blank" href={filename}>
                    Descargar
                  </Button>
                </>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const EventView = () => {
  const classes = useStyles();

  const [eventData, setEventData] = useState();
  const [modalContent, setModalContent] = useState(null);
  const [modalTitle, setModalTitle] = useState('');

  const { eventId, eventType } = useParams();
  const history = useHistory();

  useEffect(async () => {
    if (['transformation', 'shipment', 'sale', 'certificate', 'practice'].includes(eventType)) {
      const { data } = await axios.get(`/api/${eventType}/${eventId}`);
      setEventData(data);
    } else {
      history.push('/'); // TODO: not found
    }
  }, []);

  const handleSeeText = (title, text) => () => {
    setModalTitle(title);
    setModalContent(text);
  };

  if (!eventData) {
    return null;
  }

  const { basicInfo, inputs, outputs, attachments } = eventData;
  const {
    emittername,
    receivername,
    buyername,
    sellername,
    sendername,
    recipientname,
    timestamp,
    confirmationtime,
    beginning,
    expiration,
    type: certType,
  } = basicInfo;

  return (
    <div className={classes.main}>
      <Modal open={!!modalContent} onClose={() => setModalContent(null)}>
        <Paper className={classes.modalPaper}>
          <h3>{modalTitle}</h3>
          {modalContent}
        </Paper>
      </Modal>
      <Grid container spacing={2} direction="column" alignItems="center">
        <Grid item>
          <Paper className={classes.paper}>
            <Typography variant="h5" className={classes.heading}>
              Información básica
            </Typography>
            <List className={classes.root}>
              <InfoListItem value={eventTypeTranslations[eventType]} isType title="Tipo" />
              <InfoListItem
                value={certType}
                isCert
                title={`Tipo de ${eventType === 'certificate' ? 'certificado' : 'práctica'}`}
              />
              <InfoListItem value={emittername} title="Emisor" />
              <InfoListItem value={receivername} title="Receptor" />
              <InfoListItem value={sellername} title="Vendedor" />
              <InfoListItem value={buyername} title="Comprador" />
              <InfoListItem value={sendername} title="Remitente" />
              <InfoListItem value={recipientname} title="Destinatario" />
              <InfoListItem value={timestamp} isDate title="Fecha y hora" />
              <InfoListItem
                value={confirmationtime}
                isDate
                showFalsey={['shipment', 'sale'].includes(eventType)}
                title="Confirmado el"
              />
              <InfoListItem value={beginning} isDate title="Comienzo" />
              <InfoListItem value={expiration} isDate title="Final" />
            </List>
          </Paper>
        </Grid>
        {inputs && (
          <Grid item>
            <Paper className={classes.paper}>
              <Typography variant="h5" className={classes.heading}>
                Entradas
              </Typography>
              <InventoryTable inventory={inputs} />
            </Paper>
          </Grid>
        )}
        {outputs && (
          <Grid item>
            <Paper className={classes.paper}>
              <Typography variant="h5" className={classes.heading}>
                Salidas
              </Typography>
              <InventoryTable inventory={outputs} />
            </Paper>
          </Grid>
        )}
        <Grid item>
          <Paper className={classes.paper}>
            <Typography variant="h5" className={classes.heading}>
              Evidencia
            </Typography>
            <EvidenceTable items={attachments} handleSeeText={handleSeeText} />
            <Link to={`/evidence/${eventType}/${eventId}`}>
              <Button variant="contained" color="primary">
                Registrar evidencia
              </Button>
            </Link>
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default EventView;
