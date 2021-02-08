select s.*, a.name as sendername
from shipment s
join actor a
on a.id = s.sender
left join shipment_confirmation sc
on sc.shipment = s.id
where sc.shipment is null
and s.recipient = $1;
