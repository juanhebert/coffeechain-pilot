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
  TextField,
  Typography,
} from '@material-ui/core';
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
  field: {
    width: 250,
  },
  fieldDesktop: {
    width: 350,
  },
  section: {
    width: 320,
  },
  sectionDesktop: {
    width: 600,
  },
}));

const currencies = [
  { id: 'COP', name: 'Peso colombiano (COP)' },
  { id: 'USD', name: 'Dólar estadounidense (USD)' },
  { id: 'EUR', name: 'Euro (EUR)' },
  { id: 'DKK', name: 'Corona danesa (DKK)' },
  { id: 'SEK', name: 'Corona sueca (SEK)' },
  { id: 'NOK', name: 'Corona noruega (NOK)' },
];

const SellView = () => {
  const classes = useStyles();

  const geqDesktopBreakpoint = useMediaQuery('(min-width: 600px)');
  const sectionClassName = geqDesktopBreakpoint ? classes.sectionDesktop : classes.section;
  const fieldClassName = geqDesktopBreakpoint ? classes.fieldDesktop : classes.field;

  const [actorList, setActorList] = useState([]);
  const [buyerIndex, setBuyerIndex] = useState(0);
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const [price, setPrice] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputs, setInputs] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [login] = useLogin();
  const [partial, setPartial] = useState(false);

  const { id: seller } = login;

  const handleBuyerChange = event => {
    const index = event.target.value;
    setBuyerIndex(index);
  };

  const handleCurrencyChange = event => {
    const index = event.target.value;
    setCurrencyIndex(index);
  };

  const onSubmit = () => {
    setShowError(false);
    setShowSuccess(false);
    const { id: buyer } = actorList[buyerIndex];
    const { id: currency } = currencies[currencyIndex];
    const priceInCents = Math.trunc(parseFloat(price) * 100);
    const timestamp = selectedDate.toISOString();

    axios
      .post('/api/sell', { seller, buyer, timestamp, inputs, price: priceInCents, currency })
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
            Compra realizada exitosamente.
          </Alert>
        </Collapse>
      </Grid>
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Grid container direction="column" spacing={5}>
            <Grid item>
              <Typography variant="h5" className={classes.heading}>
                Registrar compra/venta
              </Typography>
            </Grid>
            <Grid item container direction="column" spacing={2}>
              <Grid item>
                <Typography variant="h6" className={classes.heading}>
                  Información básica
                </Typography>
              </Grid>
              <Grid item>
                <FormControl variant="outlined" className={fieldClassName}>
                  <InputLabel id="buyer-select-label">Comprador</InputLabel>
                  <Select
                    label="Comprador"
                    labelId="buyer-select-label"
                    id="buyer-select"
                    value={buyerIndex}
                    onChange={handleBuyerChange}
                  >
                    {actorList.map(({ id, name: actorName }, index) => (
                      <MenuItem value={index} key={id}>
                        {actorName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
              <Grid item>
                <TextField
                  variant="outlined"
                  label="Precio"
                  value={price}
                  className={fieldClassName}
                  onChange={event => setPrice(event.target.value)}
                />
              </Grid>
              <Grid item>
                <FormControl variant="outlined" className={fieldClassName}>
                  <InputLabel id="currency-select-label">Divisa</InputLabel>
                  <Select
                    label="Divisa"
                    labelId="currency-select-label"
                    id="currency-select"
                    value={currencyIndex}
                    onChange={handleCurrencyChange}
                  >
                    {currencies.map(({ id, name: currencyName }, index) => (
                      <MenuItem value={index} key={id}>
                        {currencyName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
            <Grid item>
              <Typography variant="h6" className={classes.heading}>
                Productos a vender
              </Typography>
              <ProductInput
                inputClassName={fieldClassName}
                products={inputs}
                setProducts={setInputs}
                setPartialField={setPartial}
              />
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

export default SellView;
