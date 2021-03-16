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

import { useLogin } from '../LoginContext';
import ProductInput from '../components/ProductInput';

const useStyles = makeStyles(theme => ({
  main: {
    marginTop: '12px 0',
    maxWidth: '100%',
  },
  paper: {
    maxWidth: 310,
    padding: theme.spacing(4),
  },
  heading: {
    marginBottom: 25,
  },
  dropdown: {
    width: 250,
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

const ShipView = () => {
  const classes = useStyles();

  const [actorList, setActorList] = useState([]);
  const [recipientIndex, setRecipientIndex] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputs, setInputs] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [login] = useLogin();
  const [partial, setPartial] = useState(false);

  const { id: sender } = login;

  const handleRecipientChange = event => {
    const index = event.target.value;
    setRecipientIndex(index);
  };

  const onSubmit = () => {
    setShowError(false);
    setShowSuccess(false);
    const { id: recipient } = actorList[recipientIndex];
    const timestamp = selectedDate.toISOString();

    axios
      .post('/api/ship', { sender, recipient, timestamp, inputs })
      .then(() => {
        setSelectedDate(new Date());
        setInputs([]);
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
            Envío realizado exitosamente.
          </Alert>
        </Collapse>
      </Grid>
      <Grid item>
        <Paper className={classes.paper}>
          <Grid container direction="column" spacing={5}>
            <Grid item>
              <Typography variant="h5" className={classes.heading}>
                Registrar envío
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
                  <InputLabel id="recipient-select-label">Destinatario</InputLabel>
                  <Select
                    label="Destinatario"
                    labelId="recipient-select-label"
                    id="recipient-select"
                    value={recipientIndex}
                    onChange={handleRecipientChange}
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
                Productos a enviar
              </Typography>
              <ProductInput products={inputs} setProducts={setInputs} setPartialField={setPartial} />
            </Grid>
            <Grid item>
              <Button disabled={partial || inputs.length === 0} variant="contained" color="primary" onClick={onSubmit}>
                Enviar
              </Button>
            </Grid>
          </Grid>
        </Paper>
      </Grid>
    </Grid>
  );
};

export default ShipView;
