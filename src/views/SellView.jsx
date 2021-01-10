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

  const [actorList, setActorList] = useState([]);
  const [sellerIndex, setSellerIndex] = useState(0);
  const [buyerIndex, setBuyerIndex] = useState(0);
  const [currencyIndex, setCurrencyIndex] = useState(0);
  const [price, setPrice] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [inputs, setInputs] = useState([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSellerChange = event => {
    const index = event.target.value;
    setSellerIndex(index);
  };

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
    const { id: seller } = actorList[sellerIndex];
    const { id: buyer } = actorList[buyerIndex];
    const { id: currency } = currencies[currencyIndex];
    const priceInCents = Math.trunc(parseFloat(price) * 100);
    const timestamp = selectedDate.toISOString();

    axios
      .post('/api/sell', { seller, buyer, timestamp, inputs, price: priceInCents, currency })
      .then(() => {
        setSellerIndex(0);
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
      <Grid item>
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
              <Grid item className={classes.fsAligned}>
                <FormControl variant="outlined" className={classes.dropdown}>
                  <InputLabel id="seller-select-label">Vendedor</InputLabel>
                  <Select
                    label="Vendedor"
                    labelId="seller-select-label"
                    id="seller-select"
                    value={sellerIndex}
                    onChange={handleSellerChange}
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
                  <InputLabel id="buyer-select-label">Comprador</InputLabel>
                  <Select
                    label="Comprador"
                    labelId="buyer-select-label"
                    id="buyer-select"
                    value={buyerIndex}
                    onChange={handleBuyerChange}
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
              <Grid item className={classes.fsAligned}>
                <TextField
                  variant="outlined"
                  label="Precio"
                  value={price}
                  onChange={event => setPrice(event.target.value)}
                />
              </Grid>
              <Grid item className={classes.fsAligned}>
                <FormControl variant="outlined" className={classes.dropdown}>
                  <InputLabel id="currency-select-label">Divisa</InputLabel>
                  <Select
                    label="Divisa"
                    labelId="currency-select-label"
                    id="currency-select"
                    value={currencyIndex}
                    onChange={handleCurrencyChange}
                    className={classes.dropdown}
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
              <ProductInput products={inputs} setProducts={setInputs} />
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

export default SellView;
