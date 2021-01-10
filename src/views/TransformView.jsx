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
import { MuiPickersUtilsProvider, DateTimePicker } from '@material-ui/pickers';
import { makeStyles } from '@material-ui/core/styles';
import DateFnsUtils from '@date-io/date-fns';
import esLocale from 'date-fns/locale/es';
import axios from 'axios';

import ProductInput from '../components/ProductInput';

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

const TransformView = () => {
  const classes = useStyles();

  const [actorList, setActorList] = useState([]);
  const [emitterIndex, setEmitterIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputs, setInputs] = useState([]);
  const [outputs, setOutputs] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = event => {
    const index = event.target.value;
    setEmitterIndex(index);
  };

  const onSubmit = () => {
    setShowError(false);
    setShowSuccess(false);
    const { id: emitter } = actorList[emitterIndex];
    const timestamp = selectedDate.toISOString();

    axios
      .post('/api/transform', { emitter, timestamp, inputs, outputs })
      .then(() => {
        setEmitterIndex(0);
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
            Transformación realizada exitosamente.
          </Alert>
        </Collapse>
      </Grid>
      <Grid item>
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
                <FormControl variant="outlined" className={classes.dropdown}>
                  <InputLabel id="demo-simple-select-outlined-label">Actor</InputLabel>
                  <Select
                    labelId="demo-simple-select-outlined-label"
                    id="demo-simple-select-outlined"
                    value={emitterIndex}
                    onChange={handleChange}
                    label="Actor"
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
              <ProductInput products={inputs} setProducts={setInputs} />
            </Grid>
            <Grid item>
              <Typography variant="h6" className={classes.heading}>
                Salidas
              </Typography>
              <ProductInput products={outputs} setProducts={setOutputs} weightAndVariety />
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

export default TransformView;
