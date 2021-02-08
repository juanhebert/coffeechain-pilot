select a.*, e.name as emittername
from attachment a
join actor e
on e.id = a.emitter
where event = $1 and event_type = $2;
