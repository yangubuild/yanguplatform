-- Insert 2 new ebooks missing from the library
INSERT INTO visionaire_items (title, description, type, category, thumbnail_url, tags, is_active)
VALUES
  (
    'Package What You Know Into a High-Ticket Offer',
    'Learn how to transform your expertise and knowledge into premium, high-ticket digital products and consulting offers that command top dollar.',
    'ebook',
    'master_library',
    'https://entrepedia-products.com/covers/1773150661144-Book-Cover.jpg',
    ARRAY['Business', 'Marketing', 'high-ticket', 'offers', 'packaging knowledge'],
    true
  ),
  (
    'Sales Automation Chatbots',
    'Discover how to build and deploy AI-powered chatbots that automate your sales process, qualify leads, and close deals 24/7.',
    'ebook',
    'master_library',
    'https://entrepedia-products.com/covers/1773145263335-Book-Cover.jpg',
    ARRAY['Artificial Intelligence', 'Marketing', 'sales', 'chatbots', 'automation'],
    true
  );