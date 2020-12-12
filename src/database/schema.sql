-- CLEANUP

drop table if exists
    actor,
    product,
    transformation,
    transformation_input,
    transformation_output,
    shipment,
    shipment_input,
    shipment_output,
    sale,
    sale_input,
    sale_output,
    certificate,
    practice,
    attachment
cascade;

create table actor(
    id text primary key,
    name text not null,
    location text not null,
    picture text not null,
    type text not null
);

create table product(
    id text primary key,
    weight integer not null,
    type text not null, -- one of CHERRIES, WET_PARCHMENT, DRY_PARCHMENT, GREEN, ROASTED, WEIGHT LOSS
    variety text -- Only set for "original" products, one of CATURRA, CENICAFE, CASTILLO, etc.
);

create table transformation(
    id text primary key,
    emitter text not null references actor(id),
    timestamp text not null
);

create table transformation_input(
    transformation text not null references transformation(id),
    product text not null references product(id)
);

create table transformation_output(
    transformation text not null references transformation(id),
    product text not null references product(id)
);

create table shipment(
    id text primary key,
    sender text not null references actor(id),
    recipient text not null references actor(id),
    timestamp text not null
);

create table shipment_input(
    shipment text not null references shipment(id),
    product text not null references product(id)
);

create table shipment_output(
    shipment text not null references shipment(id),
    product text not null references product(id)
);

create table sale(
    id text primary key,
    seller text not null references actor(id),
    buyer text not null references actor(id),
    price integer not null,
    currency text not null,
    timestamp text not null
);

create table sale_input(
    sale text not null references sale(id),
    product text not null references product(id)
);

create table sale_output(
    sale text not null references sale(id),
    product text not null references product(id)
);

create table certificate(
    emitter text not null references actor(id),
    receiver text not null references actor(id),
    type text not null, -- one of UTZ, FAIRTRADE
    beginning text not null,
    expiration text not null
);

create table practice(
    emitter text not null references actor(id),
    receiver text not null references actor(id),
    type text not null, -- TBD
    timestamp text not null
);

create table attachment(
    id text primary key,
    event text not null, -- references either transformation, sale, shipment, certificate or practice
    event_type text not null, -- type of event reference
    type text not null, -- one of FILE, TEXT
    content text not null, -- either raw text if TEXT, or filename if FILE
    emitter text not null references actor(id)
);
