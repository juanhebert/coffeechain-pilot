import React, { useState } from 'react';
import { FormControl, Grid, IconButton, InputLabel, MenuItem, Select, TextField } from '@material-ui/core';
import { AddCircle, CropFree, Delete } from '@material-ui/icons';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = makeStyles(() => ({
  dropdown: {
    width: '100%',
  },
}));

const types = [
  { id: 'WET_PARCHMENT', name: 'Pergamino húmedo' },
  { id: 'DRY_PARCHMENT', name: 'Pergamino seco' },
  { id: 'GREEN', name: 'Café verde' },
  { id: 'ROASTED', name: 'Café tostado' },
  { id: 'WEIGHT_LOSS', name: 'Pérdidas' },
];

const varieties = [
  { id: null, name: 'n/a' },
  { id: 'BORBON', name: 'Borbón' },
  { id: 'CASTILLO', name: 'Castillo' },
  { id: 'CATURRA', name: 'Caturra' },
  { id: 'CENICAFE', name: 'Cenicafé uno' },
  { id: 'MARAGOGIPE', name: 'Maragogipe' },
  { id: 'TABI', name: 'Tabí' },
  { id: 'TIPICA', name: 'Típica' },
];

const strings = {
  WET_PARCHMENT: 'Pergamino húmedo',
  DRY_PARCHMENT: 'Pergamino seco',
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
};

const ProductInput = ({ products, setProducts, weightAndVariety = false }) => {
  const classes = useStyles();

  const [currentProduct, setCurrentProduct] = useState('');
  const [currentWeight, setCurrentWeight] = useState('0');
  const [varietyIndex, setVarietyIndex] = useState(0);
  const [typeIndex, setTypeIndex] = useState(0);

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

  return (
    <Grid container className={classes.main} direction="column" spacing={1}>
      {products.map(({ productId, variety, weight, type }, index) => (
        <Grid container item key={productId} spacing={1} justify="flex-start">
          <Grid item xs={4}>
            <TextField
              value={productId}
              variant="outlined"
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          {weightAndVariety ? (
            <>
              <Grid item xs={2}>
                <TextField
                  value={strings[type]}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={variety ? strings[variety] : 'n/a'}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
              <Grid item xs={2}>
                <TextField
                  value={weight / 1000}
                  variant="outlined"
                  InputProps={{
                    readOnly: true,
                  }}
                />
              </Grid>
            </>
          ) : (
            <Grid item xs={6} />
          )}
          <Grid item xs={1}>
            <IconButton onClick={handleRemove(index)}>
              <Delete />
            </IconButton>
          </Grid>
          <Grid item xs={1} />
        </Grid>
      ))}
      <Grid container item spacing={1} justify="flex-start">
        <Grid item xs={4}>
          <TextField
            variant="outlined"
            label="ID del producto"
            value={currentProduct}
            onChange={event => setCurrentProduct(event.target.value)}
            onKeyPress={handleKeyPress}
          />
        </Grid>
        {weightAndVariety ? (
          <>
            <Grid item xs={2}>
              <FormControl className={classes.dropdown} variant="outlined">
                <InputLabel id="type-select-label">Tipo</InputLabel>
                <Select
                  label="Tipo"
                  labelId="type-select-label"
                  id="type-select"
                  value={typeIndex}
                  onChange={handleTypeChange}
                  className={classes.dropdown}
                >
                  {types.map(({ id, name: typeName }, index) => (
                    <MenuItem value={index} key={id}>
                      {typeName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <FormControl className={classes.dropdown} variant="outlined">
                <InputLabel id="variety-select-label">Variedad</InputLabel>
                <Select
                  label="Variedad"
                  labelId="variety-select-label"
                  id="variety-select"
                  value={varietyIndex}
                  onChange={handleVarietyChange}
                  className={classes.dropdown}
                >
                  {varieties.map(({ id, name: varietyName }, index) => (
                    <MenuItem value={index} key={id}>
                      {varietyName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={2}>
              <TextField
                variant="outlined"
                label="Peso (kg)"
                value={currentWeight}
                onChange={event => setCurrentWeight(event.target.value)}
                onKeyPress={handleKeyPress}
              />
            </Grid>
          </>
        ) : (
          <Grid item xs={6} />
        )}
        <Grid item xs={1}>
          <IconButton onClick={handleAdd}>
            <AddCircle />
          </IconButton>
        </Grid>
        <Grid item xs={1}>
          <IconButton>
            <CropFree />
          </IconButton>
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProductInput;
