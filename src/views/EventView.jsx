import React, { useState, useEffect } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import { Avatar, Grid, List, ListItem, ListItemAvatar, ListItemText, Paper, Typography } from '@material-ui/core';
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
  heading: {
    marginBottom: 25,
  },
  avatarLogo: {
    height: '80%',
    width: '80%',
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

const InfoListItem = ({ value, title, isDate = false, isType = false, isCert = false }) => {
  if (!value) return null;

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
    secondary = new Date(value).toLocaleString('es-CO', { timeZone: 'America/Bogota' });
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

const EventView = () => {
  const classes = useStyles();

  const [eventData, setEventData] = useState();

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

  if (!eventData) {
    return null;
  }

  const { basicInfo, inputs, outputs } = eventData;
  const {
    emittername,
    receivername,
    buyername,
    sellername,
    sendername,
    recipientname,
    timestamp,
    beginning,
    expiration,
    type: certType,
  } = basicInfo;

  return (
    <div className={classes.main}>
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
      </Grid>
    </div>
  );
};

export default EventView;
