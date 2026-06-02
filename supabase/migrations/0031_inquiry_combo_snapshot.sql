-- เก็บ segment + ผลคำนวณ combo ตอนส่งคำขอ (คำนวณฝั่ง server)

alter table public.subscription_inquiries
  add column if not exists combo_customer_segment text
    check (combo_customer_segment is null or combo_customer_segment in ('new', 'existing'));

alter table public.subscription_inquiries
  add column if not exists combo_snapshot jsonb;
