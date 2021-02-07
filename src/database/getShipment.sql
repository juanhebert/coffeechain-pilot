select s.*, ae.name as sendername, ar.name as recipientname, sc.timestamp as confirmationtime
from shipment s
join actor ae
on ae.id = s.sender
join actor ar
on ar.id = s.recipient
left join shipment_confirmation sc
on sc.shipment = s.id
where s.id = $1;
