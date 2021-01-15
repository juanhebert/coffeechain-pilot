select p.*, ae.name as emittername, ar.name as receivername
from practice p
join actor ae
on ae.id = p.emitter
join actor ar
on ar.id = p.receiver
where p.id = $1;
