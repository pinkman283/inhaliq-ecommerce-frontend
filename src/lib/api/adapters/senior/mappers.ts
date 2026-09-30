import {
  Product,
  ProductVariant,
  ProductImage,
  Category,
  Brand,
  Banner,
  HomepageBannersResponse,
  NavbarItem,
  StorefrontVideoMetadata,
  Order
} from "@/types";

/**
 * Normalizes an image item (string URL or object) into an absolute URL string.
 */
function resolveImageUrl(img: any): string {
  if (!img) return "/placeholder-product.png";
  if (typeof img === "string") return img;
  return img.image_url || img.url || img.image || "/placeholder-product.png";
}

/**
 * Maps a raw Senior API product resource into the canonical Storefront Product model.
 */
export function mapSeniorProduct(raw: any): Product {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
      name: "Unknown Product",
      slug: "",
      description: "",
      price: 0,
      stock_quantity: 0,
      is_featured: false,
      is_new_arrival: false,
      is_best_seller: false,
      is_active: true,
      rating_average: 5,
      review_count: 0,
      created_at: new Date().toISOString(),
    };
  }

  // 1. Resolve Images
  const rawGallery: any[] = Array.isArray(raw.images)
    ? raw.images
    : Array.isArray(raw.gallery)
    ? raw.gallery
    : [];

  const rawCover = raw.cover_image || raw.image;
  const coverUrl = rawCover ? resolveImageUrl(rawCover) : (rawGallery.length > 0 ? resolveImageUrl(rawGallery[0]) : "/placeholder-product.png");

  const images: ProductImage[] = [];

  if (rawCover) {
    images.push({
      id: 1,
      product_id: Number(raw.id),
      image_url: coverUrl,
      alt_text: raw.name || "Product Image",
      is_primary: true,
      display_order: 0,
    });
  }

  rawGallery.forEach((img, idx) => {
    const url = resolveImageUrl(img);
    if (rawCover && url === coverUrl) return;

    images.push({
      id: typeof img === "object" && img.id ? Number(img.id) : (images.length + 1),
      product_id: Number(raw.id),
      image_url: url,
      alt_text: (typeof img === "object" && img.alt_text) || raw.name || "Product Image",
      color_name: typeof img === "object" ? (img.color_name || null) : null,
      is_primary: images.length === 0,
      display_order: images.length,
    });
  });

  if (images.length === 0) {
    images.push({
      id: 1,
      product_id: Number(raw.id),
      image_url: coverUrl,
      alt_text: raw.name || "Product Image",
      is_primary: true,
      display_order: 0,
    });
  }

  const primaryImage: ProductImage = images.find((i) => i.is_primary) || images[0];

  // 2. Synthesize Variants from sizes & colors or consume structured variants
  const rawSizes: any[] = Array.isArray(raw.sizes)
    ? raw.sizes
    : Array.isArray(raw.size_variants)
    ? raw.size_variants
    : [];

  const rawColors: any[] = Array.isArray(raw.colors)
    ? raw.colors
    : Array.isArray(raw.color_variants)
    ? raw.color_variants
    : [];

  const variants: ProductVariant[] = [];
  let variantCounter = 1;

  if (Array.isArray(raw.variants) && raw.variants.length > 0) {
    // 1. Authoritative pre-materialized backend variants (e.g. Uwell Caliburn variants with individual stock, color_id, images)
    raw.variants.forEach((v: any, idx: number) => {
      const vName = v.name || `${v.color_name || ""} ${v.size_name || v.size || ""}`.trim() || `Variant ${idx + 1}`;
      const vPrice = v.new_price !== undefined ? Number(v.new_price) : (v.price !== undefined ? Number(v.price) : 0);
      const basePrice = Number(raw.price ?? raw.new_price ?? 0);
      variants.push({
        id: v.id ? Number(v.id) : idx + 1,
        product_id: Number(raw.id),
        name: vName,
        size: v.size || v.size_name || null,
        color_name: v.color_name || null,
        color_hex: v.color_hex || v.color_code || null,
        sku: v.sku || `${raw.sku || "SKU"}-${v.id || idx + 1}`,
        price_modifier: v.price_modifier !== undefined ? Number(v.price_modifier) : (vPrice ? vPrice - basePrice : 0),
        stock_quantity: Number(v.stock_quantity ?? v.stock ?? 50),
        ...(v.image ? { image: v.image } : {}),
        ...(v.color_id ? { color_id: v.color_id } : {}),
        ...(v.size_id ? { size_id: v.size_id } : {}),
      } as any);
    });
  } else if (rawColors.length > 0 && rawSizes.length > 0) {
    // Cross combination of colors & sizes
    for (const c of rawColors) {
      const colorName = c.name || c.color_name || "";
      const colorHex = c.code || c.color_code || c.color_hex || null;
      for (const s of rawSizes) {
        const sizeName = s.name || s.size || "";
        variants.push({
          id: variantCounter++,
          product_id: Number(raw.id),
          name: `${colorName} / ${sizeName}`,
          size: sizeName,
          color_name: colorName,
          color_hex: colorHex,
          sku: `${raw.sku || "SKU"}-${colorName}-${sizeName}`.toUpperCase(),
          price_modifier: Number(s.price_modifier || s.price || 0),
          stock_quantity: Number(s.stock || s.stock_quantity || raw.stock || raw.stock_quantity || 50),
        });
      }
    }
  } else if (rawColors.length > 0) {
    // Color only variants
    for (const c of rawColors) {
      const colorName = c.name || c.color_name || "";
      const colorHex = c.code || c.color_code || c.color_hex || null;
      variants.push({
        id: variantCounter++,
        product_id: Number(raw.id),
        name: colorName,
        size: null,
        color_name: colorName,
        color_hex: colorHex,
        sku: `${raw.sku || "SKU"}-${colorName}`.toUpperCase(),
        price_modifier: Number(c.price_modifier || c.price || 0),
        stock_quantity: Number(c.stock || c.stock_quantity || raw.stock || raw.stock_quantity || 50),
      });
    }
  } else if (rawSizes.length > 0) {
    // Size only variants
    for (const s of rawSizes) {
      const sizeName = s.name || s.size || "";
      variants.push({
        id: variantCounter++,
        product_id: Number(raw.id),
        name: sizeName,
        size: sizeName,
        color_name: null,
        color_hex: null,
        sku: `${raw.sku || "SKU"}-${sizeName}`.toUpperCase(),
        price_modifier: Number(s.price_modifier || s.price || 0),
        stock_quantity: Number(s.stock || s.stock_quantity || raw.stock || raw.stock_quantity || 50),
      });
    }
  }

  // 3. Resolve Video Metadata
  let video: StorefrontVideoMetadata | undefined = undefined;
  if (raw.video && typeof raw.video === "object") {
    video = {
      raw: raw.video.raw,
      type: raw.video.type,
      url: raw.video.url,
      embed_url: raw.video.embed_url,
    };
  } else if (raw.video_link) {
    const link = String(raw.video_link);
    let type: "youtube" | "facebook" = "youtube";
    let embedUrl = link;
    if (link.includes("youtube.com") || link.includes("youtu.be")) {
      type = "youtube";
      const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
      const match = link.match(regExp);
      const videoId = match && match[2].length === 11 ? match[2] : null;
      if (videoId) {
        embedUrl = `https://www.youtube.com/embed/${videoId}`;
      }
    } else if (link.includes("facebook.com")) {
      type = "facebook";
      embedUrl = `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(link)}`;
    }
    video = {
      type,
      url: link,
      embed_url: embedUrl,
    };
  }

  // 4. Resolve Related Products
  const rawRelated: any[] = Array.isArray(raw.related)
    ? raw.related
    : Array.isArray(raw.related_products)
    ? raw.related_products
    : [];
  const related: Product[] = rawRelated.map((r) => mapSeniorProduct(r));

  // 5. Build Canonical Product Model
  const mappedProduct: Product & { [key: string]: any } = {
    id: Number(raw.id),
    name: String(raw.name || ""),
    slug: String(raw.slug || ""),
    sku: raw.sku ? String(raw.sku) : `SKU-${raw.id}`,
    price: Number(raw.price ?? raw.new_price ?? 0),
    compare_at_price: raw.compare_at_price !== undefined && raw.compare_at_price !== null
      ? Number(raw.compare_at_price)
      : (raw.old_price ? Number(raw.old_price) : null),
    stock_quantity: Number(raw.stock ?? raw.stock_quantity ?? 50),
    short_description: raw.short_description ? String(raw.short_description) : null,
    description: String(raw.description || raw.short_description || ""),
    is_featured: Boolean(raw.is_featured),
    is_new_arrival: Boolean(raw.is_new_arrival ?? raw.new_arrival),
    is_best_seller: Boolean(raw.is_best_seller ?? raw.best_seller),
    is_active: raw.status !== undefined ? Boolean(raw.status === 1 || raw.status === true) : true,
    rating_average: Number(raw.rating_average ?? raw.rating ?? 5),
    review_count: Number(raw.review_count ?? raw.reviews_count ?? 0),
    meta_title: raw.meta?.title || raw.meta_title || raw.name,
    meta_description: raw.meta?.description || raw.meta_description || raw.short_description,
    primary_image: primaryImage,
    thumbnail: coverUrl,
    images,
    variants,
    has_variants: variants.length > 0,
    in_stock: Number(raw.stock ?? raw.stock_quantity ?? 50) > 0,
    created_at: raw.created_at || new Date().toISOString(),

    // Senior Extensions
    video,
    video_link: raw.video_link,
    cover_image: coverUrl,
    sizes: rawSizes.map((s, idx) => ({ id: s.id ? Number(s.id) : idx + 1, name: s.name || s.size || "" })),
    colors: rawColors.map((c, idx) => ({
      id: c.id ? Number(c.id) : idx + 1,
      name: c.name || c.color_name || "",
      code: c.code || c.color_code || c.color_hex || "#000000",
    })),
    event_id: raw.event_id || null,
  };

  if (raw.category) {
    mappedProduct.category = mapSeniorCategory(raw.category);
    mappedProduct.category_id = mappedProduct.category.id;
  }
  if (raw.subcategory) {
    mappedProduct.subcategory = mapSeniorCategory(raw.subcategory);
    mappedProduct.subcategory_id = mappedProduct.subcategory.id;
  }
  if (raw.brand) {
    mappedProduct.brandRelation = mapSeniorBrand(raw.brand);
    mappedProduct.brand_id = mappedProduct.brandRelation.id;
    mappedProduct.brand = mappedProduct.brandRelation.name;
  }

  // Attach related products to product object as well
  if (related.length > 0) {
    (mappedProduct as any).related = related;
  }

  return mappedProduct;
}

