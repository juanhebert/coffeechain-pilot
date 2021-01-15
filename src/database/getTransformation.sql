select t.*, a.name as emittername
from transformation t
join actor a
on a.id = t.emitter
where t.id = $1;
