import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Container, IconButton, Toolbar, List, ListItem, ListItemText } from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';

import Logo from '../img/logo-lightmode.svg';

const navLinks = [
  { title: 'actores', path: '/' },
  { title: 'transformar', path: '/transform' },
  { title: 'vender', path: '/sell' },
  { title: 'mandar', path: '/sent' },
  { title: 'certificar', path: '/certificate' },
  { title: 'observar', path: '/practice' },
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
          </List>
        </Container>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