/**
 * Maps a raw Senior API category into the canonical Storefront Category model.
 */
export function mapSeniorCategory(raw: any): Category {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
      name: "Category",
      slug: "",
      is_featured: false,
      display_order: 0,
    };
  }

  const rawChildren = Array.isArray(raw.sub_categories) && raw.sub_categories.length > 0
    ? raw.sub_categories
    : Array.isArray(raw.subcategories) && raw.subcategories.length > 0
    ? raw.subcategories
    : Array.isArray(raw.child_categories) && raw.child_categories.length > 0
    ? raw.child_categories
    : Array.isArray(raw.childcategories) && raw.childcategories.length > 0
    ? raw.childcategories
    : Array.isArray(raw.children)
    ? raw.children
    : [];

  const subcategories = rawChildren.map(mapSeniorCategory);

  return {
    id: Number(raw.id),
    parent_id: raw.parent_id ? Number(raw.parent_id) : (raw.category_id ? Number(raw.category_id) : (raw.sub_category_id ? Number(raw.sub_category_id) : null)),
    name: String(raw.name || raw.sub_category_name || raw.child_category_name || raw.title || ""),
    slug: String(raw.slug || ""),
    description: raw.description ? String(raw.description) : null,
    image: raw.image || raw.icon || null,
    icon: raw.icon || null,
    badge: raw.badge || null,
    is_featured: Boolean(raw.is_featured),
    display_order: Number(raw.sorting ?? raw.display_order ?? 0),
    meta_title: raw.meta?.title || raw.meta_title || null,
    meta_description: raw.meta?.description || raw.meta_description || null,
    products_count: raw.products_count !== undefined ? Number(raw.products_count) : undefined,
    children: subcategories,
    // Senior extension properties
    ...(raw.event_id ? { event_id: raw.event_id } : {}),
  } as Category;
}

