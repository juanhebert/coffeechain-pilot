import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Container,
  FormControl,
  IconButton,
  Select,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  MenuItem,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import axios from 'axios';

import { useLogin } from '../LoginContext';

import Logo from '../img/logo-lightmode.svg';

const navLinks = [
  { title: 'actores', path: '/' },
  { title: 'transformar', path: '/transform' },
  { title: 'vender', path: '/sell' },
  { title: 'mandar', path: '/ship' },
  { title: 'certificar', path: '/certify' },
  { title: 'observar', path: '/observe' },
  { title: 'eventos', path: '/events' },
  { title: 'pendientes', path: '/pending' },
];

const useStyles = makeStyles({
  navbarDisplayFlex: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  navDisplayFlex: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  linkText: {
    textDecoration: 'none',
    textTransform: 'uppercase',
    color: 'white',
  },
  logo: {
    width: '35px',
  },
});

const Navbar = () => {
  const classes = useStyles();
  const [actorList, setActorList] = useState([]);
  const [, setLogin] = useLogin();
  const [selectedActorIndex, setSelectedActorIndex] = useState(0);

  useEffect(async () => {
    const { data } = await axios.get('/api/actor');
    const { actors } = data;
    setActorList(actors);
    setLogin(actors[0]);
  }, []);

  const handleChange = event => {
    const index = event.target.value;
    setSelectedActorIndex(index);
    setLogin(actorList[index]);
  };

  if (actorList.length === 0) return null;

  return (
    <AppBar position="static">
      <Toolbar>
        <Container className={classes.navbarDisplayFlex}>
          <IconButton edge="start" color="inherit" aria-label="home">
            <img src={Logo} alt="logo" className={classes.logo} />
          </IconButton>
          <List component="nav" aria-labelledby="main navigation" className={classes.navDisplayFlex}>
            {navLinks.map(({ title, path }) => (
              <Link to={path} key={title} className={classes.linkText}>
                <ListItem button>
                  <ListItemText primary={title} />
                </ListItem>
              </Link>
            ))}
            <FormControl>
              <Select
                labelId="demo-simple-select-label"
                id="demo-simple-select"
                value={selectedActorIndex}
                onChange={handleChange}
                className={classes.dropdown}
              >
                {actorList.map(({ id, name: actorName }, index) => (
                  <MenuItem value={index} key={id}>
                    {actorName}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </List>
        </Container>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
