select s.*, ae.name as sendername, ar.name as recipientname
from shipment s
join actor ae
on ae.id = s.sender
join actor ar
on ar.id = s.recipient
where s.id = $1;
