/*
  # Add Pro Shop items to menu_items table
  
  1. Changes
    - Insert new Pro Shop category items into menu_items table
    - Add sample images from Unsplash for visual appeal
*/

INSERT INTO menu_items (golf_course_id, category, item_name, description, price, image_url)
VALUES 
  (
    'c4a48f69-a535-4f57-8716-d34cff63059b',
    'Pro Shop',
    'Box of 12 Golf Balls',
    'Premium quality golf balls for optimal performance',
    35.00,
    'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'c4a48f69-a535-4f57-8716-d34cff63059b',
    'Pro Shop',
    'Golf Tees (50 pack)',
    'Durable wooden tees in various sizes',
    15.00,
    'https://images.unsplash.com/photo-1622819584099-e06a45986c56?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'c4a48f69-a535-4f57-8716-d34cff63059b',
    'Pro Shop',
    'Golf Cleaning Kit',
    'Complete kit for maintaining your clubs and balls',
    20.00,
    'https://images.unsplash.com/photo-1632149877166-f75d49000351?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'c4a48f69-a535-4f57-8716-d34cff63059b',
    'Pro Shop',
    'Sunscreen',
    'SPF 50+ water-resistant sunscreen',
    10.00,
    'https://images.unsplash.com/photo-1532947974358-a218d18d8d14?auto=format&fit=crop&w=800&q=80'
  ),
  (
    'c4a48f69-a535-4f57-8716-d34cff63059b',
    'Pro Shop',
    'Bug Spray',
    'Long-lasting insect repellent',
    15.00,
    'https://images.unsplash.com/photo-1635256448487-a2cd5b4459be?auto=format&fit=crop&w=800&q=80'
  );