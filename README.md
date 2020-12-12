# Coffeechain

## Setting up PostgreSQL

Once you've installed PostgreSQL and enabled the `postgresql` service (using
Homebrew for example), run `psql postgres` to launch the PostgreSQL REPL. Once
in `psql`, run the following commands:

```
> CREATE ROLE coffeechain WITH LOGIN PASSWORD 'coffeechain-local';
> ALTER ROLE coffeechain CREATEDB;
> \q
```

You're now out of `psql`. Enter the REPL again but this time using the user you
just created by running `psql -d postgres -U coffeechain`. Then, run the
following commands:

```
> CREATE DATABASE coffeechain;
> \q
```

## Running the project

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.<br /> Open
[http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.<br /> You will also see any lint errors
in the console.
