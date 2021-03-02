select p.*, a.id as emitter, a.name as emittername, t.timestamp
from product p
join transformation_output t_out
on t_out.product = p.id
join transformation t
on t.id = t_out.transformation
join actor a
on a.id = t.emitter
where p.id = $1;
