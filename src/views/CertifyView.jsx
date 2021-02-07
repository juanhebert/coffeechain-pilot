import React, { useEffect, useState } from 'react';
import {
  Button,
  Collapse,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Close } from '@material-ui/icons';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import { makeStyles } from '@material-ui/core/styles';
import DateFnsUtils from '@date-io/date-fns';
import esLocale from 'date-fns/locale/es';
import axios from 'axios';

import { useLogin } from '../LoginContext';

const useStyles = makeStyles(theme => ({
  main: {
    marginTop: 15,
  },
  paper: {
    padding: theme.spacing(4),
  },
  heading: {
    marginBottom: 25,
  },
  dropdown: {
    minWidth: 300,
  },
  fsAligned: {
    alignSelf: 'flex-start',
  },
}));

const certifications = [
  { id: 'UTZ', name: 'UTZ Cerfified' },
  { id: 'FLO', name: 'Fair Trade/Comercio Justo' },
];

const CertifyView = () => {
  const classes = useStyles();

  const [actorList, setActorList] = useState([]);
  const [receiverIndex, setReceiverIndex] = useState(0);
  const [certificateIndex, setCertificateIndex] = useState(0);
  const [currentBeginning, setBeginning] = useState(new Date());
  const [currentExpiration, setExpiration] = useState(new Date());
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [login] = useLogin();

  const { id: emitter } = login;

  const handleReceiverChange = event => {
    const index = event.target.value;
    setReceiverIndex(index);
  };

  const handleCertificateChange = event => {
    const index = event.target.value;
    setCertificateIndex(index);
  };

  const onSubmit = () => {
    setShowError(false);
    setShowSuccess(false);
    const { id: receiver } = actorList[receiverIndex];
    const { id: type } = certifications[certificateIndex];
    const beginning = currentBeginning.toISOString();
    const expiration = currentExpiration.toISOString();

    axios
      .post('/api/certificate', { emitter, receiver, type, beginning, expiration })
      .then(() => {
        setBeginning(new Date());
        setExpiration(new Date());
        setShowError(false);
        setShowSuccess(true);
      })
      .catch(({ response }) => {
        const { error } = response.data;
        setErrorMsg(error);
        setShowSuccess(false);
        setShowError(true);
      });
  };

  useEffect(async () => {
    const { data } = await axios.get('/api/actor');
    const { actors } = data;
    setActorList(actors);
  }, []);

  return (
    <Grid container className={classes.main} direction="column" alignItems="center" spacing={3}>
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
            Certificado registrado exitosamente.
          </Alert>
        </Collapse>
      </Grid>
      <Grid item>
        <Paper className={classes.paper}>
          <Grid container direction="column" spacing={5}>
            <Grid item>
              <Typography variant="h5" className={classes.heading}>
                Registrar certificado
              </Typography>
            </Grid>
            <Grid item container direction="column" spacing={2}>
              <Grid item>
                <Typography variant="h6" className={classes.heading}>
                  Información básica
                </Typography>
              </Grid>
              <Grid item className={classes.fsAligned}>
                <FormControl variant="outlined" className={classes.dropdown}>
                  <InputLabel id="receiver-select-label">Destinatario</InputLabel>
                  <Select
                    label="Destinatario"
                    labelId="receiver-select-label"
                    id="receiver-select"
                    value={receiverIndex}
                    onChange={handleReceiverChange}
                    className={classes.dropdown}
                  >
                    {actorList.map(({ id, name: actorName }, index) => (
                      <MenuItem value={index} key={id}>
                        {actorName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item className={classes.fsAligned}>
                <FormControl variant="outlined" className={classes.dropdown}>
                  <InputLabel id="certificate-select-label">Tipo de certificado</InputLabel>
                  <Select
                    label="Tipo de certificado"
                    labelId="certificate-select-label"
                    id="certificate-select"
                    value={certificateIndex}
                    onChange={handleCertificateChange}
                    className={classes.dropdown}
                  >
                    {certifications.map(({ id, name: certificationName }, index) => (
                      <MenuItem value={index} key={id}>
                        {certificationName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item className={classes.fsAligned}>
                <MuiPickersUtilsProvider utils={DateFnsUtils} locale={esLocale}>
                  <DatePicker
                    format="d MMMM yyyy"
                    className={classes.dropdown}
                    variant="inline"
                    inputVariant="outlined"
                    label="Desde"
                    value={currentBeginning}
                    onChange={setBeginning}
                  />
                </MuiPickersUtilsProvider>
              </Grid>
              <Grid item className={classes.fsAligned}>
                <MuiPickersUtilsProvider utils={DateFnsUtils} locale={esLocale}>
                  <DatePicker
                    format="d MMMM yyyy"
                    className={classes.dropdown}
                    variant="inline"
                    inputVariant="outlined"
                    label="Hasta"
                    value={currentExpiration}
                    onChange={setExpiration}
                  />
                </MuiPickersUtilsProvider>
              </Grid>
            </Grid>
            <Grid item>
              <Button variant="contained" color="primary" onClick={onSubmit}>
                Enviar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default CertifyView;
