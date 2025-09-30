-- Create placeholder stores
INSERT INTO stores (id, name, address, city, province, postal_code, phone, is_active)
VALUES 
  (gen_random_uuid(), 'Store A', '123 Main St', 'Toronto', 'ON', 'M1M 1M1', '416-555-0001', true),
  (gen_random_uuid(), 'Store B', '456 Elm St', 'Montreal', 'QC', 'H1H 1H1', '514-555-0002', true),
  (gen_random_uuid(), 'Store C', '789 Oak Ave', 'Vancouver', 'BC', 'V1V 1V1', '604-555-0003', true);

-- Assign Store A and Store C to the current user
INSERT INTO user_stores (user_id, store_id)
SELECT 
  'd7418c6f-3ca0-4362-9212-0b0c4f1572a2'::uuid,
  id
FROM stores
WHERE name IN ('Store A', 'Store C');