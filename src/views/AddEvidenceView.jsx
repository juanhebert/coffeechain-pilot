import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Collapse,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  TextField,
  Typography,
} from '@material-ui/core';
import { Alert } from '@material-ui/lab';
import { Close } from '@material-ui/icons';
import { MuiPickersUtilsProvider, DatePicker } from '@material-ui/pickers';
import { makeStyles } from '@material-ui/core/styles';
import DateFnsUtils from '@date-io/date-fns';
import esLocale from 'date-fns/locale/es';
import axios from 'axios';

import { useLogin } from '../LoginContext';

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
  textField: {
    minWidth: 300,
  },
  input: {
    display: 'none',
  },
}));

const formDataOpts = {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
};

const AddEvidenceView = () => {
  const classes = useStyles();

  const { eventId, eventType } = useParams();

  const [date, setDate] = useState(new Date());
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [isFile, setIsFile] = useState(false);
  const [file, setFile] = useState();
  const [errorMsg, setErrorMsg] = useState('');
  const [login] = useLogin();

  const { id: emitter } = login;

  const onChange = event => setFile(event.currentTarget.files[0]);

  const handleContentChange = event => setContent(event.target.value);

  const onSubmit = () => {
    setShowError(false);
    setShowSuccess(false);
    const timestamp = date.toISOString();

    const payload = new FormData();
    if (isFile) {
      payload.append('file', file);
    }
    payload.append('document', JSON.stringify({ emitter, eventId, eventType, timestamp, title, content }));
    axios
      .post(isFile ? '/api/fileAttachment' : '/api/textAttachment', payload, formDataOpts)
      .then(() => {
        setDate(new Date());
        setShowError(false);
        setShowSuccess(true);
        setFile(null);
        setTitle('');
        setContent('');
      })
      .catch(({ response }) => {
        const { error } = response.data;
        setErrorMsg(error);
        setShowSuccess(false);
        setShowError(true);
      });
  };

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
            Certificado registrado exitosamente.
          </Alert>
        </Collapse>
      </Grid>
      <Grid item>
        <Paper className={classes.paper}>
          <Grid container direction="column" spacing={5}>
            <Grid item>
              <Typography variant="h5" className={classes.heading}>
                Registrar evidencia
              </Typography>
            </Grid>
            <Grid item container direction="column" spacing={2}>
              <Grid item>
                <Typography variant="h6" className={classes.heading}>
                  Información básica
                </Typography>
              </Grid>
              <Grid item className={classes.fsAligned}>
                <MuiPickersUtilsProvider utils={DateFnsUtils} locale={esLocale}>
                  <DatePicker
                    format="d MMMM yyyy"
                    className={classes.dropdown}
                    variant="inline"
                    inputVariant="outlined"
                    label="Fecha"
                    value={date}
                    onChange={setDate}
                  />
                </MuiPickersUtilsProvider>
              </Grid>
              <Grid item className={classes.fsAligned}>
                <TextField
                  variant="outlined"
                  label="Título"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                />
              </Grid>
              <Grid item className={classes.fsAligned}>
                <FormControl className={classes.formControl}>
                  <FormControlLabel
                    control={<Checkbox checked={isFile} onChange={() => setIsFile(x => !x)} name="isDocument" />}
                    label="Este adjunto es un archivo"
                  />
                </FormControl>
              </Grid>
              <Grid item className={classes.fsAligned}>
                <TextField
                  label={isFile ? 'Descripción' : 'Contenido'}
                  id="attachmentText"
                  variant="outlined"
                  multiline
                  rows={7}
                  className={classes.textField}
                  value={content}
                  onChange={handleContentChange}
                />
              </Grid>
              {isFile && (
                <Grid item className={classes.fsAligned}>
                  <FormControl className={classes.formControl}>
                    <label className={classes.label} htmlFor="upload-file-btn">
                      <Button variant="contained" component="span" color="secondary" className={classes.button}>
                        Seleccionar archivo
                      </Button>
                      <input id="upload-file-btn" className={classes.input} type="file" onChange={onChange} />
                    </label>
                    {file && <span>Seleccionado: {file.name}</span>}
                  </FormControl>
                </Grid>
              )}
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

export default AddEvidenceView;
