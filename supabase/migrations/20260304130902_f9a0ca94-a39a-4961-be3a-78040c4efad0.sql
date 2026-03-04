-- Clean up test orders
DELETE FROM dropship_order_items WHERE dropship_order_id IN (SELECT id FROM dropship_orders WHERE notes = 'Phase 4 test order');
DELETE FROM dropship_orders WHERE notes = 'Phase 4 test order';
