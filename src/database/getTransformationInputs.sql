select p.*
from transformation_input ti
join product p
on p.id = ti.product
where ti.transformation = $1;
