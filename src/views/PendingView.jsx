import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Button,
  Collapse,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Close } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';

import { useLogin } from '../LoginContext';

const useStyles = makeStyles(theme => ({
  main: {
    margin: '12px 0',
    maxWidth: '100%',
  },
  paper: {
    padding: theme.spacing(2),
    width: 310,
    overflow: 'scroll',
  },
  section: {
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '100%',
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
  },
  tableHeadCell: {
    fontWeight: 700,
  },
}));

const PendingTable = ({ items, showSaleFields, handleSaleConfirmation, handleShipmentConfirmation }) => {
  const classes = useStyles();
  const eventType = showSaleFields ? 'sale' : 'shipment';
  const handler = showSaleFields ? handleSaleConfirmation : handleShipmentConfirmation;

  return (
    <Table className={classes.table} aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell className={classes.tableHeadCell}>ID del evento</TableCell>
          <TableCell className={classes.tableHeadCell}>{showSaleFields ? 'Vendedor' : 'Remitente'}</TableCell>
          {showSaleFields && <TableCell className={classes.tableHeadCell}>Precio</TableCell>}
          <TableCell className={classes.tableHeadCell}>Fecha</TableCell>
          <TableCell className={classes.tableHeadCell}>Confirmar?</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.map(({ id, sellername, sendername, price, currency, timestamp }) => (
          <TableRow key={id}>
            <TableCell component="th" scope="row">
              <Link to={`/events/${eventType}/${id}`}>{id}</Link>
            </TableCell>
            <TableCell>{showSaleFields ? sellername : sendername}</TableCell>
            {showSaleFields && <TableCell>{`${price} ${currency}`}</TableCell>}
            <TableCell>{new Date(timestamp).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</TableCell>
            <TableCell>
              <Button variant="contained" color="secondary" onClick={handler(id)}>
                Confirmar
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

const PendingView = () => {
  const classes = useStyles();

  const [pendingData, setPendingData] = useState({});
  const [login] = useLogin();
  const [errorMsg, setErrorMsg] = useState();
  const [successMsg, setSuccessMsg] = useState();
  const [showError, setShowError] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const { id } = login;

  useEffect(async () => {
    if (id) {
      const { data } = await axios.get(`/api/pending/${id}`);
      setPendingData(data);
    }
  }, [id]);

  const handleSaleConfirmation = sale => () => {
    setShowSuccess(false);
    setShowError(false);
    const timestamp = new Date().toISOString();
    axios
      .post('/api/buy', { buyer: id, sale, timestamp })
      .then(async () => {
        const { data } = await axios.get(`/api/pending/${id}`);
        setPendingData(data);
        setSuccessMsg('Venta confirmada.');
        setShowSuccess(true);
      })
      .catch(async () => {
        const { data } = await axios.get(`/api/pending/${id}`);
        setPendingData(data);
        setErrorMsg('Vuelva a intentar.');
        setShowError(true);
      });
  };

  const handleShipmentConfirmation = shipment => () => {
    setShowSuccess(false);
    setShowError(false);
    const timestamp = new Date().toISOString();
    axios
      .post('/api/receive', { recipient: id, shipment, timestamp })
      .then(async () => {
        const { data } = await axios.get(`/api/pending/${id}`);
        setPendingData(data);
        setSuccessMsg('Envío confirmado.');
        setShowSuccess(true);
      })
      .catch(async () => {
        const { data } = await axios.get(`/api/pending/${id}`);
        setPendingData(data);
        setErrorMsg('Vuelva a intentar.');
        setShowError(true);
      });
  };

  const { pendingSales = [], pendingShipments = [] } = pendingData;

  return (
    <div className={classes.main}>
      <Grid container spacing={2} direction="column" alignItems="center">
        <Grid item>
          <Collapse in={showError}>
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setShowError(false);
                  }}
                >
                  <Close fontSize="inherit" />
                </IconButton>
              }
              severity="error"
            >
              Error: {errorMsg}
            </Alert>
          </Collapse>
          <Collapse in={showSuccess}>
            <Alert
              action={
                <IconButton
                  aria-label="close"
                  color="inherit"
                  size="small"
                  onClick={() => {
                    setShowSuccess(false);
                  }}
                >
                  <Close fontSize="inherit" />
                </IconButton>
              }
              severity="success"
            >
              {successMsg}
            </Alert>
          </Collapse>
        </Grid>
        <Grid item className={classes.section}>
          <Paper className={classes.paper}>
            <Typography variant="h5" className={classes.heading}>
              Ventas pendientes
            </Typography>
            <PendingTable items={pendingSales} showSaleFields handleSaleConfirmation={handleSaleConfirmation} />
          </Paper>
        </Grid>
        <Grid item className={classes.section}>
          <Paper className={classes.paper}>
            <Typography variant="h5" className={classes.heading}>
              Envíos pendientes
            </Typography>
            <PendingTable items={pendingShipments} handleShipmentConfirmation={handleShipmentConfirmation} />
          </Paper>
        </Grid>
      </Grid>
    </div>
  );
};

export default PendingView;
