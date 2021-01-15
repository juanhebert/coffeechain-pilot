select c.*, ae.name as emittername, ar.name as receivername
from certificate c
join actor ae
on ae.id = c.emitter
join actor ar
on ar.id = c.receiver
where c.id = $1;
