import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';
import { Grid, Paper, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@material-ui/core';
import useMediaQuery from '@material-ui/core/useMediaQuery';

const useStyles = makeStyles(theme => ({
  main: {
    margin: '12px 0',
    maxWidth: '100%',
  },
  section: {
    width: 320,
  },
  sectionDesktop: {
    width: 600,
  },
  paper: {
    padding: theme.spacing(2),
    overflow: 'scroll',
  },
  tableHeadCell: {
    fontWeight: 700,
  },
  heading: {
    marginBottom: 25,
  },
  link: {
    textDecoration: 'none',
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

  const geqDesktopBreakpoint = useMediaQuery('(min-width: 600px)');
  const sectionClassName = geqDesktopBreakpoint ? classes.sectionDesktop : classes.section;

  const [events, setEvents] = useState([]);
  useEffect(async () => {
    const { data } = await axios.get('/api/event');
    setEvents(data.events);
  }, []);

  return (
    <Grid container className={classes.main} direction="column" alignItems="center" spacing={3}>
      <Grid item className={sectionClassName}>
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
                    <Link to={`/events/${type.toLowerCase()}/${id}`} className={classes.link}>
                      {id}
                    </Link>
                  </TableCell>
                  <TableCell>{eventTypes[type]}</TableCell>
                  <TableCell>{emittername}</TableCell>
                  <TableCell>{new Date(timestamp).toLocaleString('es-CO', { timeZone: 'America/Bogota' })}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default EventList;
