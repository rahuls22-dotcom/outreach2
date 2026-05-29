// targeting-options.ts
// Real Meta Ads detailed targeting taxonomy for Revspot MVP
// Structure: Type > Category > Subcategory > Options
// Replace with Meta Marketing API /targetingsearch endpoint data later

export interface TargetingOption {
  id: string;
  name: string;
  type: "interest" | "behavior" | "demographic";
  category: string;
  subcategory: string;
  audience_size_lower?: number; // approximate, for MVP display
  audience_size_upper?: number;
  description?: string;
}

export interface TargetingCategory {
  key: string;
  label: string;
  type: "interest" | "behavior" | "demographic";
  subcategories: {
    key: string;
    label: string;
    options: TargetingOption[];
  }[];
}

export const targetingTree: TargetingCategory[] = [
  // ═══════════════════════════════════════════
  // INTERESTS
  // ═══════════════════════════════════════════
  {
    key: "business_industry",
    label: "Business & Industry",
    type: "interest",
    subcategories: [
      {
        key: "real_estate",
        label: "Real Estate",
        options: [
          { id: "int_re_01", name: "Real estate", type: "interest", category: "Business & Industry", subcategory: "Real Estate", audience_size_lower: 200_000_000, audience_size_upper: 250_000_000 },
          { id: "int_re_02", name: "Real estate investing", type: "interest", category: "Business & Industry", subcategory: "Real Estate", audience_size_lower: 50_000_000, audience_size_upper: 60_000_000 },
          { id: "int_re_03", name: "Residential real estate", type: "interest", category: "Business & Industry", subcategory: "Real Estate", audience_size_lower: 30_000_000, audience_size_upper: 40_000_000 },
          { id: "int_re_04", name: "Commercial property", type: "interest", category: "Business & Industry", subcategory: "Real Estate", audience_size_lower: 15_000_000, audience_size_upper: 20_000_000 },
          { id: "int_re_05", name: "Property management", type: "interest", category: "Business & Industry", subcategory: "Real Estate", audience_size_lower: 10_000_000, audience_size_upper: 15_000_000 },
          { id: "int_re_06", name: "Renting", type: "interest", category: "Business & Industry", subcategory: "Real Estate", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_re_07", name: "Home buying", type: "interest", category: "Business & Industry", subcategory: "Real Estate", audience_size_lower: 40_000_000, audience_size_upper: 50_000_000 },
          { id: "int_re_08", name: "Apartment", type: "interest", category: "Business & Industry", subcategory: "Real Estate", audience_size_lower: 120_000_000, audience_size_upper: 150_000_000 },
        ],
      },
      {
        key: "construction",
        label: "Construction",
        options: [
          { id: "int_co_01", name: "Construction", type: "interest", category: "Business & Industry", subcategory: "Construction", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_co_02", name: "Architecture", type: "interest", category: "Business & Industry", subcategory: "Construction", audience_size_lower: 60_000_000, audience_size_upper: 70_000_000 },
          { id: "int_co_03", name: "Interior design", type: "interest", category: "Business & Industry", subcategory: "Construction", audience_size_lower: 90_000_000, audience_size_upper: 110_000_000 },
          { id: "int_co_04", name: "Home improvement", type: "interest", category: "Business & Industry", subcategory: "Construction", audience_size_lower: 150_000_000, audience_size_upper: 180_000_000 },
        ],
      },
      {
        key: "banking_finance",
        label: "Banking & Finance",
        options: [
          { id: "int_bf_01", name: "Investment", type: "interest", category: "Business & Industry", subcategory: "Banking & Finance", audience_size_lower: 100_000_000, audience_size_upper: 130_000_000 },
          { id: "int_bf_02", name: "Personal finance", type: "interest", category: "Business & Industry", subcategory: "Banking & Finance", audience_size_lower: 70_000_000, audience_size_upper: 90_000_000 },
          { id: "int_bf_03", name: "Mortgage loan", type: "interest", category: "Business & Industry", subcategory: "Banking & Finance", audience_size_lower: 30_000_000, audience_size_upper: 40_000_000 },
          { id: "int_bf_04", name: "Insurance", type: "interest", category: "Business & Industry", subcategory: "Banking & Finance", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_bf_05", name: "Mutual funds", type: "interest", category: "Business & Industry", subcategory: "Banking & Finance", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
          { id: "int_bf_06", name: "Stock market", type: "interest", category: "Business & Industry", subcategory: "Banking & Finance", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
        ],
      },
      {
        key: "entrepreneurship",
        label: "Entrepreneurship",
        options: [
          { id: "int_en_01", name: "Entrepreneurship", type: "interest", category: "Business & Industry", subcategory: "Entrepreneurship", audience_size_lower: 120_000_000, audience_size_upper: 150_000_000 },
          { id: "int_en_02", name: "Small business", type: "interest", category: "Business & Industry", subcategory: "Entrepreneurship", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_en_03", name: "Startups", type: "interest", category: "Business & Industry", subcategory: "Entrepreneurship", audience_size_lower: 40_000_000, audience_size_upper: 50_000_000 },
          { id: "int_en_04", name: "Business opportunities", type: "interest", category: "Business & Industry", subcategory: "Entrepreneurship", audience_size_lower: 60_000_000, audience_size_upper: 75_000_000 },
        ],
      },
      {
        key: "marketing_advertising",
        label: "Marketing & Advertising",
        options: [
          { id: "int_ma_01", name: "Digital marketing", type: "interest", category: "Business & Industry", subcategory: "Marketing & Advertising", audience_size_lower: 70_000_000, audience_size_upper: 90_000_000 },
          { id: "int_ma_02", name: "Online advertising", type: "interest", category: "Business & Industry", subcategory: "Marketing & Advertising", audience_size_lower: 50_000_000, audience_size_upper: 65_000_000 },
          { id: "int_ma_03", name: "Social media marketing", type: "interest", category: "Business & Industry", subcategory: "Marketing & Advertising", audience_size_lower: 60_000_000, audience_size_upper: 80_000_000 },
        ],
      },
    ],
  },
  {
    key: "technology",
    label: "Technology",
    type: "interest",
    subcategories: [
      {
        key: "computers",
        label: "Computers & Electronics",
        options: [
          { id: "int_te_01", name: "Smartphones", type: "interest", category: "Technology", subcategory: "Computers & Electronics", audience_size_lower: 500_000_000, audience_size_upper: 600_000_000 },
          { id: "int_te_02", name: "Laptops", type: "interest", category: "Technology", subcategory: "Computers & Electronics", audience_size_lower: 200_000_000, audience_size_upper: 250_000_000 },
          { id: "int_te_03", name: "Consumer electronics", type: "interest", category: "Technology", subcategory: "Computers & Electronics", audience_size_lower: 300_000_000, audience_size_upper: 350_000_000 },
          { id: "int_te_04", name: "Tablet computers", type: "interest", category: "Technology", subcategory: "Computers & Electronics", audience_size_lower: 100_000_000, audience_size_upper: 130_000_000 },
        ],
      },
      {
        key: "software",
        label: "Software",
        options: [
          { id: "int_sw_01", name: "Software", type: "interest", category: "Technology", subcategory: "Software", audience_size_lower: 150_000_000, audience_size_upper: 180_000_000 },
          { id: "int_sw_02", name: "Mobile apps", type: "interest", category: "Technology", subcategory: "Software", audience_size_lower: 200_000_000, audience_size_upper: 250_000_000 },
          { id: "int_sw_03", name: "SaaS (Software as a Service)", type: "interest", category: "Technology", subcategory: "Software", audience_size_lower: 15_000_000, audience_size_upper: 25_000_000 },
        ],
      },
    ],
  },
  {
    key: "shopping_fashion",
    label: "Shopping & Fashion",
    type: "interest",
    subcategories: [
      {
        key: "shopping",
        label: "Shopping",
        options: [
          { id: "int_sh_01", name: "Online shopping", type: "interest", category: "Shopping & Fashion", subcategory: "Shopping", audience_size_lower: 400_000_000, audience_size_upper: 500_000_000 },
          { id: "int_sh_02", name: "Luxury goods", type: "interest", category: "Shopping & Fashion", subcategory: "Shopping", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_sh_03", name: "Coupons", type: "interest", category: "Shopping & Fashion", subcategory: "Shopping", audience_size_lower: 100_000_000, audience_size_upper: 130_000_000 },
          { id: "int_sh_04", name: "Boutiques", type: "interest", category: "Shopping & Fashion", subcategory: "Shopping", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
        ],
      },
      {
        key: "fashion",
        label: "Fashion & Apparel",
        options: [
          { id: "int_fa_01", name: "Fashion", type: "interest", category: "Shopping & Fashion", subcategory: "Fashion & Apparel", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "int_fa_02", name: "Fashion accessories", type: "interest", category: "Shopping & Fashion", subcategory: "Fashion & Apparel", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "int_fa_03", name: "Jewelry", type: "interest", category: "Shopping & Fashion", subcategory: "Fashion & Apparel", audience_size_lower: 100_000_000, audience_size_upper: 130_000_000 },
        ],
      },
    ],
  },
  {
    key: "fitness_wellness",
    label: "Fitness & Wellness",
    type: "interest",
    subcategories: [
      {
        key: "fitness",
        label: "Fitness",
        options: [
          { id: "int_fi_01", name: "Physical fitness", type: "interest", category: "Fitness & Wellness", subcategory: "Fitness", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "int_fi_02", name: "Yoga", type: "interest", category: "Fitness & Wellness", subcategory: "Fitness", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "int_fi_03", name: "Gym", type: "interest", category: "Fitness & Wellness", subcategory: "Fitness", audience_size_lower: 200_000_000, audience_size_upper: 250_000_000 },
          { id: "int_fi_04", name: "Running", type: "interest", category: "Fitness & Wellness", subcategory: "Fitness", audience_size_lower: 120_000_000, audience_size_upper: 150_000_000 },
          { id: "int_fi_05", name: "Weight training", type: "interest", category: "Fitness & Wellness", subcategory: "Fitness", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
        ],
      },
      {
        key: "wellness",
        label: "Wellness",
        options: [
          { id: "int_we_01", name: "Nutrition", type: "interest", category: "Fitness & Wellness", subcategory: "Wellness", audience_size_lower: 100_000_000, audience_size_upper: 130_000_000 },
          { id: "int_we_02", name: "Meditation", type: "interest", category: "Fitness & Wellness", subcategory: "Wellness", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_we_03", name: "Organic food", type: "interest", category: "Fitness & Wellness", subcategory: "Wellness", audience_size_lower: 60_000_000, audience_size_upper: 80_000_000 },
          { id: "int_we_04", name: "Weight loss", type: "interest", category: "Fitness & Wellness", subcategory: "Wellness", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
        ],
      },
    ],
  },
  {
    key: "entertainment",
    label: "Entertainment",
    type: "interest",
    subcategories: [
      {
        key: "music",
        label: "Music",
        options: [
          { id: "int_mu_01", name: "Music", type: "interest", category: "Entertainment", subcategory: "Music", audience_size_lower: 500_000_000, audience_size_upper: 600_000_000 },
          { id: "int_mu_02", name: "Live concerts", type: "interest", category: "Entertainment", subcategory: "Music", audience_size_lower: 100_000_000, audience_size_upper: 130_000_000 },
          { id: "int_mu_03", name: "Bollywood music", type: "interest", category: "Entertainment", subcategory: "Music", audience_size_lower: 50_000_000, audience_size_upper: 70_000_000 },
        ],
      },
      {
        key: "movies_tv",
        label: "Movies & Television",
        options: [
          { id: "int_mv_01", name: "Movies", type: "interest", category: "Entertainment", subcategory: "Movies & Television", audience_size_lower: 400_000_000, audience_size_upper: 500_000_000 },
          { id: "int_mv_02", name: "Television", type: "interest", category: "Entertainment", subcategory: "Movies & Television", audience_size_lower: 350_000_000, audience_size_upper: 450_000_000 },
          { id: "int_mv_03", name: "Streaming services", type: "interest", category: "Entertainment", subcategory: "Movies & Television", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
        ],
      },
      {
        key: "gaming",
        label: "Gaming",
        options: [
          { id: "int_ga_01", name: "Video games", type: "interest", category: "Entertainment", subcategory: "Gaming", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "int_ga_02", name: "Mobile gaming", type: "interest", category: "Entertainment", subcategory: "Gaming", audience_size_lower: 200_000_000, audience_size_upper: 280_000_000 },
          { id: "int_ga_03", name: "Online gaming", type: "interest", category: "Entertainment", subcategory: "Gaming", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
        ],
      },
    ],
  },
  {
    key: "food_drink",
    label: "Food & Drink",
    type: "interest",
    subcategories: [
      {
        key: "food",
        label: "Food",
        options: [
          { id: "int_fo_01", name: "Cooking", type: "interest", category: "Food & Drink", subcategory: "Food", audience_size_lower: 200_000_000, audience_size_upper: 280_000_000 },
          { id: "int_fo_02", name: "Restaurants", type: "interest", category: "Food & Drink", subcategory: "Food", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "int_fo_03", name: "Fast food", type: "interest", category: "Food & Drink", subcategory: "Food", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "int_fo_04", name: "Vegetarianism", type: "interest", category: "Food & Drink", subcategory: "Food", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
        ],
      },
      {
        key: "beverages",
        label: "Beverages",
        options: [
          { id: "int_bv_01", name: "Coffee", type: "interest", category: "Food & Drink", subcategory: "Beverages", audience_size_lower: 200_000_000, audience_size_upper: 260_000_000 },
          { id: "int_bv_02", name: "Tea", type: "interest", category: "Food & Drink", subcategory: "Beverages", audience_size_lower: 100_000_000, audience_size_upper: 140_000_000 },
          { id: "int_bv_03", name: "Wine", type: "interest", category: "Food & Drink", subcategory: "Beverages", audience_size_lower: 80_000_000, audience_size_upper: 110_000_000 },
        ],
      },
    ],
  },
  {
    key: "hobbies_activities",
    label: "Hobbies & Activities",
    type: "interest",
    subcategories: [
      {
        key: "travel",
        label: "Travel",
        options: [
          { id: "int_tr_01", name: "Travel", type: "interest", category: "Hobbies & Activities", subcategory: "Travel", audience_size_lower: 400_000_000, audience_size_upper: 500_000_000 },
          { id: "int_tr_02", name: "Adventure travel", type: "interest", category: "Hobbies & Activities", subcategory: "Travel", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_tr_03", name: "Air travel", type: "interest", category: "Hobbies & Activities", subcategory: "Travel", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "int_tr_04", name: "Domestic travel", type: "interest", category: "Hobbies & Activities", subcategory: "Travel", audience_size_lower: 60_000_000, audience_size_upper: 80_000_000 },
        ],
      },
      {
        key: "vehicles",
        label: "Vehicles",
        options: [
          { id: "int_ve_01", name: "Automobiles", type: "interest", category: "Hobbies & Activities", subcategory: "Vehicles", audience_size_lower: 250_000_000, audience_size_upper: 320_000_000 },
          { id: "int_ve_02", name: "SUVs", type: "interest", category: "Hobbies & Activities", subcategory: "Vehicles", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_ve_03", name: "Electric vehicles", type: "interest", category: "Hobbies & Activities", subcategory: "Vehicles", audience_size_lower: 30_000_000, audience_size_upper: 45_000_000 },
          { id: "int_ve_04", name: "Luxury vehicles", type: "interest", category: "Hobbies & Activities", subcategory: "Vehicles", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
        ],
      },
      {
        key: "home_garden",
        label: "Home & Garden",
        options: [
          { id: "int_hg_01", name: "Home decor", type: "interest", category: "Hobbies & Activities", subcategory: "Home & Garden", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "int_hg_02", name: "Furniture", type: "interest", category: "Hobbies & Activities", subcategory: "Home & Garden", audience_size_lower: 100_000_000, audience_size_upper: 140_000_000 },
          { id: "int_hg_03", name: "Gardening", type: "interest", category: "Hobbies & Activities", subcategory: "Home & Garden", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_hg_04", name: "DIY (Do it yourself)", type: "interest", category: "Hobbies & Activities", subcategory: "Home & Garden", audience_size_lower: 120_000_000, audience_size_upper: 160_000_000 },
          { id: "int_hg_05", name: "Smart home", type: "interest", category: "Hobbies & Activities", subcategory: "Home & Garden", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
        ],
      },
    ],
  },
  {
    key: "family_relationships",
    label: "Family & Relationships",
    type: "interest",
    subcategories: [
      {
        key: "family",
        label: "Family",
        options: [
          { id: "int_fm_01", name: "Family", type: "interest", category: "Family & Relationships", subcategory: "Family", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "int_fm_02", name: "Parenting", type: "interest", category: "Family & Relationships", subcategory: "Family", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "int_fm_03", name: "Motherhood", type: "interest", category: "Family & Relationships", subcategory: "Family", audience_size_lower: 100_000_000, audience_size_upper: 130_000_000 },
          { id: "int_fm_04", name: "Fatherhood", type: "interest", category: "Family & Relationships", subcategory: "Family", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
          { id: "int_fm_05", name: "Marriage", type: "interest", category: "Family & Relationships", subcategory: "Family", audience_size_lower: 100_000_000, audience_size_upper: 130_000_000 },
          { id: "int_fm_06", name: "Weddings", type: "interest", category: "Family & Relationships", subcategory: "Family", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
        ],
      },
      {
        key: "education_children",
        label: "Children's Education",
        options: [
          { id: "int_ce_01", name: "Early childhood education", type: "interest", category: "Family & Relationships", subcategory: "Children's Education", audience_size_lower: 30_000_000, audience_size_upper: 45_000_000 },
          { id: "int_ce_02", name: "Private schools", type: "interest", category: "Family & Relationships", subcategory: "Children's Education", audience_size_lower: 15_000_000, audience_size_upper: 25_000_000 },
        ],
      },
    ],
  },
  {
    key: "sports_outdoors",
    label: "Sports & Outdoors",
    type: "interest",
    subcategories: [
      {
        key: "sports",
        label: "Sports",
        options: [
          { id: "int_sp_01", name: "Cricket", type: "interest", category: "Sports & Outdoors", subcategory: "Sports", audience_size_lower: 200_000_000, audience_size_upper: 280_000_000 },
          { id: "int_sp_02", name: "Football (Soccer)", type: "interest", category: "Sports & Outdoors", subcategory: "Sports", audience_size_lower: 400_000_000, audience_size_upper: 500_000_000 },
          { id: "int_sp_03", name: "Tennis", type: "interest", category: "Sports & Outdoors", subcategory: "Sports", audience_size_lower: 100_000_000, audience_size_upper: 130_000_000 },
          { id: "int_sp_04", name: "Golf", type: "interest", category: "Sports & Outdoors", subcategory: "Sports", audience_size_lower: 50_000_000, audience_size_upper: 70_000_000 },
        ],
      },
      {
        key: "outdoor_recreation",
        label: "Outdoor Recreation",
        options: [
          { id: "int_or_01", name: "Outdoor recreation", type: "interest", category: "Sports & Outdoors", subcategory: "Outdoor Recreation", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "int_or_02", name: "Hiking", type: "interest", category: "Sports & Outdoors", subcategory: "Outdoor Recreation", audience_size_lower: 60_000_000, audience_size_upper: 80_000_000 },
          { id: "int_or_03", name: "Camping", type: "interest", category: "Sports & Outdoors", subcategory: "Outdoor Recreation", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
        ],
      },
    ],
  },
  {
    key: "education",
    label: "Education",
    type: "interest",
    subcategories: [
      {
        key: "higher_education",
        label: "Higher Education",
        options: [
          { id: "int_ed_01", name: "Higher education", type: "interest", category: "Education", subcategory: "Higher Education", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "int_ed_02", name: "MBA", type: "interest", category: "Education", subcategory: "Higher Education", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
          { id: "int_ed_03", name: "Online education", type: "interest", category: "Education", subcategory: "Higher Education", audience_size_lower: 60_000_000, audience_size_upper: 80_000_000 },
          { id: "int_ed_04", name: "Study abroad", type: "interest", category: "Education", subcategory: "Higher Education", audience_size_lower: 25_000_000, audience_size_upper: 35_000_000 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // BEHAVIORS
  // ═══════════════════════════════════════════
  {
    key: "digital_activities",
    label: "Digital Activities",
    type: "behavior",
    subcategories: [
      {
        key: "device_usage",
        label: "Device Usage",
        options: [
          { id: "beh_du_01", name: "Facebook access (mobile): all mobile devices", type: "behavior", category: "Digital Activities", subcategory: "Device Usage", audience_size_lower: 1_000_000_000, audience_size_upper: 1_500_000_000 },
          { id: "beh_du_02", name: "Facebook access: older devices and OS", type: "behavior", category: "Digital Activities", subcategory: "Device Usage", audience_size_lower: 200_000_000, audience_size_upper: 300_000_000 },
          { id: "beh_du_03", name: "Facebook Payments users", type: "behavior", category: "Digital Activities", subcategory: "Device Usage", audience_size_lower: 50_000_000, audience_size_upper: 80_000_000 },
          { id: "beh_du_04", name: "Canvas gaming", type: "behavior", category: "Digital Activities", subcategory: "Device Usage", audience_size_lower: 30_000_000, audience_size_upper: 50_000_000 },
          { id: "beh_du_05", name: "Facebook page admins", type: "behavior", category: "Digital Activities", subcategory: "Device Usage", audience_size_lower: 60_000_000, audience_size_upper: 80_000_000 },
          { id: "beh_du_06", name: "Internet browser used: Chrome", type: "behavior", category: "Digital Activities", subcategory: "Device Usage", audience_size_lower: 600_000_000, audience_size_upper: 800_000_000 },
          { id: "beh_du_07", name: "Internet browser used: Safari", type: "behavior", category: "Digital Activities", subcategory: "Device Usage", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "beh_du_08", name: "Operating system used: iOS", type: "behavior", category: "Digital Activities", subcategory: "Device Usage", audience_size_lower: 400_000_000, audience_size_upper: 500_000_000 },
          { id: "beh_du_09", name: "Operating system used: Android", type: "behavior", category: "Digital Activities", subcategory: "Device Usage", audience_size_lower: 800_000_000, audience_size_upper: 1_000_000_000 },
        ],
      },
      {
        key: "online_spenders",
        label: "Online Spenders",
        options: [
          { id: "beh_os_01", name: "Engaged shoppers", type: "behavior", category: "Digital Activities", subcategory: "Online Spenders", audience_size_lower: 200_000_000, audience_size_upper: 300_000_000 },
        ],
      },
    ],
  },
  {
    key: "purchase_behavior",
    label: "Purchase Behavior",
    type: "behavior",
    subcategories: [
      {
        key: "purchase_types",
        label: "Purchase Types",
        options: [
          { id: "beh_pb_01", name: "Engaged shoppers", type: "behavior", category: "Purchase Behavior", subcategory: "Purchase Types", audience_size_lower: 200_000_000, audience_size_upper: 300_000_000 },
        ],
      },
    ],
  },
  {
    key: "travel_behavior",
    label: "Travel",
    type: "behavior",
    subcategories: [
      {
        key: "travel_patterns",
        label: "Travel Patterns",
        options: [
          { id: "beh_tv_01", name: "Frequent travelers", type: "behavior", category: "Travel", subcategory: "Travel Patterns", audience_size_lower: 100_000_000, audience_size_upper: 150_000_000 },
          { id: "beh_tv_02", name: "Frequent international travelers", type: "behavior", category: "Travel", subcategory: "Travel Patterns", audience_size_lower: 50_000_000, audience_size_upper: 70_000_000 },
          { id: "beh_tv_03", name: "Returned from travel 1 week ago", type: "behavior", category: "Travel", subcategory: "Travel Patterns", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
          { id: "beh_tv_04", name: "Commuters", type: "behavior", category: "Travel", subcategory: "Travel Patterns", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "beh_tv_05", name: "Currently traveling", type: "behavior", category: "Travel", subcategory: "Travel Patterns", audience_size_lower: 10_000_000, audience_size_upper: 20_000_000 },
        ],
      },
    ],
  },
  {
    key: "mobile_device_user",
    label: "Mobile Device User",
    type: "behavior",
    subcategories: [
      {
        key: "device_brand",
        label: "By Device Brand",
        options: [
          { id: "beh_md_01", name: "Apple (iPhone)", type: "behavior", category: "Mobile Device User", subcategory: "By Device Brand", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "beh_md_02", name: "Samsung", type: "behavior", category: "Mobile Device User", subcategory: "By Device Brand", audience_size_lower: 400_000_000, audience_size_upper: 500_000_000 },
          { id: "beh_md_03", name: "Xiaomi", type: "behavior", category: "Mobile Device User", subcategory: "By Device Brand", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "beh_md_04", name: "OnePlus", type: "behavior", category: "Mobile Device User", subcategory: "By Device Brand", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
          { id: "beh_md_05", name: "Oppo", type: "behavior", category: "Mobile Device User", subcategory: "By Device Brand", audience_size_lower: 80_000_000, audience_size_upper: 120_000_000 },
          { id: "beh_md_06", name: "Vivo", type: "behavior", category: "Mobile Device User", subcategory: "By Device Brand", audience_size_lower: 80_000_000, audience_size_upper: 110_000_000 },
        ],
      },
      {
        key: "network",
        label: "By Network Connection",
        options: [
          { id: "beh_mn_01", name: "Wi-Fi", type: "behavior", category: "Mobile Device User", subcategory: "By Network Connection", audience_size_lower: 500_000_000, audience_size_upper: 700_000_000 },
          { id: "beh_mn_02", name: "4G", type: "behavior", category: "Mobile Device User", subcategory: "By Network Connection", audience_size_lower: 800_000_000, audience_size_upper: 1_000_000_000 },
          { id: "beh_mn_03", name: "3G", type: "behavior", category: "Mobile Device User", subcategory: "By Network Connection", audience_size_lower: 200_000_000, audience_size_upper: 300_000_000 },
        ],
      },
    ],
  },
  {
    key: "expats",
    label: "Expats",
    type: "behavior",
    subcategories: [
      {
        key: "expat_groups",
        label: "Expat Groups",
        options: [
          { id: "beh_ex_01", name: "Expats (India)", type: "behavior", category: "Expats", subcategory: "Expat Groups", audience_size_lower: 15_000_000, audience_size_upper: 25_000_000 },
          { id: "beh_ex_02", name: "Expats (United States)", type: "behavior", category: "Expats", subcategory: "Expat Groups", audience_size_lower: 5_000_000, audience_size_upper: 10_000_000 },
          { id: "beh_ex_03", name: "Expats (United Kingdom)", type: "behavior", category: "Expats", subcategory: "Expat Groups", audience_size_lower: 3_000_000, audience_size_upper: 6_000_000 },
          { id: "beh_ex_04", name: "Expats (UAE)", type: "behavior", category: "Expats", subcategory: "Expat Groups", audience_size_lower: 5_000_000, audience_size_upper: 8_000_000 },
          { id: "beh_ex_05", name: "Expats (All)", type: "behavior", category: "Expats", subcategory: "Expat Groups", audience_size_lower: 60_000_000, audience_size_upper: 80_000_000 },
        ],
      },
    ],
  },

  // ═══════════════════════════════════════════
  // DEMOGRAPHICS
  // ═══════════════════════════════════════════
  {
    key: "education_level",
    label: "Education",
    type: "demographic",
    subcategories: [
      {
        key: "edu_level",
        label: "Education Level",
        options: [
          { id: "dem_el_01", name: "High school graduate", type: "demographic", category: "Education", subcategory: "Education Level", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "dem_el_02", name: "College graduate", type: "demographic", category: "Education", subcategory: "Education Level", audience_size_lower: 200_000_000, audience_size_upper: 280_000_000 },
          { id: "dem_el_03", name: "Some college", type: "demographic", category: "Education", subcategory: "Education Level", audience_size_lower: 150_000_000, audience_size_upper: 200_000_000 },
          { id: "dem_el_04", name: "Master's degree", type: "demographic", category: "Education", subcategory: "Education Level", audience_size_lower: 50_000_000, audience_size_upper: 70_000_000 },
          { id: "dem_el_05", name: "Doctorate degree", type: "demographic", category: "Education", subcategory: "Education Level", audience_size_lower: 10_000_000, audience_size_upper: 15_000_000 },
          { id: "dem_el_06", name: "Professional degree", type: "demographic", category: "Education", subcategory: "Education Level", audience_size_lower: 15_000_000, audience_size_upper: 25_000_000 },
          { id: "dem_el_07", name: "In college", type: "demographic", category: "Education", subcategory: "Education Level", audience_size_lower: 80_000_000, audience_size_upper: 100_000_000 },
          { id: "dem_el_08", name: "In graduate school", type: "demographic", category: "Education", subcategory: "Education Level", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
        ],
      },
    ],
  },
  {
    key: "financial",
    label: "Financial",
    type: "demographic",
    subcategories: [
      {
        key: "income",
        label: "Income",
        options: [
          { id: "dem_in_01", name: "Household income: top 5%", type: "demographic", category: "Financial", subcategory: "Income", audience_size_lower: 10_000_000, audience_size_upper: 20_000_000, description: "Available in select countries" },
          { id: "dem_in_02", name: "Household income: top 10%", type: "demographic", category: "Financial", subcategory: "Income", audience_size_lower: 20_000_000, audience_size_upper: 35_000_000, description: "Available in select countries" },
          { id: "dem_in_03", name: "Household income: top 25%", type: "demographic", category: "Financial", subcategory: "Income", audience_size_lower: 40_000_000, audience_size_upper: 60_000_000, description: "Available in select countries" },
          { id: "dem_in_04", name: "Household income: top 50%", type: "demographic", category: "Financial", subcategory: "Income", audience_size_lower: 80_000_000, audience_size_upper: 110_000_000, description: "Available in select countries" },
        ],
      },
      {
        key: "net_worth",
        label: "Net Worth",
        options: [
          { id: "dem_nw_01", name: "Liquid assets: high", type: "demographic", category: "Financial", subcategory: "Net Worth", audience_size_lower: 15_000_000, audience_size_upper: 25_000_000, description: "Available in select countries" },
        ],
      },
    ],
  },
  {
    key: "life_events",
    label: "Life Events",
    type: "demographic",
    subcategories: [
      {
        key: "life_milestones",
        label: "Life Milestones",
        options: [
          { id: "dem_le_01", name: "Recently moved", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 30_000_000, audience_size_upper: 50_000_000 },
          { id: "dem_le_02", name: "Away from family", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 50_000_000, audience_size_upper: 70_000_000 },
          { id: "dem_le_03", name: "Away from hometown", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 60_000_000, audience_size_upper: 80_000_000 },
          { id: "dem_le_04", name: "Newly engaged (6 months)", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 10_000_000, audience_size_upper: 15_000_000 },
          { id: "dem_le_05", name: "Newly engaged (1 year)", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 15_000_000, audience_size_upper: 25_000_000 },
          { id: "dem_le_06", name: "Newlywed (6 months)", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 8_000_000, audience_size_upper: 12_000_000 },
          { id: "dem_le_07", name: "Newlywed (1 year)", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 12_000_000, audience_size_upper: 20_000_000 },
          { id: "dem_le_08", name: "New job", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
          { id: "dem_le_09", name: "Anniversary within 30 days", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 10_000_000, audience_size_upper: 18_000_000 },
          { id: "dem_le_10", name: "Birthday in 1 month", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 40_000_000, audience_size_upper: 60_000_000 },
          { id: "dem_le_11", name: "Close friends of people with birthdays", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 100_000_000, audience_size_upper: 150_000_000 },
          { id: "dem_le_12", name: "New parents (0-12 months)", type: "demographic", category: "Life Events", subcategory: "Life Milestones", audience_size_lower: 20_000_000, audience_size_upper: 35_000_000 },
        ],
      },
    ],
  },
  {
    key: "relationship",
    label: "Relationship",
    type: "demographic",
    subcategories: [
      {
        key: "relationship_status",
        label: "Relationship Status",
        options: [
          { id: "dem_rs_01", name: "Single", type: "demographic", category: "Relationship", subcategory: "Relationship Status", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "dem_rs_02", name: "In a relationship", type: "demographic", category: "Relationship", subcategory: "Relationship Status", audience_size_lower: 200_000_000, audience_size_upper: 280_000_000 },
          { id: "dem_rs_03", name: "Married", type: "demographic", category: "Relationship", subcategory: "Relationship Status", audience_size_lower: 300_000_000, audience_size_upper: 400_000_000 },
          { id: "dem_rs_04", name: "Engaged", type: "demographic", category: "Relationship", subcategory: "Relationship Status", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
        ],
      },
    ],
  },
  {
    key: "parents",
    label: "Parents",
    type: "demographic",
    subcategories: [
      {
        key: "parent_type",
        label: "Parent Type",
        options: [
          { id: "dem_pt_01", name: "All parents", type: "demographic", category: "Parents", subcategory: "Parent Type", audience_size_lower: 200_000_000, audience_size_upper: 300_000_000 },
          { id: "dem_pt_02", name: "Parents with toddlers (01-02 years)", type: "demographic", category: "Parents", subcategory: "Parent Type", audience_size_lower: 30_000_000, audience_size_upper: 45_000_000 },
          { id: "dem_pt_03", name: "Parents with preschoolers (03-05 years)", type: "demographic", category: "Parents", subcategory: "Parent Type", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
          { id: "dem_pt_04", name: "Parents with early school age children (06-08 years)", type: "demographic", category: "Parents", subcategory: "Parent Type", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
          { id: "dem_pt_05", name: "Parents with preteens (09-12 years)", type: "demographic", category: "Parents", subcategory: "Parent Type", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
          { id: "dem_pt_06", name: "Parents with teenagers (13-17 years)", type: "demographic", category: "Parents", subcategory: "Parent Type", audience_size_lower: 50_000_000, audience_size_upper: 65_000_000 },
          { id: "dem_pt_07", name: "Parents with adult children (18-26 years)", type: "demographic", category: "Parents", subcategory: "Parent Type", audience_size_lower: 60_000_000, audience_size_upper: 80_000_000 },
        ],
      },
    ],
  },
  {
    key: "work",
    label: "Work",
    type: "demographic",
    subcategories: [
      {
        key: "industries",
        label: "Industries",
        options: [
          { id: "dem_wi_01", name: "IT and Technical Services", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 40_000_000, audience_size_upper: 55_000_000 },
          { id: "dem_wi_02", name: "Management", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 30_000_000, audience_size_upper: 45_000_000 },
          { id: "dem_wi_03", name: "Sales", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 30_000_000, audience_size_upper: 40_000_000 },
          { id: "dem_wi_04", name: "Healthcare and Medical Services", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 25_000_000, audience_size_upper: 35_000_000 },
          { id: "dem_wi_05", name: "Science, Engineering and Technical", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
          { id: "dem_wi_06", name: "Education and Library", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 25_000_000, audience_size_upper: 35_000_000 },
          { id: "dem_wi_07", name: "Administrative Services", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
          { id: "dem_wi_08", name: "Financial Services", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 15_000_000, audience_size_upper: 25_000_000 },
          { id: "dem_wi_09", name: "Legal Services", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 8_000_000, audience_size_upper: 12_000_000 },
          { id: "dem_wi_10", name: "Architecture and Engineering", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 8_000_000, audience_size_upper: 12_000_000 },
          { id: "dem_wi_11", name: "Business and Finance", type: "demographic", category: "Work", subcategory: "Industries", audience_size_lower: 20_000_000, audience_size_upper: 30_000_000 },
        ],
      },
      {
        key: "job_titles",
        label: "Job Titles",
        options: [
          { id: "dem_jt_01", name: "Business owners", type: "demographic", category: "Work", subcategory: "Job Titles", audience_size_lower: 15_000_000, audience_size_upper: 25_000_000 },
          { id: "dem_jt_02", name: "Director", type: "demographic", category: "Work", subcategory: "Job Titles", audience_size_lower: 10_000_000, audience_size_upper: 15_000_000 },
          { id: "dem_jt_03", name: "CEO", type: "demographic", category: "Work", subcategory: "Job Titles", audience_size_lower: 5_000_000, audience_size_upper: 8_000_000 },
          { id: "dem_jt_04", name: "Founder", type: "demographic", category: "Work", subcategory: "Job Titles", audience_size_lower: 8_000_000, audience_size_upper: 12_000_000 },
          { id: "dem_jt_05", name: "Manager", type: "demographic", category: "Work", subcategory: "Job Titles", audience_size_lower: 30_000_000, audience_size_upper: 40_000_000 },
          { id: "dem_jt_06", name: "Engineer", type: "demographic", category: "Work", subcategory: "Job Titles", audience_size_lower: 15_000_000, audience_size_upper: 25_000_000 },
          { id: "dem_jt_07", name: "Software developer", type: "demographic", category: "Work", subcategory: "Job Titles", audience_size_lower: 10_000_000, audience_size_upper: 15_000_000 },
          { id: "dem_jt_08", name: "Doctor", type: "demographic", category: "Work", subcategory: "Job Titles", audience_size_lower: 8_000_000, audience_size_upper: 12_000_000 },
          { id: "dem_jt_09", name: "Consultant", type: "demographic", category: "Work", subcategory: "Job Titles", audience_size_lower: 10_000_000, audience_size_upper: 15_000_000 },
        ],
      },
    ],
  },
  {
    key: "home_ownership",
    label: "Home",
    type: "demographic",
    subcategories: [
      {
        key: "home_type",
        label: "Home Ownership",
        options: [
          { id: "dem_ho_01", name: "Homeowners", type: "demographic", category: "Home", subcategory: "Home Ownership", audience_size_lower: 100_000_000, audience_size_upper: 150_000_000, description: "Available in select countries" },
          { id: "dem_ho_02", name: "Renters", type: "demographic", category: "Home", subcategory: "Home Ownership", audience_size_lower: 80_000_000, audience_size_upper: 120_000_000, description: "Available in select countries" },
          { id: "dem_ho_03", name: "First-time homebuyers", type: "demographic", category: "Home", subcategory: "Home Ownership", audience_size_lower: 10_000_000, audience_size_upper: 20_000_000, description: "Available in select countries" },
        ],
      },
      {
        key: "home_value",
        label: "Home Value",
        options: [
          { id: "dem_hv_01", name: "Home value: high", type: "demographic", category: "Home", subcategory: "Home Value", audience_size_lower: 20_000_000, audience_size_upper: 35_000_000, description: "Available in select countries" },
          { id: "dem_hv_02", name: "Home value: medium", type: "demographic", category: "Home", subcategory: "Home Value", audience_size_lower: 40_000_000, audience_size_upper: 60_000_000, description: "Available in select countries" },
        ],
      },
    ],
  },
];

// ═══════════════════════════════════════════
// Helper utilities
// ═══════════════════════════════════════════

/**
 * Flat array of all targeting options for search
 */
export const allTargetingOptions: TargetingOption[] = targetingTree.flatMap(
  (category) =>
    category.subcategories.flatMap((subcategory) => subcategory.options)
);

/**
 * Search targeting options by name (case-insensitive)
 */
export function searchTargetingOptions(
  query: string,
  limit: number = 20
): TargetingOption[] {
  const lowerQuery = query.toLowerCase();
  return allTargetingOptions
    .filter((option) => option.name.toLowerCase().includes(lowerQuery))
    .slice(0, limit);
}

/**
 * Get options grouped by type for the browse UI
 */
export function getOptionsByType(type: "interest" | "behavior" | "demographic") {
  return targetingTree.filter((category) => category.type === type);
}

/**
 * Format audience size for display (e.g., "50M - 60M")
 */
export function formatAudienceSize(lower?: number, upper?: number): string {
  if (!lower || !upper) return "—";
  const format = (n: number) => {
    if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(0)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toString();
  };
  return `${format(lower)} – ${format(upper)}`;
}

/**
 * Targeting selection state shape
 */
export interface TargetingSelection {
  included: TargetingOption[];
  excluded: TargetingOption[];
  narrowing_groups: TargetingOption[][]; // AND groups for "Narrow Audience"
}

export const emptyTargetingSelection: TargetingSelection = {
  included: [],
  excluded: [],
  narrowing_groups: [],
};
