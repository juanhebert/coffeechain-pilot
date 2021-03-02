import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableRow } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { Link } from 'react-router-dom';

const useStyles = makeStyles(() => ({
  table: {
    minWidth: 0, // TODO
  },
  tableHeadCell: {
    fontWeight: 700,
  },
}));

const getString = id => {
  if (!id) {
    return 'N/A';
  }

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

  return strings[id];
};

const InventoryTable = ({ inventory, displayFarmer = false }) => {
  const classes = useStyles();

  return (
    <Table className={classes.table} aria-label="simple table">
      <TableHead>
        <TableRow>
          <TableCell className={classes.tableHeadCell}>ID del producto</TableCell>
          <TableCell className={classes.tableHeadCell}>Tipo</TableCell>
          <TableCell className={classes.tableHeadCell}>Peso&nbsp;(kg)</TableCell>
          <TableCell className={classes.tableHeadCell}>Variedad</TableCell>
          {displayFarmer && <TableCell className={classes.tableHeadCell}>Productor</TableCell>}
        </TableRow>
      </TableHead>
      <TableBody>
        {inventory.map(({ id, type, weight, variety, emittername }) => (
          <TableRow key={id}>
            <TableCell component="th" scope="row">
              <Link to={`/product/${id}`}>{id}</Link>
            </TableCell>
            <TableCell>{getString(type)}</TableCell>
            <TableCell>{weight / 1000}</TableCell>
            <TableCell>{getString(variety)}</TableCell>
            {displayFarmer && <TableCell>{emittername}</TableCell>}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default InventoryTable;
