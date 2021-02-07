select s.*
from shipment s
left join shipment_confirmation sc
on sc.shipment = s.id
where sc.shipment is null
and s.recipient = $1;
