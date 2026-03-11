-- Deactivate all VLS items
UPDATE visionaire_items SET is_active = false WHERE category = 'vls';

-- Ensure all bundle source_url points to the correct shared Drive folder
UPDATE visionaire_items 
SET source_url = 'https://drive.google.com/drive/folders/1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362'
WHERE category = 'bundles' AND (source_url IS NULL OR source_url != 'https://drive.google.com/drive/folders/1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362');

-- Remove any entrepedia source_url references across all items
UPDATE visionaire_items 
SET source_url = 'https://drive.google.com/drive/folders/1hC_OTnAQ03zHZ6gxGvf2pVkQPv8jP362'
WHERE source_url LIKE '%entrepedia%';