// src/i18n/types.ts

export type Language = 'fr' | 'en';

export interface TranslationDictionary {
  common: {
    confirm: string;
    cancel: string;
    close: string;
    save: string;
    loading: string;
    retry: string;
    back: string;
    seeAll: string;
    fcfa: string;
    portions: string;
    portion: string;
    error: string;
    success: string;
    yes: string;
    no: string;
    offline: string;
    online: string;
  };
  nav: {
    home: string;
    reels: string;
    orders: string;
    profile: string;
    chat: string;
  };
  home: {
    tagline: string;
    selectCity: string;
    activeCity: string;
    dailyDishes: string;
    collectivePots: string;
    allDishes: string;
    searchPlaceholder: string;
    portionsLeft: string;
    soldOut: string;
    orderNow: string;
    joinPot: string;
    emptyTitle: string;
    emptySubtitle: string;
    targetDate: string;
    today: string;
    tomorrow: string;
  };
  pots: {
    title: string;
    thresholdReached: string;
    inProgress: string;
    minThreshold: string;
    participants: string;
    reserved: string;
    participate: string;
    statusConfirmed: string;
    statusProposed: string;
    statusReservation: string;
  };
  orderModal: {
    title: string;
    portionsCount: string;
    selectVariant: string;
    sidesAndOptions: string;
    customNote: string;
    customNotePlaceholder: string;
    deliveryZone: string;
    deliveryZonePlaceholder: string;
    deliveryFee: string;
    freeDelivery: string;
    subtotal: string;
    totalAmount: string;
    depositRequired: string;
    depositNote: string;
    balanceDue: string;
    balanceNote: string;
    phoneLabel: string;
    phonePlaceholder: string;
    payDeposit: string;
    payWithSebpay: string;
    orderSuccessTitle: string;
    orderSuccessMsg: string;
    orderFailedTitle: string;
  };
  orderStatus: {
    pending: string;
    confirmed: string;
    preparing: string;
    ready: string;
    shipping: string;
    delivered: string;
    cancelled: string;
    pickedUp: string;
  };
  ordersHistory: {
    title: string;
    subtitle: string;
    emptyTitle: string;
    emptySubtitle: string;
    orderNumber: string;
    orderDate: string;
    portions: string;
    total: string;
    depositPaid: string;
    balanceToPay: string;
    trackOrder: string;
    details: string;
    payBalance: string;
  };
  profile: {
    title: string;
    personalInfo: string;
    myOrders: string;
    myAddresses: string;
    language: string;
    languageSubtitle: string;
    affiliateProgram: string;
    ambassadorPortal: string;
    helpSupport: string;
    termsPrivacy: string;
    logout: string;
    logoutConfirm: string;
    notConnected: string;
    loginPrompt: string;
    loginBtn: string;
  };
  auth: {
    loginTitle: string;
    loginSubtitle: string;
    registerTitle: string;
    registerSubtitle: string;
    phoneLabel: string;
    passwordLabel: string;
    nameLabel: string;
    forgotPassword: string;
    noAccount: string;
    hasAccount: string;
    registerBtn: string;
    loginBtn: string;
    invalidPhone: string;
    invalidCredentials: string;
  };
  notifications: {
    orderCreatedTitle: string;
    orderCreatedBody: string;
    paymentReceivedTitle: string;
    paymentReceivedBody: string;
    preparingTitle: string;
    preparingBody: string;
    shippingTitle: string;
    shippingBody: string;
    deliveredTitle: string;
    deliveredBody: string;
  };
}
