import React, { useState } from 'react';
import {
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Modal,
  Paper,
  Select,
  TextField,
  Button,
  ButtonGroup,
  List,
  ListItem,
  ListItemText,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import QrReader from 'react-qr-reader';
import ClearIcon from '@material-ui/icons/Clear';

const useStyles = makeStyles(theme => ({
  deleteButton: {
    height: 25,
    width: 25,
    minWidth: 25,
    marginLeft: 12,
  },
  input: {
    width: 250,
  },
  list: {
    width: 250,
  },
  modalPaper: {
    padding: theme.spacing(2),
    width: 450,
    margin: '100px auto',
    whiteSpace: 'pre-wrap',
  },
}));

const types = [
  { id: 'WET_PARCHMENT', name: 'P. húmedo' },
  { id: 'DRY_PARCHMENT', name: 'P. seco' },
  { id: 'GREEN', name: 'Verde' },
  { id: 'ROASTED', name: 'Tostado' },
];

const varieties = [
  { id: null, name: 'Por defecto' },
  { id: 'BORBON', name: 'Borbón' },
  { id: 'CASTILLO', name: 'Castillo' },
  { id: 'CATURRA', name: 'Caturra' },
  { id: 'CENICAFE', name: 'Cenicafé uno' },
  { id: 'MARAGOGIPE', name: 'Maragogipe' },
  { id: 'TABI', name: 'Tabí' },
  { id: 'TIPICA', name: 'Típica' },
];

const strings = {
  WET_PARCHMENT: 'P. húmedo',
  DRY_PARCHMENT: 'P. seco',
  GREEN: 'Café verde',
  ROASTED: 'Café tostado',
  WEIGHT_LOSS: 'Pérdidas',
  CENICAFE: 'Cenicafé uno',
  CASTILLO: 'Castillo',
  CATURRA: 'Caturra',
  TIPICA: 'Típica',
  TABI: 'Tabí',
  BORBON: 'Borbón',
  MARAGOGIPE: 'Maragogipe',
  DOSMIL: 'Variedad 2000',
  CATIMORO: 'Catimoro',
};

const ProductInput = ({ products, setProducts, setPartialField = () => {}, weightAndVariety = false }) => {
  const classes = useStyles();

  const [currentProduct, setCurrentProduct] = useState('');
  const [currentWeight, setCurrentWeight] = useState('0');
  const [varietyIndex, setVarietyIndex] = useState(0);
  const [typeIndex, setTypeIndex] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const handleAdd = () => {
    setProducts(prev => [
      ...prev,
      {
        productId: currentProduct,
        type: weightAndVariety ? types[typeIndex].id : null,
        variety: weightAndVariety ? varieties[varietyIndex].id : null,
        weight: weightAndVariety ? Math.trunc(parseFloat(currentWeight) * 1000) : null,
      },
    ]);
    setCurrentProduct('');
    setCurrentWeight('0');
    setVarietyIndex(0);
    setTypeIndex(0);
    setPartialField(false);
  };

  const handleScan = data => {
    if (data) {
      setModalOpen(false);
      setCurrentProduct(data);
    }
  };

  const handleRemove = productIndex => () => setProducts(prev => prev.filter((elem, index) => index !== productIndex));

  const handleKeyPress = event => {
    if (event.key === 'Enter') {
      handleAdd();
    }
  };

  const handleVarietyChange = event => {
    const index = event.target.value;
    setVarietyIndex(index);
  };

  const handleTypeChange = event => {
    const index = event.target.value;
    setTypeIndex(index);
  };

  const handleProductChange = event => {
    const data = event.target.value;
    setPartialField(data.length > 0);
    setCurrentProduct(data);
  };

  return (
    <Grid container className={classes.main} direction="column" spacing={1}>
      <Grid container item justify="center">
        <List className={classes.list}>
          {products.map(({ productId, variety, weight, type }, index) => (
            <ListItem divider>
              <ListItemText
                primary={
                  weightAndVariety
                    ? `${productId}: ${weight / 1000} kg (${strings[type]}, ${strings[variety] || 'var. n/a'})`
                    : productId
                }
              />
              <Button onClick={handleRemove(index)} className={classes.deleteButton}>
                <ClearIcon />
              </Button>
            </ListItem>
          ))}
        </List>
      </Grid>
      <Grid container item spacing={1} justify="flex-start" direction="column">
        <Grid item>
          <TextField
            variant="outlined"
            label="ID del producto"
            className={classes.input}
            value={currentProduct}
            onChange={handleProductChange}
            onKeyPress={handleKeyPress}
          />
        </Grid>
        {weightAndVariety && (
          <>
            <Grid item>
              <FormControl className={classes.input} variant="outlined">
                <InputLabel id="type-select-label">Tipo</InputLabel>
                <Select
                  label="Tipo"
                  labelId="type-select-label"
                  id="type-select"
                  value={typeIndex}
                  onChange={handleTypeChange}
                  className={classes.input}
                >
                  {types.map(({ id, name: typeName }, index) => (
                    <MenuItem value={index} key={id}>
                      {typeName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <FormControl className={classes.input} variant="outlined">
                <InputLabel id="variety-select-label">Variedad</InputLabel>
                <Select
                  label="Variedad"
                  labelId="variety-select-label"
                  id="variety-select"
                  value={varietyIndex}
                  onChange={handleVarietyChange}
                  className={classes.input}
                >
                  {varieties.map(({ id, name: varietyName }, index) => (
                    <MenuItem value={index} key={id}>
                      {varietyName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item>
              <TextField
                variant="outlined"
                label="Peso (kg)"
                value={currentWeight}
                className={classes.input}
                onChange={event => setCurrentWeight(event.target.value)}
                onKeyPress={handleKeyPress}
              />
            </Grid>
          </>
        )}
        <Grid item container justify="center">
          <Grid item>
            <ButtonGroup color="secondary" variant="contained" aria-label="outlined primary button group">
              <Button onClick={handleAdd}>Añadir</Button>
              <Button onClick={() => setModalOpen(true)}>Escanéar QR</Button>
            </ButtonGroup>
          </Grid>
        </Grid>
      </Grid>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <Paper className={classes.modalPaper}>
          <QrReader delay={300} onScan={handleScan} style={{ width: '100%' }} />
        </Paper>
      </Modal>
    </Grid>
  );
};

export default ProductInput;
