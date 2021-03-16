import React, { useState } from 'react';
import { Button, Collapse, Grid, IconButton, Paper, Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Close } from '@material-ui/icons';
import { MuiPickersUtilsProvider, DateTimePicker } from '@material-ui/pickers';
import { makeStyles } from '@material-ui/core/styles';
import DateFnsUtils from '@date-io/date-fns';
import esLocale from 'date-fns/locale/es';
import axios from 'axios';

import { useLogin } from '../LoginContext';
import ProductInput from '../components/ProductInput';

const useStyles = makeStyles(theme => ({
  main: {
    marginTop: '12px 0',
    maxWidth: '100%',
  },
  paper: {
    padding: theme.spacing(4),
    maxWidth: 310,
  },
  heading: {
    marginBottom: 25,
  },
  dropdown: {
    minWidth: 250,
  },
  section: {
    display: 'flex',
    justifyContent: 'center',
    maxWidth: '100%',
  },
  fsAligned: {
    alignSelf: 'flex-start',
  },
}));

const TransformView = () => {
  const classes = useStyles();

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [login] = useLogin();
  const [partialIn, setPartialIn] = useState(false);
  const [partialOut, setPartialOut] = useState(false);

  const { id: emitter, info } = login;
  const { varieties = [] } = info || {};

  const total = varieties.reduce((prev, { amount }) => prev + amount, 0);
  const computedVariety = varieties.map(({ variety, amount }) => ({ name: variety, amount: amount / total }));

  const onSubmit = () => {
    setShowError(false);
    setShowSuccess(false);
    const timestamp = selectedDate.toISOString();

    const queryOutputs = outputs.map(({ variety, ...rest }) => ({
      ...rest,
      // eslint-disable-next-line no-nested-ternary
      varieties: variety ? [{ name: variety, amount: 1 }] : inputs.length === 0 ? computedVariety : null,
    }));

    axios
      .post('/api/transform', { emitter, timestamp, inputs, outputs: queryOutputs })
      .then(() => {
        setSelectedDate(new Date());
        setInputs([]);
        setOutputs([]);
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
            Transformación realizada exitosamente.
          </Alert>
        </Collapse>
      </Grid>
      <Grid item classes={classes.section}>
        <Paper className={classes.paper}>
          <Grid container direction="column" spacing={5}>
            <Grid item>
              <Typography variant="h5" className={classes.heading}>
                Transformar productos
              </Typography>
            </Grid>
            <Grid item container direction="column" spacing={2}>
              <Grid item>
                <Typography variant="h6" className={classes.heading}>
                  Información básica
                </Typography>
              </Grid>
              <Grid item className={classes.fsAligned}>
                <MuiPickersUtilsProvider utils={DateFnsUtils} locale={esLocale}>
                  <DateTimePicker
                    format="d MMMM yyyy 'a' 'las' hh:mm a"
                    className={classes.dropdown}
                    variant="inline"
                    inputVariant="outlined"
                    label="Fecha"
                    value={selectedDate}
                    onChange={setSelectedDate}
                  />
                </MuiPickersUtilsProvider>
              </Grid>
            </Grid>
            <Grid item>
              <Typography variant="h6" className={classes.heading}>
                Entradas
              </Typography>
              <ProductInput products={inputs} setProducts={setInputs} setPartialField={setPartialIn} />
            </Grid>
            <Grid item>
              <Typography variant="h6" className={classes.heading}>
                Salidas
              </Typography>
              <ProductInput
                products={outputs}
                setProducts={setOutputs}
                weightAndVariety
                setPartialField={setPartialOut}
              />
            </Grid>
            <Grid item>
              <Button
                disabled={partialIn || partialOut || outputs.length === 0}
                variant="contained"
                color="primary"
                onClick={onSubmit}
              >
                Enviar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default TransformView;
