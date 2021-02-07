select s.*, ae.name as sellername, ar.name as buyername, sc.timestamp as confirmationtime
from sale s
join actor ae
on ae.id = s.seller
join actor ar
on ar.id = s.buyer
left join sale_confirmation sc
on sc.sale = s.id
where s.id = $1;
