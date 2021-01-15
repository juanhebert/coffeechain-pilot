select p.*
from shipment_input si
join product p
on p.id = si.product
where si.shipment = $1;
