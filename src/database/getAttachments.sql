select *
from attachment
where id = $1 and event_type = $2;
