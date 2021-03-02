select
    s.seller as recipient,
    a.name as recipientname,
    (sub.weight::float / sum(p_in.weight)) * s.price as amount,
    s.currency
from sale s
join sale_confirmation s_conf
on s_conf.sale = s.id
join sale_input s_in
on s_in.sale = s.id
join product p_in
on p_in.id = s_in.product
join (
 select p_sub.id as product, p_sub.weight as weight, si_sub.sale as sale
 from product p_sub
 join sale_input si_sub
 on si_sub.product = p_sub.id
) sub
on sub.sale = s.id
join actor a
on a.id = s.seller
group by s.timestamp, s.seller, s.price, s.currency, a.name, sub.product, sub.weight
having sub.product = $1
order by s.timestamp asc
limit 1;
