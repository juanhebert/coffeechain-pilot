select *
from attachment
where event = $1 and event_type = $2;
