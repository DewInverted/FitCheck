import { NextRequest, NextResponse } from "next/server";

/**
 * Product search — returns product images from Pexels/stock
 * with Shopee links for actual purchasing
 */

const PRODUCT_IMAGES: Record<string, { img: string; alt: string }[]> = {
  "T-Shirt": [
    { img: "https://images.pexels.com/photos/5698851/pexels-photo-5698851.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Plain t-shirt" },
    { img: "https://images.pexels.com/photos/5698854/pexels-photo-5698854.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Casual tee" },
    { img: "https://images.pexels.com/photos/6311392/pexels-photo-6311392.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Basic t-shirt" },
  ],
  "Shirt": [
    { img: "https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Button-down shirt" },
    { img: "https://images.pexels.com/photos/4210863/pexels-photo-4210863.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Casual shirt" },
  ],
  "Polo": [
    { img: "https://images.pexels.com/photos/6626903/pexels-photo-6626903.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Polo shirt" },
    { img: "https://images.pexels.com/photos/6626967/pexels-photo-6626967.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Classic polo" },
  ],
  "Jeans": [
    { img: "https://images.pexels.com/photos/4210864/pexels-photo-4210864.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Denim jeans" },
    { img: "https://images.pexels.com/photos/1082528/pexels-photo-1082528.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Blue jeans" },
    { img: "https://images.pexels.com/photos/4210866/pexels-photo-4210866.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Jeans flat lay" },
  ],
  "Chinos": [
    { img: "https://images.pexels.com/photos/3755706/pexels-photo-3755706.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Chino pants" },
    { img: "https://images.pexels.com/photos/6764040/pexels-photo-6764040.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Khaki chinos" },
  ],
  "Dress Pants": [
    { img: "https://images.pexels.com/photos/6764040/pexels-photo-6764040.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Dress pants" },
  ],
  "Cargo Pants": [
    { img: "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Cargo pants" },
  ],
  "Shorts": [
    { img: "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Casual shorts" },
  ],
  "Joggers": [
    { img: "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Joggers" },
  ],
  "Sneakers": [
    { img: "https://images.pexels.com/photos/1461048/pexels-photo-1461048.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "White sneakers" },
    { img: "https://images.pexels.com/photos/19845610/pexels-photo-19845610.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Black sneakers" },
    { img: "https://images.pexels.com/photos/1464625/pexels-photo-1464625.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Casual sneakers" },
  ],
  "Loafers": [
    { img: "https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Loafers" },
    { img: "https://images.pexels.com/photos/6046226/pexels-photo-6046226.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Classic loafers" },
  ],
  "Dress Shoes": [
    { img: "https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Dress shoes" },
  ],
  "Boots": [
    { img: "https://images.pexels.com/photos/6046183/pexels-photo-6046183.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Boots" },
  ],
  "Watch": [
    { img: "https://images.pexels.com/photos/190819/pexels-photo-190819.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Classic watch" },
    { img: "https://images.pexels.com/photos/280250/pexels-photo-280250.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Wrist watch" },
  ],
  "Sunglasses": [
    { img: "https://images.pexels.com/photos/701877/pexels-photo-701877.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Sunglasses" },
    { img: "https://images.pexels.com/photos/46710/pexels-photo-46710.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Classic shades" },
  ],
  "Crossbody Bag": [
    { img: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Crossbody bag" },
  ],
  "Hoodie": [
    { img: "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Hoodie" },
  ],
  "Blazer": [
    { img: "https://images.pexels.com/photos/6626903/pexels-photo-6626903.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Blazer" },
  ],
  "Turtleneck": [
    { img: "https://images.pexels.com/photos/6626967/pexels-photo-6626967.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Turtleneck" },
  ],
  "Bomber Jacket": [
    { img: "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Bomber jacket" },
  ],
  "Windbreaker": [
    { img: "https://images.pexels.com/photos/6311652/pexels-photo-6311652.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Windbreaker" },
  ],
  "Cap": [
    { img: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Cap" },
  ],
  "Belt": [
    { img: "https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=400", alt: "Belt" },
  ],
};

function getProducts(subcategory: string, color: string, gender: string) {
  const images = PRODUCT_IMAGES[subcategory] || PRODUCT_IMAGES["T-Shirt"] || [];
  const g = gender === "female" ? "women" : "men";
  const query = `${color} ${subcategory} ${g}`;

  const prices: Record<string, { low: number; high: number }> = {
    "T-Shirt": { low: 79, high: 299 },
    "Shirt": { low: 149, high: 499 },
    "Polo": { low: 199, high: 599 },
    "Jeans": { low: 299, high: 799 },
    "Chinos": { low: 249, high: 699 },
    "Dress Pants": { low: 299, high: 899 },
    "Cargo Pants": { low: 249, high: 699 },
    "Shorts": { low: 149, high: 399 },
    "Joggers": { low: 199, high: 499 },
    "Sneakers": { low: 299, high: 1299 },
    "Loafers": { low: 399, high: 1499 },
    "Dress Shoes": { low: 499, high: 1999 },
    "Boots": { low: 499, high: 1499 },
    "Watch": { low: 199, high: 999 },
    "Sunglasses": { low: 79, high: 399 },
    "Crossbody Bag": { low: 149, high: 599 },
    "Hoodie": { low: 199, high: 599 },
    "Blazer": { low: 399, high: 1299 },
    "Turtleneck": { low: 199, high: 599 },
    "Bomber Jacket": { low: 399, high: 999 },
    "Windbreaker": { low: 299, high: 799 },
    "Cap": { low: 99, high: 299 },
    "Belt": { low: 149, high: 499 },
  };

  const range = prices[subcategory] || { low: 99, high: 499 };

  return images.map((img, idx) => ({
    id: `${subcategory}-${color}-${idx}`,
    image: img.img,
    alt: img.alt,
    title: `${color} ${subcategory}`,
    priceRange: `₱${range.low} - ₱${range.high}`,
    shopUrl: `https://shopee.ph/search?keyword=${encodeURIComponent(query)}&sortBy=sales`,
    soldCount: `${Math.floor(Math.random() * 9 + 1)}k+ sold`,
    rating: (4 + Math.random()).toFixed(1),
    badge: idx === 0 ? "Top Rated" : idx === 1 ? "Best Seller" : "Good Deal",
  }));
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subcategory = searchParams.get("subcategory") || "T-Shirt";
    const color = searchParams.get("color") || "White";
    const gender = searchParams.get("gender") || "male";

    const products = getProducts(subcategory, color, gender);

    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json([], { status: 500 });
  }
}