/**
 * Maps a raw Senior API brand resource into the canonical Storefront Brand model.
 */
export function mapSeniorBrand(raw: any): Brand {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
      name: "Brand",
      slug: "",
      is_featured: false,
      display_order: 0,
    };
  }

  const brandImage = raw.image || raw.logo || null;

  return {
    id: Number(raw.id),
    name: String(raw.name || ""),
    slug: String(raw.slug || ""),
    description: raw.description ? String(raw.description) : null,
    logo: brandImage,
    website: raw.website_url || raw.website || null,
    is_featured: Boolean(raw.is_featured),
    display_order: Number(raw.sorting ?? raw.display_order ?? 0),
    products_count: raw.products_count !== undefined ? Number(raw.products_count) : undefined,
    // Senior extensions
    ...(raw.banner ? { banner: raw.banner } : {}),
    ...(raw.image ? { image: raw.image } : {}),
    ...(raw.website_url ? { website_url: raw.website_url } : {}),
    ...(raw.meta ? { meta: raw.meta } : {}),
  } as Brand;
}

/**
 * Maps Senior API `/home` or `/banners` payload into the Storefront `HomepageBannersResponse`.
 */
export function mapSeniorHomeToBanners(homeData: any): HomepageBannersResponse {
  if (!homeData || typeof homeData !== "object") {
    return {
      primary_banners: [],
      secondary_banners: [],
      bottom_banners: [],
      middle_banners: [],
      top_strip: null,
      all_active_count: 0,
    };
  }

  const data = homeData.data || homeData;
  const rawSliders: any[] = Array.isArray(data.sliders)
    ? data.sliders
    : Array.isArray(data.banners)
    ? data.banners.filter((b: any) => b.category_id === 1 || b.placement === "slider" || b.placement === "primary_hero")
    : [];

  const rawBanners: any[] = Array.isArray(data.banners)
    ? data.banners
    : [];

  // 1. Primary Hero Banners (Sliders)
  const primaryBanners: Banner[] = rawSliders.map((s, idx) => ({
    id: Number(s.id || idx + 100),
    title: String(s.title || s.name || ""),
    subtitle: s.subtitle || s.description || null,
    eyebrow: s.eyebrow || s.badge || null,
    badge: s.badge || null,
    discount_tag: s.discount_tag || null,
    cta_text: s.cta_text || s.button_text || "Explore Flagship",
    cta_link: s.cta_link || s.link || "/products",
    image_url: resolveImageUrl(s),
    mobile_image_url: s.mobile_image ? resolveImageUrl(s.mobile_image) : null,
    placement: "primary_hero",
    sort_order: Number(s.sort_order ?? s.sorting ?? idx + 1),
    clicks_count: Number(s.clicks_count || 0),
    impressions_count: Number(s.impressions_count || 0),
    is_active: true,
  }));

  // 2. Secondary Promo Banner (Right side of hero: SECOND promotional banner)
  // Deterministically select the second promotional banner:
  // Prefer category_bottom_ads[0] (which is 2nd-banner.png in Senior API), deals_middle_ads[0], rawBanners[0], or sliders[1]
  const rawSecondBanner = (Array.isArray(data.category_bottom_ads) && data.category_bottom_ads.length > 0)
    ? data.category_bottom_ads[0]
    : (Array.isArray(data.deals_middle_ads) && data.deals_middle_ads.length > 0)
    ? data.deals_middle_ads[0]
    : rawBanners.length > 0
    ? rawBanners[0]
    : rawSliders.length > 1
    ? rawSliders[1]
    : null;

  const secondaryBanners: Banner[] = rawSecondBanner
    ? [{
        id: Number(rawSecondBanner.id || 201),
        title: String(rawSecondBanner.title || rawSecondBanner.name || ""),
        subtitle: rawSecondBanner.subtitle || rawSecondBanner.description || null,
        eyebrow: rawSecondBanner.eyebrow || rawSecondBanner.badge || null,
        badge: rawSecondBanner.badge || null,
        discount_tag: rawSecondBanner.discount_tag || null,
        cta_text: rawSecondBanner.cta_text || rawSecondBanner.button_text || "",
        cta_link: rawSecondBanner.cta_link || rawSecondBanner.link || "/products",
        image_url: resolveImageUrl(rawSecondBanner),
        mobile_image_url: rawSecondBanner.mobile_image ? resolveImageUrl(rawSecondBanner.mobile_image) : null,
        placement: "secondary_hero",
        sort_order: 1,
        clicks_count: 0,
        impressions_count: 0,
        is_active: true,
      }]
    : [];

  // 3. Bottom / Showcase Banners (e.g. category bottom ads or deals middle ads)
  const rawBottom = (Array.isArray(data.category_bottom_ads) && data.category_bottom_ads.length > 1)
    ? data.category_bottom_ads.slice(1)
    : (Array.isArray(data.deals_middle_ads) && data.deals_middle_ads.length > 0 && rawSecondBanner !== data.deals_middle_ads[0])
    ? data.deals_middle_ads
    : rawBanners.length > 1
    ? rawBanners.slice(1)
    : [];

  const bottomBanners: Banner[] = rawBottom.map((b: any, idx: number) => ({
    id: Number(b.id || idx + 300),
    title: String(b.title || b.name || ""),
    subtitle: b.subtitle || null,
    cta_text: b.cta_text || "Shop Now",
    cta_link: b.cta_link || b.link || "/products",
    image_url: resolveImageUrl(b),
    placement: "bottom_banner",
    sort_order: Number(b.sort_order ?? b.sorting ?? idx + 1),
    clicks_count: Number(b.clicks_count || 0),
    impressions_count: Number(b.impressions_count || 0),
    is_active: true,
  }));

  // 4. Top Strip / Popup
  const topStripRaw = data.top_strip || data.popup_banners?.[0] || data.home_popup_banner || null;
  const topStrip: Banner | null = topStripRaw ? {
    id: Number(topStripRaw.id || 999),
    title: String(topStripRaw.title || topStripRaw.text || ""),
    cta_link: topStripRaw.cta_link || topStripRaw.link || "/products",
    cta_text: topStripRaw.cta_text || "Learn More",
    image_url: resolveImageUrl(topStripRaw),
    placement: "top_strip",
    sort_order: 0,
    clicks_count: 0,
    impressions_count: 0,
    is_active: true,
  } : null;

  return {
    primary_banners: primaryBanners,
    secondary_banners: secondaryBanners,
    bottom_banners: bottomBanners,
    middle_banners: secondaryBanners.length > 0 ? secondaryBanners : bottomBanners,
    top_strip: topStrip,
    all_active_count: primaryBanners.length + secondaryBanners.length + bottomBanners.length + (topStrip ? 1 : 0),
  };
}

