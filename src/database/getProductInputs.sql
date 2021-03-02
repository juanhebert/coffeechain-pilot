select
    p_in.id,
    (p_in.weight::float * $2) / t_sum.weight as fraction,
    p_in.type,
    p_in.variety,
    a.name as emittername,
    t.emitter,
    t.timestamp
from product p_in
join transformation_input t_in
on t_in.product = p_in.id
join transformation_output t_out
on t_out.transformation = t_in.transformation
join product p_out
on p_out.id = t_out.product
join (
	select sub_ti.transformation as id, sum(sub_p.weight) as weight
    from product sub_p
    join transformation_input sub_ti
    on sub_ti.product = sub_p.id
    group by sub_ti.transformation
) t_sum
on t_sum.id = t_in.transformation
join transformation_output p_t
on p_t.product = p_in.id
join transformation t
on t.id = p_t.transformation
join actor a
on a.id = t.emitter
where p_out.id = $1;
