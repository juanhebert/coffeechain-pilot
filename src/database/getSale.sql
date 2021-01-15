select s.*, ae.name as sellername, ar.name as buyername
from sale s
join actor ae
on ae.id = s.seller
join actor ar
on ar.id = s.buyer
where s.id = $1;
