select p.*
from product p
join transformation_output t_out
on t_out.product = p.id
join transformation t
on t.id = t_out.transformation
left join shipment_input si
on si.product = p.id
left join transformation_input ti
on ti.product = p.id
where si.shipment is null and ti.transformation is null
and t.emitter = $1
and p.type != 'WEIGHT_LOSS'

union

select p.*
from product p
join shipment_input si
on si.product = p.id
join shipment s
on s.id = si.shipment and s.recipient = $1
left join
    (select si_sub.product, s_sub.timestamp
    from shipment s_sub
    join shipment_input si_sub
    on s_sub.id = si_sub.shipment) s_out
on s_out.product = p.id and s_out.timestamp > s.timestamp
left join transformation_input ti
on ti.product = p.id
where s_out.timestamp is null and ti.transformation is null
and p.type != 'WEIGHT_LOSS';
