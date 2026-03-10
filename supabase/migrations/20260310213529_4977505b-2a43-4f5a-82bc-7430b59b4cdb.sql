-- Tag AI-related ebooks with "Artificial Intelligence"
UPDATE visionaire_items SET tags = array_append(tags, 'Artificial Intelligence')
WHERE category = 'master_library' AND type = 'ebook'
AND (
  title ILIKE '%AI%' OR title ILIKE '%artificial%' OR title ILIKE '%chatbot%' OR title ILIKE '%blockchain%'
  OR title ILIKE '%automation%'
)
AND NOT ('Artificial Intelligence' = ANY(tags));

-- Tag content/marketing ebooks with "Content Creation"
UPDATE visionaire_items SET tags = array_append(tags, 'Content Creation')
WHERE category = 'master_library' AND type = 'ebook'
AND (
  title ILIKE '%content%' OR title ILIKE '%writing%' OR title ILIKE '%storytelling%'
  OR title ILIKE '%copy%' OR title ILIKE '%visual identity%' OR title ILIKE '%brand%'
  OR title ILIKE '%visual selling%' OR title ILIKE '%case studies%'
)
AND NOT ('Content Creation' = ANY(tags));

-- Tag productivity/self-improvement ebooks with "Productivity Guides"
UPDATE visionaire_items SET tags = array_append(tags, 'Productivity Guides')
WHERE category = 'master_library' AND type = 'ebook'
AND (
  title ILIKE '%productivity%' OR title ILIKE '%time%' OR title ILIKE '%prioritize%'
  OR title ILIKE '%execution%' OR title ILIKE '%eisenhower%' OR title ILIKE '%skill%'
  OR title ILIKE '%wellness%' OR title ILIKE '%sleep%' OR title ILIKE '%mindful%'
  OR title ILIKE '%self-coaching%' OR title ILIKE '%emotional intelligence%'
  OR title ILIKE '%cortisol%' OR title ILIKE '%digital detox%' OR title ILIKE '%fitness%'
)
AND NOT ('Productivity Guides' = ANY(tags));

-- Tag marketing ebooks with "Marketing"
UPDATE visionaire_items SET tags = array_append(tags, 'Marketing')
WHERE category = 'master_library' AND type = 'ebook'
AND (
  title ILIKE '%marketing%' OR title ILIKE '%sales%' OR title ILIKE '%selling%'
  OR title ILIKE '%landing page%' OR title ILIKE '%funnel%' OR title ILIKE '%social proof%'
  OR title ILIKE '%closing%' OR title ILIKE '%monetiz%' OR title ILIKE '%TikTok%'
  OR title ILIKE '%SEO%' OR title ILIKE '%advertising%' OR title ILIKE '%merch%'
)
AND NOT ('Marketing' = ANY(tags));

-- Tag business ebooks with "Business"
UPDATE visionaire_items SET tags = array_append(tags, 'Business')
WHERE category = 'master_library' AND type = 'ebook'
AND (
  title ILIKE '%business%' OR title ILIKE '%franchise%' OR title ILIKE '%agency%'
  OR title ILIKE '%blueprint%' OR title ILIKE '%model%' OR title ILIKE '%customer%'
  OR title ILIKE '%growth%' OR title ILIKE '%high-ticket%' OR title ILIKE '%estate%'
  OR title ILIKE '%homebuyer%' OR title ILIKE '%security%' OR title ILIKE '%change management%'
)
AND NOT ('Business' = ANY(tags));