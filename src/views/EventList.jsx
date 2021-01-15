import React, { useEffect, useState } from 'react';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core';

const useStyles = makeStyles(theme => ({
  main: {
    margin: '50px 50px 0',
    display: 'flex',
    justifyContent: 'center',
  },
  paper: {
    padding: theme.spacing(2),
    maxWidth: 800,
  },
  tableHeadCell: {
    fontWeight: 700,
  },
  heading: {
    marginBottom: 25,
  },
}));

const eventTypes = {
  TRANSFORMATION: 'Transformación',
  SHIPMENT: 'Envío',
  SALE: 'Venta',
  CERTIFICATE: 'Certificado',
  PRACTICE: 'Práctica de sostenibilidad',
};

const EventList = () => {
  const classes = useStyles();

  const [events, setEvents] = useState([]);
  useEffect(async () => {
    const { data } = await axios.get('/api/event');
    setEvents(data.events);
  }, []);

  return (
    <div className={classes.main}>
      <Paper className={classes.paper}>
        <Typography variant="h5" className={classes.heading}>
          Eventos
        </Typography>
        <Table aria-label="events table">
          <TableHead>
            <TableRow>
              <TableCell className={classes.tableHeadCell}>ID del evento</TableCell>
              <TableCell className={classes.tableHeadCell}>Tipo de evento</TableCell>
              <TableCell className={classes.tableHeadCell}>Emisor</TableCell>
              <TableCell className={classes.tableHeadCell}>Fecha</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map(({ id, emittername, timestamp, type }) => (
              <TableRow key={id}>
                <TableCell component="th" scope="row">
                  {id}
                </TableCell>
                <TableCell>{eventTypes[type]}</TableCell>
                <TableCell>{emittername}</TableCell>
                <TableCell>{new Date(timestamp).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </div>
  );
};

export default EventList;
