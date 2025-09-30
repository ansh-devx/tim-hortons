-- First, clear existing products and kits for clean implementation
DELETE FROM kit_products;
DELETE FROM order_items;
DELETE FROM kits;
DELETE FROM products;

-- Create Camp Day Shirts with color variants
INSERT INTO products (id, name_en, name_fr, description_en, description_fr, price, category, images, sizes, is_active) VALUES
-- Camp Day - Red
(gen_random_uuid(), 'Camp Day Shirt - Red', 'Chemise Camp Day - Rouge', 'Official Camp Day campaign shirt in red color. Available in all sizes.', 'Chemise officielle de la campagne Camp Day en rouge. Disponible en toutes tailles.', 24.99, 'Camp Day Shirts', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL', '2XL'], true),
-- Camp Day - Blue
(gen_random_uuid(), 'Camp Day Shirt - Blue', 'Chemise Camp Day - Bleu', 'Official Camp Day campaign shirt in blue color. Available in all sizes.', 'Chemise officielle de la campagne Camp Day en bleu. Disponible en toutes tailles.', 24.99, 'Camp Day Shirts', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL', '2XL'], true),
-- Camp Day - Green
(gen_random_uuid(), 'Camp Day Shirt - Green', 'Chemise Camp Day - Vert', 'Official Camp Day campaign shirt in green color. Available in all sizes.', 'Chemise officielle de la campagne Camp Day en vert. Disponible en toutes tailles.', 24.99, 'Camp Day Shirts', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL', '2XL'], true),
-- Camp Day - Purple
(gen_random_uuid(), 'Camp Day Shirt - Purple', 'Chemise Camp Day - Violet', 'Official Camp Day campaign shirt in purple color. Available in all sizes.', 'Chemise officielle de la campagne Camp Day en violet. Disponible en toutes tailles.', 24.99, 'Camp Day Shirts', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL', '2XL'], true);

-- Create Harry Potter Shirts with house colors
INSERT INTO products (id, name_en, name_fr, description_en, description_fr, price, category, images, sizes, is_active) VALUES
-- Harry Potter - Gryffindor (Red)
(gen_random_uuid(), 'Harry Potter Shirt - Gryffindor', 'Chemise Harry Potter - Gryffondor', 'Official Harry Potter campaign shirt in Gryffindor red. Available in all sizes.', 'Chemise officielle de la campagne Harry Potter en rouge Gryffondor. Disponible en toutes tailles.', 24.99, 'Harry Potter Shirts', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL', '2XL'], true),
-- Harry Potter - Ravenclaw (Blue)
(gen_random_uuid(), 'Harry Potter Shirt - Ravenclaw', 'Chemise Harry Potter - Serdaigle', 'Official Harry Potter campaign shirt in Ravenclaw blue. Available in all sizes.', 'Chemise officielle de la campagne Harry Potter en bleu Serdaigle. Disponible en toutes tailles.', 24.99, 'Harry Potter Shirts', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL', '2XL'], true),
-- Harry Potter - Slytherin (Green)
(gen_random_uuid(), 'Harry Potter Shirt - Slytherin', 'Chemise Harry Potter - Serpentard', 'Official Harry Potter campaign shirt in Slytherin green. Available in all sizes.', 'Chemise officielle de la campagne Harry Potter en vert Serpentard. Disponible en toutes tailles.', 24.99, 'Harry Potter Shirts', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL', '2XL'], true),
-- Harry Potter - Hufflepuff (Yellow)
(gen_random_uuid(), 'Harry Potter Shirt - Hufflepuff', 'Chemise Harry Potter - Poufsouffle', 'Official Harry Potter campaign shirt in Hufflepuff yellow. Available in all sizes.', 'Chemise officielle de la campagne Harry Potter en jaune Poufsouffle. Disponible en toutes tailles.', 24.99, 'Harry Potter Shirts', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL', '2XL'], true);

-- Create additional individual items
INSERT INTO products (id, name_en, name_fr, description_en, description_fr, price, category, images, sizes, is_active) VALUES
(gen_random_uuid(), 'Tim Hortons Polo Shirt', 'Polo Tim Hortons', 'Official Tim Hortons polo shirt in signature red color. Available in multiple sizes.', 'Polo officiel Tim Hortons en rouge signature. Disponible en plusieurs tailles.', 24.99, 'Apparel', ARRAY['/placeholder.svg'], ARRAY['S', 'M', 'L', 'XL', '2XL'], true),
(gen_random_uuid(), 'Tim Hortons Apron', 'Tablier Tim Hortons', 'Durable apron with Tim Hortons branding and multiple pockets.', 'Tablier durable avec la marque Tim Hortons et plusieurs poches.', 19.99, 'Apparel', ARRAY['/placeholder.svg'], NULL, true),
(gen_random_uuid(), 'Tim Hortons Cap', 'Casquette Tim Hortons', 'Official branded cap with adjustable strap. One size fits most.', 'Casquette officielle avec sangle ajustable. Taille unique.', 14.99, 'Apparel', ARRAY['/placeholder.svg'], NULL, true);

-- Create Kits (A, B, C, D) for Camp Day - English
INSERT INTO kits (id, name_en, name_fr, description_en, description_fr, category, images, is_standard, requires_approval, is_active) VALUES
(gen_random_uuid(), 'Kit A - Camp Day (English)', 'Ensemble A - Camp Day (Anglais)', 'Standard kit A with Camp Day shirts: 4-S, 8-M, 5-L, 2-XL, 1-2XL. Paid by Head Office.', 'Ensemble standard A avec chemises Camp Day: 4-S, 8-M, 5-L, 2-XL, 1-2XL. Payé par le siège social.', 'Camp Day Kits - English', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit B - Camp Day (English)', 'Ensemble B - Camp Day (Anglais)', 'Standard kit B with Camp Day shirts: 7-S, 11-M, 7-L, 3-XL, 2-2XL. Paid by Head Office.', 'Ensemble standard B avec chemises Camp Day: 7-S, 11-M, 7-L, 3-XL, 2-2XL. Payé par le siège social.', 'Camp Day Kits - English', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit C - Camp Day (English)', 'Ensemble C - Camp Day (Anglais)', 'Standard kit C with Camp Day shirts: 9-S, 14-M, 11-L, 4-XL, 2-2XL. Paid by Head Office.', 'Ensemble standard C avec chemises Camp Day: 9-S, 14-M, 11-L, 4-XL, 2-2XL. Payé par le siège social.', 'Camp Day Kits - English', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit D - Camp Day (English)', 'Ensemble D - Camp Day (Anglais)', 'Standard kit D with Camp Day shirts: 12-S, 16-M, 13-L, 5-XL, 4-2XL. Paid by Head Office.', 'Ensemble standard D avec chemises Camp Day: 12-S, 16-M, 13-L, 5-XL, 4-2XL. Payé par le siège social.', 'Camp Day Kits - English', ARRAY['/placeholder.svg'], true, false, true);

-- Create Kits (A, B, C, D) for Camp Day - French
INSERT INTO kits (id, name_en, name_fr, description_en, description_fr, category, images, is_standard, requires_approval, is_active) VALUES
(gen_random_uuid(), 'Kit A - Camp Day (French)', 'Ensemble A - Camp Day (Français)', 'Standard kit A with Camp Day shirts: 4-S, 8-M, 5-L, 2-XL, 1-2XL. Paid by Head Office.', 'Ensemble standard A avec chemises Camp Day: 4-S, 8-M, 5-L, 2-XL, 1-2XL. Payé par le siège social.', 'Camp Day Kits - French', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit B - Camp Day (French)', 'Ensemble B - Camp Day (Français)', 'Standard kit B with Camp Day shirts: 7-S, 11-M, 7-L, 3-XL, 2-2XL. Paid by Head Office.', 'Ensemble standard B avec chemises Camp Day: 7-S, 11-M, 7-L, 3-XL, 2-2XL. Payé par le siège social.', 'Camp Day Kits - French', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit C - Camp Day (French)', 'Ensemble C - Camp Day (Français)', 'Standard kit C with Camp Day shirts: 9-S, 14-M, 11-L, 4-XL, 2-2XL. Paid by Head Office.', 'Ensemble standard C avec chemises Camp Day: 9-S, 14-M, 11-L, 4-XL, 2-2XL. Payé par le siège social.', 'Camp Day Kits - French', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit D - Camp Day (French)', 'Ensemble D - Camp Day (Français)', 'Standard kit D with Camp Day shirts: 12-S, 16-M, 13-L, 5-XL, 4-2XL. Paid by Head Office.', 'Ensemble standard D avec chemises Camp Day: 12-S, 16-M, 13-L, 5-XL, 4-2XL. Payé par le siège social.', 'Camp Day Kits - French', ARRAY['/placeholder.svg'], true, false, true);

-- Create Kits (A, B, C, D) for Harry Potter - English
INSERT INTO kits (id, name_en, name_fr, description_en, description_fr, category, images, is_standard, requires_approval, is_active) VALUES
(gen_random_uuid(), 'Kit A - Harry Potter (English)', 'Ensemble A - Harry Potter (Anglais)', 'Standard kit A with Harry Potter shirts: 4-S, 8-M, 5-L, 2-XL, 1-2XL. Paid by Head Office.', 'Ensemble standard A avec chemises Harry Potter: 4-S, 8-M, 5-L, 2-XL, 1-2XL. Payé par le siège social.', 'Harry Potter Kits - English', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit B - Harry Potter (English)', 'Ensemble B - Harry Potter (Anglais)', 'Standard kit B with Harry Potter shirts: 7-S, 11-M, 7-L, 3-XL, 2-2XL. Paid by Head Office.', 'Ensemble standard B avec chemises Harry Potter: 7-S, 11-M, 7-L, 3-XL, 2-2XL. Payé par le siège social.', 'Harry Potter Kits - English', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit C - Harry Potter (English)', 'Ensemble C - Harry Potter (Anglais)', 'Standard kit C with Harry Potter shirts: 9-S, 14-M, 11-L, 4-XL, 2-2XL. Paid by Head Office.', 'Ensemble standard C avec chemises Harry Potter: 9-S, 14-M, 11-L, 4-XL, 2-2XL. Payé par le siège social.', 'Harry Potter Kits - English', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit D - Harry Potter (English)', 'Ensemble D - Harry Potter (Anglais)', 'Standard kit D with Harry Potter shirts: 12-S, 16-M, 13-L, 5-XL, 4-2XL. Paid by Head Office.', 'Ensemble standard D avec chemises Harry Potter: 12-S, 16-M, 13-L, 5-XL, 4-2XL. Payé par le siège social.', 'Harry Potter Kits - English', ARRAY['/placeholder.svg'], true, false, true);

-- Create Kits (A, B, C, D) for Harry Potter - French
INSERT INTO kits (id, name_en, name_fr, description_en, description_fr, category, images, is_standard, requires_approval, is_active) VALUES
(gen_random_uuid(), 'Kit A - Harry Potter (French)', 'Ensemble A - Harry Potter (Français)', 'Standard kit A with Harry Potter shirts: 4-S, 8-M, 5-L, 2-XL, 1-2XL. Paid by Head Office.', 'Ensemble standard A avec chemises Harry Potter: 4-S, 8-M, 5-L, 2-XL, 1-2XL. Payé par le siège social.', 'Harry Potter Kits - French', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit B - Harry Potter (French)', 'Ensemble B - Harry Potter (Français)', 'Standard kit B with Harry Potter shirts: 7-S, 11-M, 7-L, 3-XL, 2-2XL. Paid by Head Office.', 'Ensemble standard B avec chemises Harry Potter: 7-S, 11-M, 7-L, 3-XL, 2-2XL. Payé par le siège social.', 'Harry Potter Kits - French', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit C - Harry Potter (French)', 'Ensemble C - Harry Potter (Français)', 'Standard kit C with Harry Potter shirts: 9-S, 14-M, 11-L, 4-XL, 2-2XL. Paid by Head Office.', 'Ensemble standard C avec chemises Harry Potter: 9-S, 14-M, 11-L, 4-XL, 2-2XL. Payé par le siège social.', 'Harry Potter Kits - French', ARRAY['/placeholder.svg'], true, false, true),
(gen_random_uuid(), 'Kit D - Harry Potter (French)', 'Ensemble D - Harry Potter (Français)', 'Standard kit D with Harry Potter shirts: 12-S, 16-M, 13-L, 5-XL, 4-2XL. Paid by Head Office.', 'Ensemble standard D avec chemises Harry Potter: 12-S, 16-M, 13-L, 5-XL, 4-2XL. Payé par le siège social.', 'Harry Potter Kits - French', ARRAY['/placeholder.svg'], true, false, true);