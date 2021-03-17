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
import useMediaQuery from '@material-ui/core/useMediaQuery';

import { useLogin } from '../LoginContext';

const useStyles = makeStyles(theme => ({
  main: {
    margin: '12px 0',
    maxWidth: '100%',
  },
  section: {
    width: 320,
  },
  sectionDesktop: {
    width: 600,
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

  const geqDesktopBreakpoint = useMediaQuery('(min-width: 600px)');
  const sectionClassName = geqDesktopBreakpoint ? classes.sectionDesktop : classes.section;
  const fieldClassName = geqDesktopBreakpoint ? classes.fieldDesktop : classes.field;

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
      <Grid item className={sectionClassName}>
        <Paper className={classes.paper}>
          <Grid container direction="column" alignItems="center" spacing={5}>
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
              <Grid item>
                <MuiPickersUtilsProvider utils={DateFnsUtils} locale={esLocale}>
                  <DatePicker
                    format="d MMMM yyyy"
                    variant="inline"
                    inputVariant="outlined"
                    label="Fecha"
                    value={date}
                    onChange={setDate}
                    className={fieldClassName}
                  />
                </MuiPickersUtilsProvider>
              </Grid>
              <Grid item>
                <TextField
                  variant="outlined"
                  label="Título"
                  value={title}
                  onChange={event => setTitle(event.target.value)}
                  className={fieldClassName}
                />
              </Grid>
              <Grid item>
                <TextField
                  label={isFile ? 'Descripción' : 'Contenido'}
                  id="attachmentText"
                  variant="outlined"
                  multiline
                  rows={7}
                  value={content}
                  onChange={handleContentChange}
                  className={fieldClassName}
                />
              </Grid>
              <Grid item>
                <FormControl>
                  <FormControlLabel
                    control={<Checkbox checked={isFile} onChange={() => setIsFile(x => !x)} name="isDocument" />}
                    label="Este adjunto es un archivo"
                    className={fieldClassName}
                  />
                </FormControl>
              </Grid>
              {isFile && (
                <Grid item>
                  <FormControl className={fieldClassName}>
                    <label htmlFor="upload-file-btn">
                      <Button variant="contained" component="span" color="secondary">
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
