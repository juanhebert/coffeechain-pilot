import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Button,
  Container,
  FormControl,
  IconButton,
  Toolbar,
  List,
  ListItem,
  ListItemText,
  Menu,
  MenuItem,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { brown } from '@material-ui/core/colors';
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

const useStyles = makeStyles(theme => ({
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
  avatar: {
    color: theme.palette.getContrastText(brown[800]),
    backgroundColor: brown[800],
  },
}));

const Navbar = () => {
  const classes = useStyles();
  const [actorList, setActorList] = useState([]);
  const [, setLogin] = useLogin();
  const [selectedActorIndex, setSelectedActorIndex] = useState(0);
  const [anchorElement, setAnchorElement] = useState(null);

  useEffect(async () => {
    const { data } = await axios.get('/api/actor');
    const { actors } = data;
    setActorList(actors);
    setLogin(actors[0]);
  }, []);

  const handleChange = index => () => {
    setSelectedActorIndex(index);
    setLogin(actorList[index]);
    setAnchorElement(null);
  };

  const handleClick = event => setAnchorElement(event.currentTarget);

  if (actorList.length === 0) return null;

  return (
    <AppBar position="static">
      <Toolbar>
        <Container className={classes.navbarDisplayFlex}>
          <Link to="/">
            <IconButton edge="start" color="inherit" aria-label="home">
              <img src={Logo} alt="logo" className={classes.logo} />
            </IconButton>
          </Link>
          <List component="nav" aria-labelledby="main navigation" className={classes.navDisplayFlex}>
            {navLinks.map(({ title, path }) => (
              <Link to={path} key={title} className={classes.linkText}>
                <ListItem button>
                  <ListItemText primary={title} />
                </ListItem>
              </Link>
            ))}
            <FormControl>
              <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
                <Avatar variant="square" alt={actorList[selectedActorIndex].name} className={classes.avatar}>
                  {actorList[selectedActorIndex].name[0]}
                </Avatar>
              </Button>
              <Menu
                anchorEl={anchorElement}
                id="simple-menu"
                keepMounted
                open={!!anchorElement}
                onClose={() => setAnchorElement(null)}
              >
                {actorList.map(({ id, name: actorName }, index) => (
                  <MenuItem onClick={handleChange(index)} key={id}>
                    {actorName}
                  </MenuItem>
                ))}
              </Menu>
            </FormControl>
          </List>
        </Container>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;
