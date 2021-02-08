import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button, Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';

import { useLogin } from '../LoginContext';

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

const EventView = () => {
  const classes = useStyles();

  const [pendingData, setPendingData] = useState({});
  const [login] = useLogin();

  const { id } = login;

  useEffect(async () => {
    if (id) {
      const { data } = await axios.get(`/api/pending/${id}`);
      setPendingData(data);
    }
  }, [id]);

  const handleSaleConfirmation = sale => () => {
    const timestamp = new Date().toISOString();
    axios.post('/api/buy', { buyer: id, sale, timestamp }).then(async () => {
      const { data } = await axios.get(`/api/pending/${id}`);
      setPendingData(data);
    });
  };

  const handleShipmentConfirmation = shipment => () => {
    const timestamp = new Date().toISOString();
    axios.post('/api/receive', { recipient: id, shipment, timestamp }).then(async () => {
      const { data } = await axios.get(`/api/pending/${id}`);
      setPendingData(data);
    });
  };

  const { pendingSales = [], pendingShipments = [] } = pendingData;

  return (
    <div className={classes.main}>
      <Grid container spacing={2} direction="column" alignItems="center">
        <Grid item>
          <Paper className={classes.paper}>
            <Typography variant="h5" className={classes.heading}>
              Ventas pendientes
            </Typography>
            <PendingTable items={pendingSales} showSaleFields handleSaleConfirmation={handleSaleConfirmation} />
          </Paper>
        </Grid>
        <Grid item>
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

export default EventView;
