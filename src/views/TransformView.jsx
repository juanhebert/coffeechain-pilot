import React, { useState } from 'react';
import { Button, Collapse, Grid, IconButton, Paper, Typography } from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Close } from '@material-ui/icons';
import { MuiPickersUtilsProvider, DateTimePicker } from '@material-ui/pickers';
import { makeStyles } from '@material-ui/core/styles';
import DateFnsUtils from '@date-io/date-fns';
import esLocale from 'date-fns/locale/es';
import axios from 'axios';
import useMediaQuery from '@material-ui/core/useMediaQuery';

import { useLogin } from '../LoginContext';
import ProductInput from '../components/ProductInput';

const useStyles = makeStyles(theme => ({
  main: {
    margin: '12px 0',
    maxWidth: '100%',
  },
  paper: {
    padding: theme.spacing(2),
  },
  heading: {
    marginBottom: 25,
  },
  section: {
    width: '95%',
    minWidth: 320,
  },
  sectionDesktop: {
    width: '95%',
    maxWidth: 750,
  },
  field: {
    width: 250,
  },
  fieldDesktop: {
    width: 350,
  },
}));

const TransformView = () => {
  const classes = useStyles();

  const geqDesktopBreakpoint = useMediaQuery('(min-width: 600px)');
  const sectionClassName = geqDesktopBreakpoint ? classes.sectionDesktop : classes.section;
  const fieldClassName = geqDesktopBreakpoint ? classes.fieldDesktop : classes.field;

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
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Grid container direction="column" alignItems="center" spacing={5}>
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
              <Grid item>
                <MuiPickersUtilsProvider utils={DateFnsUtils} locale={esLocale}>
                  <DateTimePicker
                    format="d MMMM yyyy 'a' 'las' hh:mm a"
                    className={fieldClassName}
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
              <ProductInput
                inputClassName={fieldClassName}
                products={inputs}
                setProducts={setInputs}
                setPartialField={setPartialIn}
              />
            </Grid>
            <Grid item>
              <Typography variant="h6" className={classes.heading}>
                Salidas
              </Typography>
              <ProductInput
                inputClassName={fieldClassName}
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
