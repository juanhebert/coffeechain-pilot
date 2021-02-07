select s.*
from sale s
left join sale_confirmation sc
on sc.sale = s.id
where sc.sale is null
and buyer = $1;
