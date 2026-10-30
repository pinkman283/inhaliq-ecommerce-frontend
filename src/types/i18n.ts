export type Locale = "en" | "bn";

export interface TranslationDictionary {
  nav: {
    home: string;
    shop: string;
    allProducts: string;
    categories: string;
    brands: string;
    trackOrder: string;
    blog: string;
    contact: string;
    about: string;
    searchPlaceholder: string;
    searchShort: string;
    signIn: string;
    signUp: string;
    myAccount: string;
    cart: string;
    wishlist: string;
    savedWishlist: string;
    announcementBadge: string;
    announcementText: string;
    currencyUSD: string;
    menu: string;
    close: string;
  };
  common: {
    addToCart: string;
    buyNow: string;
    addedToCart: string;
    inStock: string;
    outOfStock: string;
    sale: string;
    new: string;
    featured: string;
    bestSeller: string;
    save: string;
    off: string;
    viewAll: string;
    filter: string;
    sortBy: string;
    price: string;
    rating: string;
    reviews: string;
    quantity: string;
    loading: string;
    success: string;
    error: string;
    apply: string;
    cancel: string;
    confirm: string;
    delete: string;
    back: string;
    readMore: string;
    itemsCount: string;
  };
  product: {
    details: string;
    sku: string;
    category: string;
    brand: string;
    description: string;
    features: string;
    selectVariant: string;
    customerReviews: string;
    writeReview: string;
    noReviews: string;
    relatedProducts: string;
    freeShippingEligible: string;
    estimatedDelivery: string;
    warranty: string;
    returnPolicy: string;
  };
  cart: {
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
    subtotal: string;
    shipping: string;
    freeShipping: string;
    shippingCalculatedAtCheckout: string;
    checkout: string;
    continueShopping: string;
    clearCart: string;
    removeItem: string;
    orderNotes: string;
    haveCoupon: string;
    couponApplied: string;
    discount: string;
  };
  wishlist: {
    title: string;
    emptyTitle: string;
    emptySubtitle: string;
    moveToCart: string;
    removeItem: string;
    clearAll: string;
    exploreProducts: string;
  };
  checkout: {
    title: string;
    contactInfo: string;
    shippingAddress: string;
    paymentMethod: string;
    cashOnDelivery: string;
    cashOnDeliveryDesc: string;
    onlinePayment: string;
    placeOrder: string;
    orderSummary: string;
    processing: string;
    fullName: string;
    phone: string;
    address: string;
    districtCity: string;
    deliveryArea: string;
    insideDhaka: string;
    outsideDhaka: string;
  };
  account: {
    profile: string;
    orders: string;
    addresses: string;
    settings: string;
    logout: string;
    welcomeBack: string;
    signInPrompt: string;
    orderHistory: string;
    noOrdersYet: string;
  };
  orders: {
    orderNumber: string;
    orderDate: string;
    status: string;
    totalAmount: string;
    items: string;
    viewDetails: string;
    trackOrder: string;
    pending: string;
    confirmed: string;
    processing: string;
    shipped: string;
    delivered: string;
    cancelled: string;
  };
  forms: {
    requiredField: string;
    invalidEmail: string;
    invalidPhone: string;
    enterFullName: string;
    enterPhone: string;
    enterAddress: string;
    submit: string;
    saving: string;
  };
  footer: {
    nationwideDelivery: string;
    nationwideDeliveryDesc: string;
    authenticGuarantee: string;
    authenticGuaranteeDesc: string;
    cashOnDelivery: string;
    cashOnDeliveryDesc: string;
    customerCare: string;
    customerCareDesc: string;
    quickLinks: string;
    customerService: string;
    aboutUs: string;
    rightsReserved: string;
    paymentPartners: string;
  };
  search: {
    modalTitle: string;
    placeholder: string;
    recentSearches: string;
    popularSearches: string;
    trendingProducts: string;
    noResultsFound: string;
    tryDifferentKeyword: string;
    viewAllResults: string;
    searching: string;
  };
  errors: {
    genericError: string;
    networkError: string;
    productNotFound: string;
    orderNotFound: string;
    couponInvalid: string;
    sessionExpired: string;
  };
}

export type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<TranslationDictionary>;

