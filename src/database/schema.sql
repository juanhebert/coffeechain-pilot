-- CLEANUP

drop table if exists
    actor,
    product,
    transformation,
    transformation_input,
    transformation_output,
    shipment,
    shipment_confirmation,
    shipment_input,
    sale,
    sale_confirmation,
    sale_input,
    certificate,
    practice,
    attachment
cascade;

create table actor(
    id text primary key,
    name text not null,
    location text not null,
    type text not null,
    picture text,
    description text,
    info json
);

/*
The `info` field in the actor table takes different forms depending on the type of actor.
If the actor is a farmer, this is the expected schema:

{
    area, -> float, area of the farm in hectares
    elevation, -> integer, average elevation at the farm (MASL)
    name, -> string, name of the farm
}

For now, the `info` field is ignored for other actor types
*/

create table product(
    id text primary key,
    weight integer not null,
    type text not null, -- one of CHERRIES, WET_PARCHMENT, DRY_PARCHMENT, GREEN, ROASTED, WEIGHT_LOSS
    variety text -- Only set for "original" products, one of CATURRA, CENICAFE, CASTILLO, etc.
);

create table transformation(
    id text primary key,
    emitter text not null references actor(id),
    timestamp text not null,
    subtype text,
    info json
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
    timestamp text not null,
    info json
);

create table shipment_input(
    shipment text not null references shipment(id),
    product text not null references product(id)
);

create table shipment_confirmation(
    shipment text references shipment(id) primary key,
    timestamp text not null,
    info json
);

create table sale(
    id text primary key,
    seller text not null references actor(id),
    buyer text not null references actor(id),
    price integer not null,
    currency text not null,
    timestamp text not null,
    info json
);

create table sale_input(
    sale text not null references sale(id),
    product text not null references product(id),
    info json
);

create table sale_confirmation(
    sale text references sale(id) primary key,
    timestamp text not null,
    info json
);

create table certificate(
    id text primary key,
    emitter text not null references actor(id),
    receiver text not null references actor(id),
    type text not null, -- one of UTZ, FAIRTRADE
    beginning text not null,
    expiration text not null
);

create table practice(
    id text primary key,
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
    title text not null,
    description text, -- either attachment itself if TEXT, or description if FILE
    filename text, -- filename if FILE, otherwise NULL
    emitter text not null references actor(id),
    timestamp text not null
);
