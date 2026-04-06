/**
 * Full demo content for the 3 reference emenu templates.
 * Each template gets realistic menu items, categories, testimonials, etc.
 * Used by templateRegistry.ts patches to replace empty `items: []`.
 */

// ─── PLATERIA: Elegant dark fine-casual restaurant ───

export const PLATERIA_MENU_ITEMS = [
  { title: "Truffle Risotto", description: "Arborio rice, black truffle, aged parmesan", price: "$28", badges: ["chef_special"], dietary_tags: ["vegetarian"] },
  { title: "Grilled Lamb Rack", description: "Herb-crusted lamb with rosemary jus", price: "$38", badges: ["popular"] },
  { title: "Pan-Seared Salmon", description: "Atlantic salmon, lemon butter, asparagus", price: "$32", badges: ["best_seller"], dietary_tags: ["gluten_free"] },
  { title: "Burrata Salad", description: "Fresh burrata, heirloom tomatoes, basil oil", price: "$18", dietary_tags: ["vegetarian"] },
  { title: "Wagyu Carpaccio", description: "Thinly sliced wagyu, truffle mayo, capers", price: "$26", badges: ["new"] },
  { title: "Lobster Linguine", description: "Fresh lobster, cherry tomatoes, white wine", price: "$36", badges: ["popular"] },
  { title: "Duck Confit", description: "Slow-cooked duck leg, potato gratin, jus", price: "$34" },
  { title: "Chocolate Fondant", description: "Warm dark chocolate, vanilla ice cream", price: "$16", badges: ["best_seller"] },
  { title: "Crème Brûlée", description: "Classic vanilla bean, caramelized sugar", price: "$14" },
];

export const PLATERIA_TESTIMONIALS = [
  { quote: "An unforgettable dining experience. Every dish was a masterpiece.", name: "Sarah M.", role: "Food Critic" },
  { quote: "The ambiance and flavors transport you to another world. Truly exceptional.", name: "James K.", role: "Regular Guest" },
  { quote: "Best fine-casual restaurant in the city. The truffle risotto is divine.", name: "Amira L.", role: "Food Blogger" },
];

// ─── YUMIX: Bold dark food brand ───

export const YUMIX_MENU_ITEMS = [
  { title: "Smash Burger", description: "Double patty, cheddar, special sauce, brioche bun", price: "$14", badges: ["best_seller"] },
  { title: "Loaded Fries", description: "Crispy fries, cheese sauce, jalapeños, bacon", price: "$10", badges: ["popular"] },
  { title: "BBQ Wings", description: "12 pcs, smoky BBQ glaze, ranch dip", price: "$16", badges: ["popular"] },
  { title: "Chicken Shawarma Wrap", description: "Grilled chicken, garlic sauce, pickles", price: "$12" },
  { title: "Margherita Pizza", description: "San Marzano tomatoes, fresh mozzarella, basil", price: "$18", dietary_tags: ["vegetarian"] },
  { title: "Crispy Chicken Sandwich", description: "Buttermilk fried chicken, slaw, pickles", price: "$15", badges: ["new"] },
];

export const YUMIX_CATEGORY_ITEMS = [
  { title: "Burgers", count: "8 items" },
  { title: "Pizzas", count: "6 items" },
  { title: "Wings & Sides", count: "10 items" },
  { title: "Wraps", count: "5 items" },
];

export const YUMIX_PROMO_BANNERS = [
  { heading: "🔥 30% OFF First Order", description: "Use code YUMIX30 at checkout for your first delivery order.", cta_text: "Order Now" },
  { heading: "🎉 Family Combo Deal", description: "2 Burgers + Fries + Drinks for just $29. Limited time!", cta_text: "Grab Deal" },
];

export const YUMIX_STATS = [
  { value: "50K+", label: "Happy Customers" },
  { value: "4.8", label: "Average Rating" },
  { value: "30min", label: "Avg. Delivery" },
  { value: "200+", label: "Menu Items" },
];

export const YUMIX_TESTIMONIALS = [
  { quote: "Best burgers in town! The smash burger is insanely good.", name: "Omar R.", role: "Foodie" },
  { quote: "Fast delivery, great quality. Yumix never disappoints.", name: "Fatima S.", role: "Regular Customer" },
  { quote: "The loaded fries are addictive. My whole family loves ordering from here.", name: "Ahmed T.", role: "Loyal Fan" },
];

// ─── ZOOOM: Clean bright modern food site ───

export const ZOOOM_MENU_ITEMS = [
  { title: "Açaí Power Bowl", description: "Açaí blend, granola, banana, mixed berries", price: "$13", badges: ["popular"], dietary_tags: ["vegan"] },
  { title: "Avocado Toast", description: "Sourdough, smashed avocado, poached eggs, chili flakes", price: "$11", badges: ["best_seller"] },
  { title: "Green Goddess Wrap", description: "Spinach tortilla, hummus, grilled veggies, tahini", price: "$12", dietary_tags: ["vegan"] },
  { title: "Salmon Poke Bowl", description: "Fresh salmon, sushi rice, edamame, mango, soy glaze", price: "$16", badges: ["new"] },
  { title: "Matcha Latte", description: "Ceremonial grade matcha, oat milk, light sweetness", price: "$6", dietary_tags: ["vegan", "dairy_free"] },
  { title: "Berry Smoothie Bowl", description: "Mixed berries, coconut yogurt, chia seeds, honey", price: "$11" },
  { title: "Chicken Caesar Salad", description: "Grilled chicken, romaine, parmesan, classic caesar dressing", price: "$14" },
  { title: "Cold Brew Coffee", description: "Slow-brewed 18hr cold brew, smooth and bold", price: "$5" },
];

export const ZOOOM_CATEGORY_ITEMS = [
  { title: "Bowls", count: "6 items" },
  { title: "Wraps & Toast", count: "5 items" },
  { title: "Salads", count: "4 items" },
  { title: "Drinks", count: "8 items" },
];

export const ZOOOM_TESTIMONIALS = [
  { quote: "Love the healthy options! Fresh, fast, and delicious every time.", name: "Lina B.", role: "Health Enthusiast" },
  { quote: "The açaí bowl is perfection. Clean eating never tasted this good.", name: "Mark D.", role: "Fitness Coach" },
  { quote: "Quick delivery and beautifully presented food. Zooom is my go-to.", name: "Priya K.", role: "Regular" },
];
