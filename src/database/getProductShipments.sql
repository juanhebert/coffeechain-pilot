select
    s.sender, a_sender.name as sendername,
    s.recipient, a_recipient.name as recipientname,
    s.timestamp as from, s_conf.timestamp as to
from shipment s
left join shipment_confirmation s_conf
on s_conf.shipment = s.id
join shipment_input s_in
on s_in.shipment = s.id
join actor a_sender
on a_sender.id = s.sender
join actor a_recipient
on a_recipient.id = s.recipient
where s_in.product = $1
order by s.timestamp;
