select p.*
from transformation_output t_out
join product p
on p.id = t_out.product
where t_out.transformation = $1;
