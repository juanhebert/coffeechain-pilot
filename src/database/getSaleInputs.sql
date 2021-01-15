select p.*
from sale_input si
join product p
on p.id = si.product
where si.sale = $1;
