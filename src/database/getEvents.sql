with events(id, emitter, timestamp, type) as (
    select id, emitter, timestamp, 'TRANSFORMATION' as type from transformation
    union
    select id, sender as emitter, timestamp, 'SHIPMENT' as type from shipment
    union
    select id, seller as emitter, timestamp, 'SALE' as type from sale
    union
    select id, emitter, beginning as timestamp, 'CERTIFICATE' as type from certificate
    union
    select id, emitter, timestamp, 'PRACTICE' as type from practice
)

select e.*, a.name as emitterName
from events e
join actor a
on a.id = e.emitter
order by e.timestamp desc;
