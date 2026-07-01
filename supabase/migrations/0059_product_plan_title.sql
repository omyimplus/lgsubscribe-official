-- หัวข้อแผนสัญญา — admin กำหนดเอง แสดงตอนลูกค้าเลือกแผน

alter table public.product_plans
  add column if not exists plan_title text;
