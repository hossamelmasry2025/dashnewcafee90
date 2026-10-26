/**
 * Initial seed data for Cafe 90 Web Dashboard
 * Rich, realistic mock data matching the brand aesthetic and API requirements.
 */

export const initialData = {
  cafeInfo: {
    id: "cafe-90-main",
    name: "Cafe 90",
    tagline: "Coffee, Moments, Elevated",
    description: "An artisanal specialty coffee sanctuary on Road 90, crafting premium espresso blends, elevated pastries, and private executive meeting spaces.",
    phone: "+20 100 909 0900",
    secondaryPhone: "+20 120 909 0901",
    whatsapp: "+20 100 909 0900",
    email: "contact@cafe90egypt.com",
    supportEmail: "orders@cafe90egypt.com",
    address: "90 North St., Sector 1, New Cairo, Cairo, Egypt",
    city: "New Cairo",
    country: "Egypt",
    googleMapsUrl: "https://maps.google.com/?q=Road+90+New+Cairo",
    currency: "EGP",
    currencySymbol: "EGP",
    taxRate: 14, // 14% VAT Egypt
    serviceCharge: 12, // 12% Service Charge
    openingTimeWeekday: "07:00",
    closingTimeWeekday: "00:00",
    openingTimeWeekend: "08:00",
    closingTimeWeekend: "01:00",
    socialLinks: {
      instagram: "https://instagram.com/cafe90.egypt",
      facebook: "https://facebook.com/cafe90egypt",
      tiktok: "https://tiktok.com/@cafe90official",
      website: "https://cafe90egypt.com"
    }
  },

  kpiStats: {
    totalRevenue: 284500,
    revenueGrowth: "+18.6%",
    totalOrders: 2140,
    ordersGrowth: "+14.2%",
    activeCustomers: 4890,
    customersGrowth: "+9.4%",
    averageOrderValue: 185,
    aovGrowth: "+4.1%",
    averageRating: 4.9,
    totalReviews: 328,
    newReviewsThisWeek: 42,
    activeCouponsCount: 6,
    activeRoomsCount: 4,
    pendingOrdersCount: 7
  },

  revenueAnalytics: {
    daily: [
      { name: "08:00", revenue: 4200, orders: 28, dineIn: 18, takeaway: 10 },
      { name: "10:00", revenue: 9800, orders: 54, dineIn: 32, takeaway: 22 },
      { name: "12:00", revenue: 14500, orders: 78, dineIn: 48, takeaway: 30 },
      { name: "14:00", revenue: 11200, orders: 62, dineIn: 38, takeaway: 24 },
      { name: "16:00", revenue: 16800, orders: 88, dineIn: 56, takeaway: 32 },
      { name: "18:00", revenue: 22400, orders: 115, dineIn: 75, takeaway: 40 },
      { name: "20:00", revenue: 28900, orders: 142, dineIn: 98, takeaway: 44 },
      { name: "22:00", revenue: 19500, orders: 96, dineIn: 70, takeaway: 26 },
      { name: "00:00", revenue: 8400, orders: 45, dineIn: 35, takeaway: 10 }
    ],
    weekly: [
      { name: "Mon", revenue: 32400, orders: 180, growth: "+8%" },
      { name: "Tue", revenue: 34800, orders: 195, growth: "+11%" },
      { name: "Wed", revenue: 38200, orders: 210, growth: "+14%" },
      { name: "Thu", revenue: 54600, orders: 290, growth: "+26%" },
      { name: "Fri", revenue: 68900, orders: 360, growth: "+38%" },
      { name: "Sat", revenue: 62100, orders: 330, growth: "+31%" },
      { name: "Sun", revenue: 41200, orders: 225, growth: "+16%" }
    ],
    monthly: [
      { name: "Jan", revenue: 182000, orders: 1240, avgOrder: 146 },
      { name: "Feb", revenue: 198000, orders: 1360, avgOrder: 145 },
      { name: "Mar", revenue: 225000, orders: 1540, avgOrder: 146 },
      { name: "Apr", revenue: 210000, orders: 1420, avgOrder: 147 },
      { name: "May", revenue: 248000, orders: 1680, avgOrder: 147 },
      { name: "Jun", revenue: 265000, orders: 1810, avgOrder: 146 },
      { name: "Jul", revenue: 279000, orders: 1950, avgOrder: 143 },
      { name: "Aug", revenue: 284500, orders: 2140, avgOrder: 185 }
    ]
  },

  orderDistribution: [
    { name: "Completed", value: 1680, color: "#10B981" },
    { name: "Preparing", value: 240, color: "#D4A037" },
    { name: "Pending", value: 110, color: "#F59E0B" },
    { name: "Ready for Pickup", value: 85, color: "#3B82F6" },
    { name: "Cancelled", value: 25, color: "#EF4444" }
  ],

  banners: [
    {
      id: "banner-1",
      title: "Signature Gold Spanish Latte",
      subtitle: "Brewed with 100% Ethiopian Yirgacheffe & infused with 24k gold leaf",
      imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=1200&q=80",
      ctaText: "Order Now",
      ctaLink: "/menu",
      bannerType: "main_banner1",
      badge: "FEATURED DRINK",
      active: true,
      displayOrder: 1
    },
    {
      id: "banner-2",
      title: "Artisan Pistachio & Rose Croissants",
      subtitle: "Baked fresh every morning by our master pastry chefs in Cairo",
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=1200&q=80",
      ctaText: "Explore Bakery",
      ctaLink: "/menu?category=bakery",
      bannerType: "main_banner2",
      badge: "FRESH BAKED",
      active: true,
      displayOrder: 2
    },
    {
      id: "banner-3",
      title: "Private VIP Executive Lounge & Boardroom 90°",
      subtitle: "High-speed Wi-Fi 6, 4K presentation display, plush leather seating, and dedicated barista service",
      imageUrl: "/banner_room_solvex_lounge.jpg",
      images: [
        { id: 1, image_url: "/banner_room_solvex_lounge.jpg", sort_order: 1 },
        { id: 2, image_url: "/banner_room_solvex_meeting.jpg", sort_order: 2 },
        { id: 3, image_url: "/banner_room_solvex_pod.jpg", sort_order: 3 }
      ],
      ctaText: "Book a Room",
      ctaLink: "/facilities",
      bannerType: "room_banner3",
      badge: "VIP WORKSPACE",
      active: true,
      displayOrder: 3
    }
  ],

  categories: [
    {
      id: "cat-1",
      name: "Specialty Hot Coffee",
      nameAr: "القهوة المختصة الساخنة",
      slug: "hot-coffee",
      icon: "Coffee",
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=400&q=80",
      itemCount: 12,
      displayOrder: 1,
      active: true
    },
    {
      id: "cat-2",
      name: "Cold Brew & Iced Coffee",
      nameAr: "القهوة المثلجة والمقطرة بارداً",
      slug: "cold-coffee",
      icon: "CupSoda",
      imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=400&q=80",
      itemCount: 9,
      displayOrder: 2,
      active: true
    },
    {
      id: "cat-3",
      name: "Signature 90° Blends",
      nameAr: "مشروبات 90 المميزة",
      slug: "signature-blends",
      icon: "Sparkles",
      imageUrl: "https://images.unsplash.com/photo-1570968915860-54d5c301fa9f?auto=format&fit=crop&w=400&q=80",
      itemCount: 6,
      displayOrder: 3,
      active: true
    },
    {
      id: "cat-4",
      name: "Artisan Bakery & Pastries",
      nameAr: "المخبوزات والحلويات الفرنسية",
      slug: "bakery",
      icon: "Croissant",
      imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=400&q=80",
      itemCount: 14,
      displayOrder: 4,
      active: true
    },
    {
      id: "cat-5",
      name: "Gourmet Sandwiches & Brunch",
      nameAr: "الساندوتشات والبرانش",
      slug: "sandwiches",
      icon: "Utensils",
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=400&q=80",
      itemCount: 8,
      displayOrder: 5,
      active: true
    },
    {
      id: "cat-6",
      name: "Specialty Teas & Refreshers",
      nameAr: "الشاي والمشروبات المنعشة",
      slug: "teas",
      icon: "GlassWater",
      imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=400&q=80",
      itemCount: 7,
      displayOrder: 6,
      active: true
    }
  ],

  subcategories: [
    { id: "subcat-1", categoryId: "cat-1", name: "Espresso & Macchiato", displayOrder: 1, active: true },
    { id: "subcat-2", categoryId: "cat-1", name: "Pour Over & V60 / Chemex", displayOrder: 2, active: true },
    { id: "subcat-3", categoryId: "cat-1", name: "Classic Lattes & Cappuccinos", displayOrder: 3, active: true },
    { id: "subcat-4", categoryId: "cat-2", name: "Nitro & Cold Brew", displayOrder: 1, active: true },
    { id: "subcat-5", categoryId: "cat-2", name: "Iced Flavored Lattes", displayOrder: 2, active: true },
    { id: "subcat-6", categoryId: "cat-3", name: "Gold 90 Specials", displayOrder: 1, active: true },
    { id: "subcat-7", categoryId: "cat-3", name: "Velvet Crema Blends", displayOrder: 2, active: true },
    { id: "subcat-8", categoryId: "cat-4", name: "French Croissants", displayOrder: 1, active: true },
    { id: "subcat-9", categoryId: "cat-4", name: "Cheesecakes & Tarts", displayOrder: 2, active: true },
    { id: "subcat-10", categoryId: "cat-5", name: "Artisan Sourdough Melts", displayOrder: 1, active: true },
    { id: "subcat-11", categoryId: "cat-5", name: "Croissant Sandwiches", displayOrder: 2, active: true }
  ],

  menuItems: [
    {
      id: "item-101",
      name: "90° Signature Gold Spanish Latte",
      nameAr: "سبانش لاتيه 90 الذهبي المميز",
      categoryId: "cat-3",
      subcategoryId: "subcat-6",
      price: 145,
      costPrice: 42,
      discountValue: 15,
      discountType: 'percentage',
      prepTime: "4 mins",
      stockStatus: "in_stock", // in_stock, low_stock, out_of_stock
      featured: true,
      rating: 4.95,
      reviewCount: 184,
      allergens: ["Milk", "Lactose"],
      description: "Our signature blend of double espresso with condensed milk, organic vanilla foam, and edible 24k gold leaf dust.",
      imageUrl: "https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80",
      customizations: [
        { name: "Milk Choice", options: ["Whole Milk", "Oat Milk (+25 EGP)", "Almond Milk (+25 EGP)", "Coconut Milk (+20 EGP)"] },
        { name: "Extra Shot", options: ["Single Shot (+30 EGP)", "None"] },
        { name: "Sweetness", options: ["100%", "75%", "50%", "Sugar Free"] }
      ]
    },
    {
      id: "item-102",
      name: "Ethiopian V60 Single Origin",
      nameAr: "قهوة مقطرة V60 إثيوبيا",
      categoryId: "cat-1",
      subcategoryId: "subcat-2",
      price: 120,
      costPrice: 35,
      discountValue: 0,
      discountType: 'percentage',
      prepTime: "6 mins",
      stockStatus: "in_stock",
      featured: true,
      rating: 4.88,
      reviewCount: 96,
      allergens: [],
      description: "Hand-poured single origin Yirgacheffe notes of bergamot, jasmine florals, and subtle wild peach sweetness.",
      imageUrl: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80",
      customizations: [
        { name: "Beans Roast", options: ["Light Floral", "Medium Citrus", "Dark Chocolatey"] }
      ]
    },
    {
      id: "item-103",
      name: "Salted Caramel Cold Foam Brew",
      nameAr: "كولد برو برغوة الكراميل المملح",
      categoryId: "cat-2",
      subcategoryId: "subcat-4",
      price: 135,
      costPrice: 38,
      discountValue: 25,
      discountType: 'fixed',
      prepTime: "3 mins",
      stockStatus: "in_stock",
      featured: true,
      rating: 4.91,
      reviewCount: 142,
      allergens: ["Milk"],
      description: "20-hour slow steeped cold brew topped with silky house-made salted caramel cloud foam and Maldon sea salt flakes.",
      imageUrl: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "item-104",
      name: "Pistachio Rose Croissant Supreme",
      nameAr: "كرواسون الفستق وماء الورد الفاخر",
      categoryId: "cat-4",
      subcategoryId: "subcat-8",
      price: 110,
      costPrice: 32,
      calories: 420,
      prepTime: "2 mins",
      stockStatus: "low_stock",
      stockCount: 6,
      featured: true,
      rating: 4.97,
      reviewCount: 210,
      allergens: ["Gluten", "Nuts", "Dairy", "Eggs"],
      description: "Flaky 100% French butter croissant filled with pure Sicilian pistachio cream, crushed pistachio praline, and rose petal infusion.",
      imageUrl: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "item-105",
      name: "Smoked Salmon & Truffle Sourdough",
      nameAr: "توست السلمون المدخن والكمأة",
      categoryId: "cat-5",
      subcategoryId: "subcat-10",
      price: 245,
      costPrice: 95,
      calories: 480,
      prepTime: "8 mins",
      stockStatus: "in_stock",
      stockCount: 28,
      featured: false,
      rating: 4.85,
      reviewCount: 78,
      allergens: ["Fish", "Gluten", "Dairy"],
      description: "Artisanal toasted sourdough bread, cream cheese mousse, Norwegian smoked salmon, capers, fresh dill, and white truffle glaze.",
      imageUrl: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "item-106",
      name: "Classic Velvet Cortado",
      nameAr: "كورتادو كلاسيك",
      categoryId: "cat-1",
      subcategoryId: "subcat-1",
      price: 95,
      costPrice: 22,
      calories: 75,
      prepTime: "3 mins",
      stockStatus: "in_stock",
      stockCount: 190,
      featured: false,
      rating: 4.79,
      reviewCount: 64,
      allergens: ["Milk"],
      description: "Equal parts double espresso ristretto and textured warm silky milk served in a heavy rocks glass.",
      imageUrl: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "item-107",
      name: "Burnt Basque Cheesecake Slice",
      nameAr: "تشيز كيك الباسك المحروق",
      categoryId: "cat-4",
      subcategoryId: "subcat-9",
      price: 130,
      costPrice: 40,
      calories: 520,
      prepTime: "2 mins",
      stockStatus: "in_stock",
      stockCount: 18,
      featured: true,
      rating: 4.94,
      reviewCount: 165,
      allergens: ["Dairy", "Eggs"],
      description: "Caramelized caramelized crust with a molten, ultra-creamy center infused with Madagascar vanilla bean.",
      imageUrl: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80"
    },
    {
      id: "item-108",
      name: "Iced Hibiscus Rose Refresher",
      nameAr: "كركديه مثلج بالورد والتوت",
      categoryId: "cat-6",
      subcategoryId: "subcat-5",
      price: 85,
      costPrice: 18,
      calories: 80,
      prepTime: "3 mins",
      stockStatus: "out_of_stock",
      stockCount: 0,
      featured: false,
      rating: 4.72,
      reviewCount: 45,
      allergens: [],
      description: "Egyptian organic hibiscus tea brewed with pomegranate pearls, elderflower syrup, and fresh crushed mint leaves.",
      imageUrl: "https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&w=600&q=80"
    }
  ],

  orders: [
    {
      id: "ORD-9082",
      orderNumber: "9082",
      customerName: "Dr. Tarek El-Kady",
      customerPhone: "+20 101 234 5678",
      customerEmail: "tarek.kady@hospital.eg",
      diningType: "Dine-in (Table #14)",
      tableNumber: "14",
      status: "Preparing", // Pending, Preparing, Ready, Completed, Cancelled
      paymentMethod: "Credit Card (Visa)",
      paymentStatus: "Paid",
      subtotal: 400,
      tax: 56,
      serviceFee: 48,
      discount: 0,
      totalPrice: 504,
      pointsEarned: 504,
      createdAt: "2026-08-22T17:28:10Z",
      estimatedReadyTime: "17:38",
      notes: "Please extra hot Spanish latte, oat milk on side.",
      items: [
        { id: "item-101", name: "90° Signature Gold Spanish Latte", quantity: 2, unitPrice: 145, customizations: ["Oat Milk (+25 EGP)", "Extra Hot"], totalPrice: 340 },
        { id: "item-106", name: "Classic Velvet Cortado", quantity: 1, unitPrice: 95, customizations: ["Double Ristretto"], totalPrice: 95 }
      ]
    },
    {
      id: "ORD-9081",
      orderNumber: "9081",
      customerName: "Laila Mostafa",
      customerPhone: "+20 114 887 9922",
      customerEmail: "laila.m@designdistrict.com",
      diningType: "Room Delivery (Boardroom 90)",
      tableNumber: "VIP-1",
      status: "Ready",
      paymentMethod: "Cafe 90 Points",
      paymentStatus: "Paid",
      subtotal: 585,
      tax: 81.9,
      serviceFee: 70.2,
      discount: 100, // Coupon
      couponCode: "VIPMEET",
      totalPrice: 637.1,
      pointsEarned: 637,
      createdAt: "2026-08-22T17:15:30Z",
      estimatedReadyTime: "17:25",
      notes: "Deliver quietly to Room 90 during meeting.",
      items: [
        { id: "item-104", name: "Pistachio Rose Croissant Supreme", quantity: 3, unitPrice: 110, totalPrice: 330 },
        { id: "item-102", name: "Ethiopian V60 Single Origin", quantity: 2, unitPrice: 120, totalPrice: 240 }
      ]
    },
    {
      id: "ORD-9080",
      orderNumber: "9080",
      customerName: "Youssef Mansour",
      customerPhone: "+20 122 345 6789",
      customerEmail: "youssef.mansour@gmail.com",
      diningType: "Takeaway",
      tableNumber: "-",
      status: "Pending",
      paymentMethod: "Apple Pay",
      paymentStatus: "Paid",
      subtotal: 245,
      tax: 34.3,
      serviceFee: 0,
      discount: 0,
      totalPrice: 279.3,
      pointsEarned: 279,
      createdAt: "2026-08-22T17:31:00Z",
      estimatedReadyTime: "17:40",
      notes: "Bag nicely for takeout, no plastic straws.",
      items: [
        { id: "item-105", name: "Smoked Salmon & Truffle Sourdough", quantity: 1, unitPrice: 245, totalPrice: 245 }
      ]
    },
    {
      id: "ORD-9079",
      orderNumber: "9079",
      customerName: "Nouran Al-Ghamry",
      customerPhone: "+20 109 776 5432",
      customerEmail: "nouran.gh@cairodev.co",
      diningType: "Dine-in (Table #04)",
      tableNumber: "04",
      status: "Completed",
      paymentMethod: "Cash on Counter",
      paymentStatus: "Paid",
      subtotal: 375,
      tax: 52.5,
      serviceFee: 45,
      discount: 37.5,
      couponCode: "CAFE90GOLD",
      totalPrice: 435,
      pointsEarned: 435,
      createdAt: "2026-08-22T16:45:00Z",
      estimatedReadyTime: "16:55",
      notes: "",
      items: [
        { id: "item-101", name: "90° Signature Gold Spanish Latte", quantity: 1, unitPrice: 145, totalPrice: 145 },
        { id: "item-107", name: "Burnt Basque Cheesecake Slice", quantity: 1, unitPrice: 130, totalPrice: 130 },
        { id: "item-103", name: "Salted Caramel Cold Foam Brew", quantity: 1, unitPrice: 135, totalPrice: 135 }
      ]
    },
    {
      id: "ORD-9078",
      orderNumber: "9078",
      customerName: "Karim Abdel-Rahman",
      customerPhone: "+20 100 112 3344",
      customerEmail: "karim.ar@investcairo.com",
      diningType: "Dine-in (Table #08)",
      tableNumber: "08",
      status: "Completed",
      paymentMethod: "Credit Card (Mastercard)",
      paymentStatus: "Paid",
      subtotal: 510,
      tax: 71.4,
      serviceFee: 61.2,
      discount: 0,
      totalPrice: 642.6,
      pointsEarned: 642,
      createdAt: "2026-08-22T16:10:00Z",
      notes: "Double check allergen info.",
      items: [
        { id: "item-102", name: "Ethiopian V60 Single Origin", quantity: 2, unitPrice: 120, totalPrice: 240 },
        { id: "item-107", name: "Burnt Basque Cheesecake Slice", quantity: 2, unitPrice: 130, totalPrice: 260 }
      ]
    },
    {
      id: "ORD-9077",
      orderNumber: "9077",
      customerName: "Farida Sami",
      customerPhone: "+20 111 990 0112",
      customerEmail: "farida.sami@fintech.eg",
      diningType: "Takeaway",
      tableNumber: "-",
      status: "Cancelled",
      paymentMethod: "Credit Card (Refunded)",
      paymentStatus: "Refunded",
      subtotal: 135,
      tax: 18.9,
      serviceFee: 0,
      discount: 0,
      totalPrice: 153.9,
      pointsEarned: 0,
      createdAt: "2026-08-22T15:20:00Z",
      notes: "Customer cancelled due to meeting delay.",
      items: [
        { id: "item-103", name: "Salted Caramel Cold Foam Brew", quantity: 1, unitPrice: 135, totalPrice: 135 }
      ]
    }
  ],

  pointsConfig: {
    pointsPerEgp: 1, // 1 EGP = 1 Point
    egpPer100Points: 10, // 100 Points = 10 EGP discount
    minRedeemPoints: 200, // Minimum 200 points to start redeeming
    welcomeBonusPoints: 150,
    pointExpiryDays: 365,
    autoEnrollNewUsers: true,
    tiers: [
      {
        id: "tier-silver",
        name: "Silver Bean",
        minPoints: 0,
        cashbackMultiplier: 1.0,
        perks: ["Earn 1 pt per 1 EGP", "Free birthday beverage", "Standard queue"],
        color: "#94A3B8"
      },
      {
        id: "tier-gold",
        name: "Gold Crema",
        minPoints: 2500,
        cashbackMultiplier: 1.5,
        perks: ["Earn 1.5x points", "15% off Meeting Room bookings", "Free syrup/milk upgrades", "Priority brewing queue"],
        color: "#D4A037"
      },
      {
        id: "tier-platinum",
        name: "90° Elite Black",
        minPoints: 8000,
        cashbackMultiplier: 2.0,
        perks: ["Earn 2.0x points", "Complimentary Room 90 booking 2 hrs/month", "Private barista tastings", "Dedicated VIP concierge"],
        color: "#1F1008"
      }
    ]
  },

  coupons: [
    {
      id: "cpn-1",
      code: "WELCOME90",
      discountType: "percentage", // percentage or fixed
      discountValue: 20,
      minOrderEgp: 150,
      maxDiscountEgp: 80,
      validFrom: "2026-01-01",
      validUntil: "2026-12-31",
      usageLimit: 1000,
      usedCount: 412,
      active: true,
      description: "20% off for first-time cafe guests"
    },
    {
      id: "cpn-2",
      code: "CAFE90GOLD",
      discountType: "percentage",
      discountValue: 15,
      minOrderEgp: 200,
      maxDiscountEgp: 100,
      validFrom: "2026-08-01",
      validUntil: "2026-09-30",
      usageLimit: 500,
      usedCount: 168,
      active: true,
      description: "Exclusive 15% discount for Gold members"
    },
    {
      id: "cpn-3",
      code: "VIPMEET",
      discountType: "fixed",
      discountValue: 100,
      minOrderEgp: 400,
      maxDiscountEgp: 100,
      validFrom: "2026-08-15",
      validUntil: "2026-11-30",
      usageLimit: 200,
      usedCount: 45,
      active: true,
      description: "100 EGP discount on meeting room food & beverage packages"
    },
    {
      id: "cpn-4",
      code: "MORNINGBREW",
      discountType: "percentage",
      discountValue: 25,
      minOrderEgp: 100,
      maxDiscountEgp: 50,
      validFrom: "2026-07-01",
      validUntil: "2026-08-31",
      usageLimit: 300,
      usedCount: 290,
      active: true,
      description: "Early bird special before 10:00 AM"
    }
  ],

  rooms: [
    {
      id: "room-1",
      name: "The Boardroom 90°",
      nameAr: "قاعة الاجتماعات 90 التنفيذية",
      capacity: 12,
      hourlyRate: 650,
      status: "available", // available, booked, maintenance
      description: "Luxury executive boardroom with acoustic panelling, 75-inch 4K screen, polycom conference audio, and dedicated butler barista.",
      imageUrl: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
      amenities: ["75-inch 4K Screen", "Acoustic Soundproofing", "Polycom Conference Call", "Dedicated Barista Butler", "Fiber Wi-Fi 6 (1 Gbps)", "Whiteboard & Marker Sets", "Unlimited Filtered Espresso"],
      currentBooking: null
    },
    {
      id: "room-2",
      name: "Executive Pod Alpha",
      nameAr: "كبسولة العمل ألفا",
      capacity: 4,
      hourlyRate: 350,
      status: "booked",
      description: "Intimate private glass cubicle tailored for confidential client negotiations and small mastermind sessions.",
      imageUrl: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
      amenities: ["55-inch Screen", "Smart Whiteboard", "Power Outlets with Fast USB-C PD", "Sound Dampening Glass", "Specialty Drip Station"],
      currentBooking: {
        clientName: "Apex Capital Egypt",
        timeSlot: "16:00 - 19:00",
        pax: 4
      }
    },
    {
      id: "room-3",
      name: "Creative Lounge & Studio",
      nameAr: "استوديو الإبداع والبودكاست",
      capacity: 8,
      hourlyRate: 500,
      status: "available",
      description: "Warm-lit relaxed setting with plush leather armchairs, podcast recording mic arms, and ambient acoustic isolation.",
      imageUrl: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
      amenities: ["Shure Podcast Microphones", "Warm Studio Lighting", "Bespoke Leather Seating", "High-speed Ethernet", "Artisan Coffee Barista Cart"],
      currentBooking: null
    },
    {
      id: "room-4",
      name: "Quiet Study Nook Beta",
      nameAr: "مساحة الدراسة الهادئة",
      capacity: 6,
      hourlyRate: 280,
      status: "maintenance",
      description: "Ultra quiet collaborative space with individual ergonomic desks, reading lamps, and direct power stations.",
      imageUrl: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
      amenities: ["Ergonomic Herman Miller Chairs", "Noise-Cancelling Acoustic Panels", "Direct Power Hubs", "Complimentary Water Station"],
      currentBooking: null
    }
  ],

  facilities: [
    {
      id: "fac-1",
      name: "High-Speed Fiber Wi-Fi 6",
      nameAr: "إنترنت فايبر فائق السرعة Wi-Fi 6",
      category: "Connectivity",
      categoryAr: "اتصال وشبكات",
      active: true,
      description: "1 Gbps redundant enterprise connection throughout all indoor & outdoor zones.",
      descriptionAr: "اتصال أعمال فايبر مخصص بسرعة 1 جيجابت يغطي كامل المساحات الداخلية والحديقة الخارجية."
    },
    {
      id: "fac-2",
      name: "Power Outlets at Every Seat",
      nameAr: "مقابس كهرباء وشحن سريع بكل طاولة",
      category: "Convenience",
      categoryAr: "راحة ومرافق",
      active: true,
      description: "Universal 220V plugs and 65W USB-C fast charging stations at all tables.",
      descriptionAr: "أفياش 220V عالمية ومنافذ شحن فائق السرعة USB-C 65W متوفرة عند كل مقعد وطاولة."
    },
    {
      id: "fac-3",
      name: "Valet Parking Service",
      nameAr: "خدمة صف السيارات (فاليه VIP)",
      category: "Guest Experience",
      categoryAr: "خدمة الضيوف",
      active: true,
      description: "Complimentary VIP valet parking for Cafe 90 patrons.",
      descriptionAr: "خدمة ركن وصف سيارات VIP مجانية لرواد وضيوف كافيه 90."
    },
    {
      id: "fac-4",
      name: "Outdoor Heated / Misted Garden",
      nameAr: "حديقة خارجية بتدفئة شتوية ورذاذ صيفي",
      category: "Ambience",
      categoryAr: "الأجواء",
      active: true,
      description: "Landscaped terrace with winter heaters and summer cooling mist.",
      descriptionAr: "تراس خارجي فاخر مجهز بدفايات شتوية ورذاذ تبريد منعش في الصيف."
    },
    {
      id: "fac-5",
      name: "Specialty Manual Brew Bar",
      nameAr: "بار القهوة المقطرة والمختصة لايف",
      category: "Coffee Craft",
      categoryAr: "صناعة القهوة",
      active: true,
      description: "Live siphon, V60, Chemex, and Aeropress brewing demonstrations.",
      descriptionAr: "محطة تحضير يدوي مباشرة لطرق V60 و Chemex و Siphon و Aeropress أمام الضيوف."
    },
    {
      id: "fac-6",
      name: "Pet Friendly Patio",
      nameAr: "منطقة ترحيبية بالحيوانات الأليفة",
      category: "Guest Experience",
      categoryAr: "خدمة الضيوف",
      active: true,
      description: "Designated outdoor garden area equipped with water bowls for pets.",
      descriptionAr: "مساحة خارجية مخصصة ومجهزة بأوعية مياه نظيفة للحيوانات الأليفة."
    },
    {
      id: "fac-7",
      name: "Wheelchair & Stroller Accessible",
      nameAr: "مسارات مهيأة للكراسي المتحركة وعربات الأطفال",
      category: "Accessibility",
      categoryAr: "سهولة الوصول",
      active: true,
      description: "Ramps and step-free entrance compliant with accessibility standards.",
      descriptionAr: "مداخل مستوية ومنحدرات مجهزة بالكامل وفق أعلى معايير سهولة الوصول."
    }
  ],

  reviews: [
    {
      id: "rev-1",
      customerName: "Eng. Ahmed Shawky",
      customerAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      date: "2026-08-21",
      orderRef: "ORD-9045",
      productName: "90° Signature Gold Spanish Latte",
      comment: "Undoubtedly the finest specialty coffee in New Cairo! The 24k gold leaf presentation is breathtaking and the espresso balance with velvet milk is flawless. Exceptional vibe for work.",
      status: "approved", // approved, pending, hidden
      sentiment: "Positive",
      adminReply: "Thank you Eng. Ahmed! Looking forward to welcoming you again at Cafe 90."
    },
    {
      id: "rev-2",
      customerName: "Salma Mansour",
      customerAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      date: "2026-08-20",
      orderRef: "ORD-9022",
      productName: "Pistachio Rose Croissant Supreme",
      comment: "The pistachio croissant is heavenly! Crisp layered pastry with overflowing fresh cream. Booked The Boardroom 90 yesterday for our board meeting, audio-visual gear worked effortlessly.",
      status: "approved",
      sentiment: "Positive",
      adminReply: null
    },
    {
      id: "rev-3",
      customerName: "Mohamed El-Shennawy",
      customerAvatar: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80",
      rating: 4,
      date: "2026-08-19",
      orderRef: "ORD-8991",
      productName: "Ethiopian V60 Single Origin",
      comment: "Very clean pour over notes. Service was a bit busy during Thursday evening peak but the baristas were extremely polite and professional.",
      status: "approved",
      sentiment: "Positive",
      adminReply: "We appreciate your kind feedback Mohamed! We are expanding our barista team during peak hours."
    },
    {
      id: "rev-4",
      customerName: "Rana Hegazy",
      customerAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
      rating: 5,
      date: "2026-08-18",
      orderRef: "ORD-8940",
      productName: "Burnt Basque Cheesecake",
      comment: "Best Basque cheesecake in Egypt! Melts right in your mouth. Love the loyalty points system too!",
      status: "approved",
      sentiment: "Positive",
      adminReply: null
    },
    {
      id: "rev-5",
      customerName: "Tamer Fahmy",
      customerAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      rating: 3,
      date: "2026-08-15",
      orderRef: "ORD-8874",
      productName: "Smoked Salmon Toast",
      comment: "Food quality is top tier, but parking was full when I arrived. Valet team helped quickly though.",
      status: "pending",
      sentiment: "Neutral",
      adminReply: null
    }
  ],

  adminUsers: [
    {
      id: "adm-1",
      name: "Tito (Admin)",
      email: "tito@cafe90egypt.com",
      role: "Super Admin", // Super Admin, Branch Manager, Head Barista, Cashier
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      status: "Active",
      phone: "+20 100 000 9001",
      lastLogin: "Just now",
      permissions: ["Full Access", "Financials", "Menu Management", "Room Bookings", "User Roles", "Settings"]
    },
    {
      id: "adm-2",
      name: "Omar El-Sayed",
      email: "omar.sayed@cafe90egypt.com",
      role: "Branch Manager",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      status: "Active",
      phone: "+20 111 222 3344",
      lastLogin: "2 hours ago",
      permissions: ["Orders", "Menu Management", "Facilities", "Customer Reviews"]
    },
    {
      id: "adm-3",
      name: "Dina Kassam",
      email: "dina.k@cafe90egypt.com",
      role: "Head Barista & Kitchen Lead",
      avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&q=80",
      status: "Active",
      phone: "+20 122 333 4455",
      lastLogin: "Yesterday at 20:30",
      permissions: ["Menu Stock", "Kitchen Display", "Orders Execution"]
    },
    {
      id: "adm-4",
      name: "Hazem Zaki",
      email: "hazem.z@cafe90egypt.com",
      role: "Cashier & Front Desk",
      avatarUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80",
      status: "Active",
      phone: "+20 109 888 7766",
      lastLogin: "3 days ago",
      permissions: ["Point of Sale", "Order Entry", "Customer Points Check"]
    }
  ],

  notifications: [
    {
      id: "notif-1",
      title: "New High-Value Order #ORD-9082",
      message: "Dr. Tarek placed a 504 EGP dine-in order with 2x Gold Spanish Lattes.",
      time: "2 mins ago",
      read: false,
      type: "order"
    },
    {
      id: "notif-2",
      title: "Low Stock Alert: Pistachio Croissants",
      message: "Only 6 units remaining in the bakery display.",
      time: "25 mins ago",
      read: false,
      type: "stock"
    },
    {
      id: "notif-3",
      title: "VIP Room 90° Reserved",
      message: "Apex Capital booked Executive Pod Alpha from 16:00 to 19:00.",
      time: "1 hour ago",
      read: true,
      type: "room"
    },
    {
      id: "notif-4",
      title: "New 5-Star Review",
      message: "Eng. Ahmed Shawky posted a glowing 5-star review for Signature Latte.",
      time: "3 hours ago",
      read: true,
      type: "review"
    }
  ]
};
