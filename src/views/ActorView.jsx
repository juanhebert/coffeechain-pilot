import React, { useState, useEffect } from 'react';
import { Avatar, FormControl, Grid, MenuItem, Paper, Select, Typography } from '@material-ui/core';
import { deepPurple } from '@material-ui/core/colors';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';

import { Link } from 'react-router-dom';
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
  },
  avatar: {
    height: 40,
    color: theme.palette.getContrastText(deepPurple[500]),
    backgroundColor: deepPurple[500],
  },
  certLogo: {
    height: 25,
    width: 25,
  },
  certLogoItem: {
    margin: '0 10px',
  },
  certName: {
    fontSize: 10,
    fontWeight: 700,
  },
  heading: {
    marginBottom: 25,
  },
  dropdown: {
    minWidth: 250,
  },
}));

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

const actorTypeStrings = {
  FARMER: 'Caficultor',
  COOPERATIVE: 'Cooperativa',
  DRY_MILL: 'Beneficio seco',
  WET_MILL: 'Beneficio húmedo',
  ROASTER: 'Tostador',
  IMPORTER: 'Importador',
  EXPORTER: 'Exportador',
};

const actorInfoStrings = {
  area: 'Área',
  elevation: 'Elevación',
  name: 'Nombre',
};

const actorInfoUnits = {
  area: 'ha',
  elevation: 'm s. n. m.',
  name: '',
};

const ActorView = () => {
  const classes = useStyles();

  const [actorList, setActorList] = useState([]);
  const [selectedActorIndex, setSelectedActorIndex] = useState('');
  const [selectedActor, setSelectedActor] = useState();
  const [actorInfo, setActorInfo] = useState();

  useEffect(async () => {
    const { data } = await axios.get('/api/actor');
    const { actors } = data;
    setActorList(actors);
  }, []);

  useEffect(async () => {
    if (selectedActor) {
      const { data } = await axios.get(`/api/actor/${selectedActor.id}`);
      setActorInfo(data);
    }
  }, [selectedActor]);

  const { inventory = [], ownership = [], certificates = [] } = actorInfo || {};
  const { name, location, type, info } = selectedActor || {};

  const handleChange = event => {
    const index = event.target.value;
    setSelectedActor(actorList[index]);
    setSelectedActorIndex(index);
  };

  return (
    <div className={classes.main}>
      <Grid container spacing={3}>
        <Grid item xs={3} container spacing={2} direction="column">
          <Grid item>
            <Paper className={classes.paper}>
              <Typography variant="h5" className={classes.heading}>
                Seleccionar actor
              </Typography>
              <FormControl>
                <Select
                  labelId="demo-simple-select-label"
                  id="demo-simple-select"
                  value={selectedActorIndex}
                  onChange={handleChange}
                  className={classes.dropdown}
                >
                  {actorList.map(({ id, name: actorName }, index) => (
                    <MenuItem value={index} key={id}>
                      {actorName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Paper>
          </Grid>
          {selectedActor && (
            <Grid item>
              <Paper className={classes.paper}>
                <Grid container direction="column" alignItems="center" justify="space-around" spacing={3}>
                  <Grid item container direction="column" alignItems="center">
                    <Avatar className={classes.avatar}>{name[0]}</Avatar>
                    <h3>{name}</h3>
                  </Grid>
                  <Grid item container justify="center" alignItems="center">
                    {certificates.map(({ type: certType, id: certId }) => (
                      <Link to={`/events/certificate/${certId}`}>
                        <Grid
                          item
                          container
                          direction="column"
                          alignItems="center"
                          className={classes.certLogoItem}
                          spacing={1}
                          xs={1}
                          key={certType}
                        >
                          <img src={getCertLogo(certType)} alt={certType} className={classes.certLogo} />

                          <span className={classes.certName}>{certType}</span>
                        </Grid>
                      </Link>
                    ))}
                  </Grid>
                  <Grid item container spacing={1} direction="column" alignItems="center">
                    <Grid item>
                      <b>Ubicación:</b> {location}
                    </Grid>
                    <Grid item>
                      <b>Rol:</b> {actorTypeStrings[type]}
                    </Grid>
                    {info &&
                      Object.entries(info).map(([key, value]) => (
                        <Grid item>
                          <b>{actorInfoStrings[key]}:</b> {value} {actorInfoUnits[key]}
                        </Grid>
                      ))}
                  </Grid>
                  <Grid item />
                </Grid>
              </Paper>
            </Grid>
          )}
        </Grid>
        <Grid container item xs={9} spacing={2}>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Typography variant="h5" className={classes.heading}>
                Inventorio (custodia)
              </Typography>
              <InventoryTable inventory={inventory} />
            </Paper>
          </Grid>
          <Grid item xs={12}>
            <Paper className={classes.paper}>
              <Typography variant="h5" className={classes.heading}>
                Inventorio (propiedad)
              </Typography>
              <InventoryTable inventory={ownership} />
            </Paper>
          </Grid>
        </Grid>
      </Grid>
    </div>
  );
};

export default ActorView;
