-- อนุญาตให้ SKU เดียวมีหลายแผนที่ระยะสัญญา + ประเภทบริการเดียวกัน (ราคา/โปร/ช่วงบิลต่างกัน)

drop index if exists public.product_plans_contract_service_per_product_idx;
