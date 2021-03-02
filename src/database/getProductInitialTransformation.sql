select t.*, a.name as emittername
from transformation t
join transformation_output t_out
on t_out.transformation = t.id
join actor a
on a.id = t.emitter
where t_out.product = $1;
