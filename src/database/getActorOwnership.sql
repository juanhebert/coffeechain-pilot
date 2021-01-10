select p.*
from product p
join transformation_output t_out
on t_out.product = p.id
join transformation t
on t.id = t_out.transformation
left join sale_input si
on si.product = p.id
left join transformation_input ti
on ti.product = p.id
where si.sale is null and ti.transformation is null
and t.emitter = $1
and p.type != 'WEIGHT_LOSS'

union

select p.*
from product p
join sale_input si
on si.product = p.id
join sale s
on s.id = si.sale and s.buyer = $1
left join
    (select si_sub.product, s_sub.timestamp
    from sale s_sub
    join sale_input si_sub
    on s_sub.id = si_sub.sale) s_out
on s_out.product = p.id and s_out.timestamp > s.timestamp
left join transformation_input ti
on ti.product = p.id
where s_out.timestamp is null and ti.transformation is null
and p.type != 'WEIGHT_LOSS';
