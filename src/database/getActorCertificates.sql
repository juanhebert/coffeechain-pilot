select c.*, a.name as emitter_name
from certificate c
join actor a
on a.id = c.emitter
where c.receiver = $1
and $2 between c.beginning and c.expiration;
