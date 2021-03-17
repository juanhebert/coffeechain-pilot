import React, { useState, useEffect } from 'react';
import { Link, useHistory } from 'react-router-dom';
import {
  AppBar,
  Avatar,
  Button,
  Container,
  FormControl,
  IconButton,
  Toolbar,
  List,
  Menu,
  MenuItem,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { brown } from '@material-ui/core/colors';
import axios from 'axios';

import { useLogin } from '../LoginContext';

import Logo from '../img/logo-lightmode.svg';

const navLinks = [
  { title: 'Inicio', path: '/' },
  { title: 'Transformar', path: '/transform' },
  { title: 'Vender', path: '/sell' },
  { title: 'Mandar', path: '/ship' },
  { title: 'Certificar', path: '/certify' },
  { title: 'Observar', path: '/observe' },
  { title: 'Eventos', path: '/events' },
  { title: 'Pendientes', path: '/pending' },
];

const useStyles = makeStyles(theme => ({
  navbarDisplayFlex: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0',
  },
  navDisplayFlex: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  linkText: {
    textDecoration: 'none',
    textTransform: 'uppercase',
    color: 'white',
    fontSize: '16px',
  },
  logo: {
    width: '35px',
    margin: 'auto 10px',
  },
  avatar: {
    color: theme.palette.getContrastText(brown[800]),
    backgroundColor: brown[800],
  },
  pageButton: {
    margin: 'auto 10px',
  },
}));

const Navbar = () => {
  const classes = useStyles();
  const [actorList, setActorList] = useState([]);
  const [, setLogin] = useLogin();
  const [selectedActorIndex, setSelectedActorIndex] = useState(0);
  const [anchorElement, setAnchorElement] = useState(null);
  const [pageMenuAnchorElement, setPageMenuAnchorElement] = useState(null);
  const history = useHistory();

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
    history.push('/');
  };

  const handlePagesMenuClick = event => setPageMenuAnchorElement(event.currentTarget);
  const handlePagesMenuChange = path => () => {
    setPageMenuAnchorElement(null);
    history.push(path);
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
            <FormControl>
              <Button
                className={classes.pageButton}
                aria-controls="simple-menu"
                aria-haspopup="true"
                onClick={handlePagesMenuClick}
                variant="contained"
                color="secondary"
              >
                <span className={classes.linkText}>Menú</span>
              </Button>
              <Menu
                anchorEl={pageMenuAnchorElement}
                id="simple-menu"
                keepMounted
                open={!!pageMenuAnchorElement}
                onClose={() => setPageMenuAnchorElement(null)}
              >
                {navLinks.map(({ title, path }) => (
                  <MenuItem onClick={handlePagesMenuChange(path)} key={path}>
                    {title}
                  </MenuItem>
                ))}
              </Menu>
            </FormControl>
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
