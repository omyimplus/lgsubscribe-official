-- เปลี่ยนชื่อหมวด television จาก «โทรทัศน์» เป็น «ทีวี»

update public.categories
set name = 'ทีวี', updated_at = now()
where slug = 'television' and name = 'โทรทัศน์';
