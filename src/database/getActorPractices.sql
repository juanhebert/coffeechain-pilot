select p.*, a.name as emitterName
from practice p
join actor a
on a.id = p.emitter
where p.receiver = $1;
