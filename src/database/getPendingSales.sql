select s.*, a.name as sellername
from sale s
join actor a
on a.id = s.seller
left join sale_confirmation sc
on sc.sale = s.id
where sc.sale is null
and buyer = $1;