/**
 * Maps Senior API `/nav-menu` nested structure into the Storefront `NavbarItem[]` tree.
 * Preserves the full 3-level hierarchy: Category -> Subcategory -> Child Category.
 */
export function mapSeniorNavMenuToNavbarItems(navMenuData: any): NavbarItem[] {
  if (!navMenuData) return [];
  const rawList: any[] = Array.isArray(navMenuData)
    ? navMenuData
    : Array.isArray(navMenuData.data)
    ? navMenuData.data
    : [];

  return rawList.map((cat, idx) => {
    // 1. Extract raw subcategories (support sub_categories, subcategories, or children)
    const rawSubcategories: any[] = Array.isArray(cat.sub_categories)
      ? cat.sub_categories
      : Array.isArray(cat.subcategories)
      ? cat.subcategories
      : Array.isArray(cat.children)
      ? cat.children
      : [];

    const itemName = String(cat.name || cat.title || "");
    const itemSlug = String(cat.slug || "");
    const itemHref = cat.url || (itemSlug.startsWith("/") ? itemSlug : `/category/${itemSlug}`);

    // Map subcategories (Tier 2)
    const mappedSubcategories: NavbarItem[] = rawSubcategories.map((sub, subIdx) => {
      // 2. Extract raw child categories (support child_categories, childcategories, or children)
      const rawChildCategories: any[] = Array.isArray(sub.child_categories)
        ? sub.child_categories
        : Array.isArray(sub.childcategories)
        ? sub.childcategories
        : Array.isArray(sub.children)
        ? sub.children
        : [];

      const subName = String(sub.name || sub.title || "");
      const subSlug = String(sub.slug || "");
      const subHref = sub.url || (subSlug.startsWith("/") ? subSlug : `/category/${subSlug}`);

      // Map child categories (Tier 3)
      const mappedChildCategories: NavbarItem[] = rawChildCategories.map((child, childIdx) => {
        const childName = String(child.name || child.title || "");
        const childSlug = String(child.slug || "");
        const childHref = child.url || (childSlug.startsWith("/") ? childSlug : `/category/${childSlug}`);

        return {
          id: child.id ? 200000 + Number(child.id) : 200000 + (subIdx + 1) * 100 + childIdx + 1,
          parent_id: sub.id ? 100000 + Number(sub.id) : 100000 + subIdx + 1,
          title: childName,
          name: childName,
          type: "subcategory" as const,
          url: childHref,
          computed_url: childHref,
          badge: child.badge || null,
          badge_color: null,
          is_active: true,
          open_in_new_tab: false,
          mega_menu_type: "none" as const,
          display_order: Number(child.sorting ?? childIdx + 1),
          children: undefined,
          is_valid: true,
        };
      });

      return {
        id: sub.id ? 100000 + Number(sub.id) : 100000 + subIdx + 1,
        parent_id: Number(cat.id || idx + 1),
        title: subName,
        name: subName,
        type: "subcategory" as const,
        url: subHref,
        computed_url: subHref,
        badge: sub.badge || null,
        badge_color: null,
        is_active: true,
        open_in_new_tab: false,
        mega_menu_type: "none" as const,
        display_order: Number(sub.sorting ?? subIdx + 1),
        children: mappedChildCategories.length > 0 ? mappedChildCategories : undefined,
        is_valid: true,
      };
    });

    const products: any[] = Array.isArray(cat.products)
      ? cat.products.map(mapSeniorProduct)
      : [];

    return {
      id: Number(cat.id || idx + 1),
      title: itemName,
      name: itemName,
      href: itemHref,
      url: itemHref,
      computed_url: itemHref,
      badge: cat.badge || null,
      is_highlighted: Boolean(cat.is_featured),
      display_order: Number(cat.sorting ?? idx + 1),
      is_active: true,
      open_in_new_tab: false,
      menu_type: "tree",
      type: (cat.type as any) || "category",
      children: mappedSubcategories.length > 0 ? mappedSubcategories : undefined,
      subcategories: mappedSubcategories.length > 0 ? mappedSubcategories.map((s) => ({
        id: s.id,
        name: s.title,
        slug: s.url ? s.url.replace(/^\/category\//, "") : "",
        url: s.url || "",
        badge: s.badge,
      })) : undefined,
      featured_products: products.slice(0, 8),
      is_valid: true,
      mega_menu_type: "none" as const,
    } as unknown as NavbarItem;
  });
}

/**
 * Maps Senior API past order details into the Storefront `Order` model.
 */
export function mapSeniorOrder(raw: any): Order {
  if (!raw || typeof raw !== "object") {
    return {
      id: 0,
      order_number: "ORD-000",
      customer_name: "",
      customer_email: "",
      shipping_address: { full_name: "", address_line1: "", city: "", postal_code: "", country: "Bangladesh" },
      subtotal: 0,
      tax_amount: 0,
      shipping_amount: 0,
      discount_amount: 0,
      total_amount: 0,
      payment_status: "pending",
      payment_method: "cash_on_delivery",
      order_status: "pending",
      created_at: new Date().toISOString(),
    };
  }

  const rawItems: any[] = Array.isArray(raw.items)
    ? raw.items
    : Array.isArray(raw.order_items)
    ? raw.order_items
    : [];

  const items = rawItems.map((item: any, idx: number) => ({
    id: item.id ? Number(item.id) : idx + 1,
    order_id: Number(raw.id || raw.order_id || 0),
    product_id: item.product_id ? Number(item.product_id) : null,
    variant_id: item.variant_id ? Number(item.variant_id) : null,
    product_name: String(item.product_name || item.product?.name || item.name || "Item"),
    product_sku: item.sku || null,
    product_image: item.image ? resolveImageUrl(item.image) : null,
    variant_name: item.size || item.color ? `${item.color || ""} ${item.size || ""}`.trim() : null,
    unit_price: Number(item.price || item.unit_price || 0),
    quantity: Number(item.qty || item.quantity || 1),
    total_price: Number(item.price || item.unit_price || 0) * Number(item.qty || item.quantity || 1),
  }));

  const invoiceNumber = raw.invoice_id || raw.invoice_number || raw.order_number || String(raw.id);
  const orderNumber = raw.order_number || `INV-${invoiceNumber}`;

  return {
    id: Number(raw.id || raw.order_id || 0),
    order_id: Number(raw.order_id || raw.id || 0),
    invoice_id: String(invoiceNumber),
    invoice_number: String(invoiceNumber),
    order_number: String(orderNumber),
    customer_name: String(raw.name || raw.customer_name || ""),
    customer_email: String(raw.email || raw.customer_email || ""),
    customer_phone: raw.phone || raw.customer_phone || null,
    shipping_address: typeof raw.shipping_address === "object" && raw.shipping_address !== null
      ? raw.shipping_address
      : {
          full_name: raw.name || "",
          address_line1: raw.address || "",
          city: raw.city || raw.area || "Dhaka",
          postal_code: raw.postal_code || "1000",
          country: "Bangladesh",
          phone: raw.phone || "",
        },
    subtotal: Number(raw.subtotal || raw.total || 0),
    tax_amount: Number(raw.tax_amount || 0),
    shipping_amount: Number(raw.shipping_fee || raw.shipping_amount || 0),
    discount_amount: Number(raw.discount || raw.discount_amount || 0),
    total_amount: Number(raw.total || raw.total_amount || 0),
    total: Number(raw.total || raw.total_amount || 0),
    payment_status: raw.payment_status || "pending",
    payment_method: raw.payment_method || "cash_on_delivery",
    payment_url: raw.payment_url || null,
    order_status: raw.order_status || raw.status || "pending",
    tracking_code: raw.tracking_code || null,
    created_at: raw.created_at || new Date().toISOString(),
    items,
  };
}
