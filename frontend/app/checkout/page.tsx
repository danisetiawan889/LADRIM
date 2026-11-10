'use client';
import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronDown,
  CheckCircle2,
  ShoppingBag,
  Tag,
  X,
  HelpCircle,
  Truck,
  ArrowLeft,
  CreditCard,
  Lock,
  AlertCircle,
  Search,
  MapPin,
  Loader2,
} from 'lucide-react';
import { lux } from '@/lib/motion';
import { useCart } from '@/context/CartContext';
import { apiFetch } from '@/lib/api';

type ShippingOption = {
  id: 'standard' | 'express';
  name: string;
  timeframe: string;
  cost: number;
};

const COUNTRY_PROVINCE_MAP: Record<string, string[]> = {
  Indonesia: [
    'Aceh',
    'Bali',
    'Bangka Belitung Islands',
    'Banten',
    'Bengkulu',
    'Central Java',
    'Central Kalimantan',
    'Central Papua',
    'Central Sulawesi',
    'East Java',
    'East Kalimantan',
    'East Nusa Tenggara',
    'Gorontalo',
    'Highland Papua',
    'Jakarta',
    'Jambi',
    'Lampung',
    'Maluku',
    'North Kalimantan',
    'North Maluku',
    'North Sulawesi',
    'North Sumatra',
    'Papua',
    'Riau',
    'Riau Islands',
    'South Kalimantan',
    'South Papua',
    'South Sulawesi',
    'South Sumatra',
    'Southeast Sulawesi',
    'Southwest Papua',
    'West Java',
    'West Kalimantan',
    'West Nusa Tenggara',
    'West Papua',
    'West Sulawesi',
    'West Sumatra',
    'Yogyakarta',
  ],
  Singapore: [], // Singapore is a city-state without provinces/states
  Malaysia: [
    'Johor',
    'Kedah',
    'Kelantan',
    'Kuala Lumpur',
    'Labuan',
    'Malacca',
    'Negeri Sembilan',
    'Pahang',
    'Penang',
    'Perak',
    'Perlis',
    'Putrajaya',
    'Sabah',
    'Sarawak',
    'Selangor',
    'Terengganu',
  ],
};

const COUNTRIES = ['Indonesia', 'Singapore', 'Malaysia'];

const POSTAL_PREFIX_MAP: Record<string, Record<string, string[]>> = {
  Indonesia: {
    Aceh: ['23', '24'],
    'North Sumatra': ['20', '21', '22'],
    'Sumatera Utara': ['20', '21', '22'],
    'West Sumatra': ['25', '26', '27'],
    'Sumatera Barat': ['25', '26', '27'],
    Riau: ['28', '29'],
    'Riau Islands': ['29'],
    'Kepulauan Riau': ['29'],
    Jambi: ['36', '37'],
    'South Sumatra': ['30', '31', '32'],
    'Sumatera Selatan': ['30', '31', '32'],
    'Bangka Belitung Islands': ['33'],
    'Bangka Belitung': ['33'],
    Bengkulu: ['38', '39'],
    Lampung: ['34', '35'],
    Jakarta: ['10', '11', '12', '13', '14'],
    'DKI Jakarta': ['10', '11', '12', '13', '14'],
    'West Java': ['16', '17', '40', '41', '42', '43', '44', '45', '46'],
    'Jawa Barat': ['16', '17', '40', '41', '42', '43', '44', '45', '46'],
    Banten: ['15', '42'],
    'Central Java': ['50', '51', '52', '53', '54', '56', '57', '58', '59'],
    'Jawa Tengah': ['50', '51', '52', '53', '54', '56', '57', '58', '59'],
    Yogyakarta: ['55'],
    'DI Yogyakarta': ['55'],
    'East Java': ['60', '61', '62', '63', '64', '65', '66', '67', '68', '69'],
    'Jawa Timur': ['60', '61', '62', '63', '64', '65', '66', '67', '68', '69'],
    Bali: ['80', '81', '82'],
    'West Nusa Tenggara': ['83', '84'],
    'Nusa Tenggara Barat': ['83', '84'],
    'East Nusa Tenggara': ['85', '86', '87'],
    'Nusa Tenggara Timur': ['85', '86', '87'],
    'West Kalimantan': ['78', '79'],
    'Kalimantan Barat': ['78', '79'],
    'Central Kalimantan': ['73', '74'],
    'Kalimantan Tengah': ['73', '74'],
    'South Kalimantan': ['70', '71', '72'],
    'Kalimantan Selatan': ['70', '71', '72'],
    'East Kalimantan': ['75', '76', '77'],
    'Kalimantan Timur': ['75', '76', '77'],
    'North Kalimantan': ['77'],
    'Kalimantan Utara': ['77'],
    'North Sulawesi': ['95'],
    'Sulawesi Utara': ['95'],
    Gorontalo: ['96'],
    'Central Sulawesi': ['94'],
    'Sulawesi Tengah': ['94'],
    'West Sulawesi': ['91'],
    'Sulawesi Barat': ['91'],
    'South Sulawesi': ['90', '91', '92'],
    'Sulawesi Selatan': ['90', '91', '92'],
    'Southeast Sulawesi': ['93'],
    'Sulawesi Tenggara': ['93'],
    Maluku: ['97'],
    'North Maluku': ['97'],
    'Maluku Utara': ['97'],
    Papua: ['98', '99'],
    'West Papua': ['98', '99'],
    'Papua Barat': ['98', '99'],
    'Southwest Papua': ['98', '99'],
    'Papua Barat Daya': ['98', '99'],
    'Highland Papua': ['99'],
    'Papua Pegunungan': ['99'],
    'South Papua': ['99'],
    'Papua Selatan': ['99'],
    'Central Papua': ['98', '99'],
    'Papua Tengah': ['98', '99'],
  },
  Singapore: {
    'Central Region': ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29', '30', '31', '32', '33'],
    'East Region': ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48', '49', '50', '51', '52'],
    'North Region': ['72', '73', '75', '76', '77', '78'],
    'North-East Region': ['53', '54', '55', '56', '57', '79', '80', '82'],
    'West Region': ['58', '59', '60', '61', '62', '63', '64', '65', '66', '67', '68', '69', '70', '71'],
  },
  Malaysia: {
    Johor: ['80', '81', '82', '83', '84', '85', '86'],
    Kedah: ['05', '06', '07', '08', '09'],
    Kelantan: ['15', '16', '17', '18'],
    Malacca: ['75', '76', '77', '78'],
    Melaka: ['75', '76', '77', '78'],
    'Negeri Sembilan': ['70', '71', '72', '73'],
    Pahang: ['25', '26', '27', '28', '39', '49', '69'],
    Perak: ['30', '31', '32', '33', '34', '35', '36', '39'],
    Perlis: ['01', '02'],
    Penang: ['10', '11', '12', '13', '14'],
    'Pulau Pinang': ['10', '11', '12', '13', '14'],
    Sabah: ['88', '89', '90', '91'],
    Sarawak: ['93', '94', '95', '96', '97', '98'],
    Selangor: ['40', '41', '42', '43', '44', '45', '46', '47', '48', '63', '64', '65', '68'],
    Terengganu: ['20', '21', '22', '23', '24'],
    'Kuala Lumpur': ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60'],
    'Wilayah Persekutuan Kuala Lumpur': ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59', '60'],
    Labuan: ['87'],
    'Wilayah Persekutuan Labuan': ['87'],
    Putrajaya: ['62'],
    'Wilayah Persekutuan Putrajaya': ['62'],
  },
};

const SG_POSTAL_SECTORS = new Set([
  '01', '02', '03', '04', '05', '06', '07', '08', '09', '10',
  '11', '12', '13', '14', '15', '16', '17', '18', '19', '20',
  '21', '22', '23', '24', '25', '26', '27', '28', '29', '30',
  '31', '32', '33', '34', '35', '36', '37', '38', '39', '40',
  '41', '42', '43', '44', '45', '46', '47', '48', '49', '50',
  '51', '52', '53', '54', '55', '56', '57', '58', '59', '60',
  '61', '62', '63', '64', '65', '66', '67', '68', '69', '70',
  '71', '72', '73', '75', '76', '77', '78', '79', '80', '82',
]);

type PostalValidationResult = {
  isValid: boolean;
  error?: string;
};

function validatePostalCode(country: string, province: string, postalCode: string): PostalValidationResult {
  const code = (postalCode || '').trim();
  if (!code) {
    return { isValid: false, error: 'Postal code is required.' };
  }

  // Postal codes must consist strictly of digits (no alphabetic characters or symbols)
  if (!/^\d+$/.test(code)) {
    return {
      isValid: false,
      error: 'Postal code must contain numbers only (no letters or text).',
    };
  }

  if (!country) {
    return {
      isValid: false,
      error: 'Please select a country first.',
    };
  }

  // Singapore validation: strictly 6 digits with valid postal sector
  if (country === 'Singapore') {
    if (code.length !== 6) {
      return {
        isValid: false,
        error: 'Singapore postal code must be exactly 6 digits.',
      };
    }
    const sector = code.substring(0, 2);
    if (!SG_POSTAL_SECTORS.has(sector)) {
      return {
        isValid: false,
        error: `Postal code "${code}" is not a valid Singapore postal sector.`,
      };
    }
    return { isValid: true };
  }

  // Malaysia & Indonesia validation: 5 digits and matches state/province
  if (!province) {
    return {
      isValid: false,
      error: 'Please select a state first.',
    };
  }

  const expectedLength = 5;
  if (code.length !== expectedLength) {
    return {
      isValid: false,
      error: `Postal code for ${country} must be exactly ${expectedLength} digits.`,
    };
  }

  const countryMap = POSTAL_PREFIX_MAP[country];
  if (!countryMap) {
    return { isValid: true };
  }

  const validPrefixes = countryMap[province];
  if (!validPrefixes) {
    return { isValid: true };
  }

  const prefix2 = code.substring(0, 2);
  const isMatch = validPrefixes.includes(prefix2);

  if (!isMatch) {
    return {
      isValid: false,
      error: `Postal code "${code}" does not match ${province}.`,
    };
  }

  return { isValid: true };
}

export default function CheckoutPage() {
  const { lines, clear } = useCart();

  // Contact State
  const [email, setEmail] = useState('');
  const [newsletter, setNewsletter] = useState(false);

  // Delivery Address State (starts completely empty, user must choose country and state)
  const [address, setAddress] = useState({
    country: '',
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
  });

  const availableProvinces = useMemo(() => {
    return COUNTRY_PROVINCE_MAP[address.country] || [];
  }, [address.country]);

  const handleCountryChange = (newCountry: string) => {
    setAddress((prev) => ({
      ...prev,
      country: newCountry,
      province: newCountry === 'Singapore' ? 'Singapore' : '',
      city: newCountry === 'Singapore' ? 'Singapore' : '',
      postalCode: '',
      addressLine1: '',
    }));
    setAddressSuggestions([]);
    setShowSuggestions(false);
  };


  // Payment Method State - starts unselected, user must choose
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'paypal' | ''>('');
  const [cardDetails, setCardDetails] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
  });

  // Billing Address State - starts unselected, user must choose
  const [billingOption, setBillingOption] = useState<'same' | 'different' | ''>('');
  const [billingAddress, setBillingAddress] = useState({
    country: '',
    firstName: '',
    lastName: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    province: '',
    postalCode: '',
    phone: '',
  });

  const billingProvinces = useMemo(() => {
    return COUNTRY_PROVINCE_MAP[billingAddress.country] || [];
  }, [billingAddress.country]);

  const handleBillingCountryChange = (newCountry: string) => {
    setBillingAddress((prev) => ({
      ...prev,
      country: newCountry,
      province: newCountry === 'Singapore' ? 'Singapore' : '',
      city: newCountry === 'Singapore' ? 'Singapore' : '',
      postalCode: '',
      addressLine1: '',
    }));
    setBillingSuggestions([]);
    setShowBillingSuggestions(false);
  };

  // Delivery Address Autocomplete State
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const deliverySearchRef = useRef<HTMLDivElement>(null);

  // Billing Address Autocomplete State
  const [billingSuggestions, setBillingSuggestions] = useState<any[]>([]);
  const [isLoadingBillingSuggestions, setIsLoadingBillingSuggestions] = useState(false);
  const [showBillingSuggestions, setShowBillingSuggestions] = useState(false);
  const billingSearchRef = useRef<HTMLDivElement>(null);

  // Animation highlights when fields are auto-filled from places autocomplete
  const [autofilledFields, setAutofilledFields] = useState<{
    city?: boolean;
    province?: boolean;
    postalCode?: boolean;
  }>({});
  const [autofilledBillingFields, setAutofilledBillingFields] = useState<{
    city?: boolean;
    province?: boolean;
    postalCode?: boolean;
  }>({});

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (deliverySearchRef.current && !deliverySearchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (billingSearchRef.current && !billingSearchRef.current.contains(event.target as Node)) {
        setShowBillingSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debounced places search for Delivery Address
  useEffect(() => {
    if (!address.country || address.addressLine1.trim().length < 2 || !showSuggestions) {
      setAddressSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsLoadingSuggestions(true);
        const res = await fetch(
          `/api/places?q=${encodeURIComponent(address.addressLine1)}&country=${encodeURIComponent(address.country)}`
        );
        if (res.ok) {
          const data = await res.json();
          setAddressSuggestions(data.results || []);
        }
      } catch {
        setAddressSuggestions([]);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [address.addressLine1, address.country, showSuggestions]);

  // Debounced places search for Billing Address
  useEffect(() => {
    if (!billingAddress.country || billingAddress.addressLine1.trim().length < 2 || !showBillingSuggestions) {
      setBillingSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setIsLoadingBillingSuggestions(true);
        const res = await fetch(
          `/api/places?q=${encodeURIComponent(billingAddress.addressLine1)}&country=${encodeURIComponent(billingAddress.country)}`
        );
        if (res.ok) {
          const data = await res.json();
          setBillingSuggestions(data.results || []);
        }
      } catch {
        setBillingSuggestions([]);
      } finally {
        setIsLoadingBillingSuggestions(false);
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [billingAddress.addressLine1, billingAddress.country, showBillingSuggestions]);

const PROVINCE_NAME_ALIASES: Record<string, string> = {
  // Indonesia
  aceh: 'Aceh',
  bali: 'Bali',
  'bangka belitung': 'Bangka Belitung Islands',
  'kepulauan bangka belitung': 'Bangka Belitung Islands',
  'bangka belitung islands': 'Bangka Belitung Islands',
  banten: 'Banten',
  bengkulu: 'Bengkulu',
  'di yogyakarta': 'Yogyakarta',
  'daerah istimewa yogyakarta': 'Yogyakarta',
  yogyakarta: 'Yogyakarta',
  jogja: 'Yogyakarta',
  'dki jakarta': 'Jakarta',
  'daerah khusus ibukota jakarta': 'Jakarta',
  jakarta: 'Jakarta',
  gorontalo: 'Gorontalo',
  jambi: 'Jambi',
  'jawa barat': 'West Java',
  'west java': 'West Java',
  'jawa tengah': 'Central Java',
  'central java': 'Central Java',
  'jawa timur': 'East Java',
  'east java': 'East Java',
  'kalimantan barat': 'West Kalimantan',
  'west kalimantan': 'West Kalimantan',
  'kalimantan selatan': 'South Kalimantan',
  'south kalimantan': 'South Kalimantan',
  'kalimantan tengah': 'Central Kalimantan',
  'central kalimantan': 'Central Kalimantan',
  'kalimantan timur': 'East Kalimantan',
  'east kalimantan': 'East Kalimantan',
  'kalimantan utara': 'North Kalimantan',
  'north kalimantan': 'North Kalimantan',
  'kepulauan riau': 'Riau Islands',
  'riau islands': 'Riau Islands',
  lampung: 'Lampung',
  maluku: 'Maluku',
  'maluku utara': 'North Maluku',
  'north maluku': 'North Maluku',
  'nusa tenggara barat': 'West Nusa Tenggara',
  'west nusa tenggara': 'West Nusa Tenggara',
  ntb: 'West Nusa Tenggara',
  'nusa tenggara timur': 'East Nusa Tenggara',
  'east nusa tenggara': 'East Nusa Tenggara',
  ntt: 'East Nusa Tenggara',
  papua: 'Papua',
  'papua barat': 'West Papua',
  'west papua': 'West Papua',
  'papua barat daya': 'Southwest Papua',
  'southwest papua': 'Southwest Papua',
  'papua pegunungan': 'Highland Papua',
  'highland papua': 'Highland Papua',
  'papua selatan': 'South Papua',
  'south papua': 'South Papua',
  'papua tengah': 'Central Papua',
  'central papua': 'Central Papua',
  riau: 'Riau',
  'sulawesi barat': 'West Sulawesi',
  'west sulawesi': 'West Sulawesi',
  'sulawesi selatan': 'South Sulawesi',
  'south sulawesi': 'South Sulawesi',
  'sulawesi tengah': 'Central Sulawesi',
  'central sulawesi': 'Central Sulawesi',
  'sulawesi tenggara': 'Southeast Sulawesi',
  'southeast sulawesi': 'Southeast Sulawesi',
  'sulawesi utara': 'North Sulawesi',
  'north sulawesi': 'North Sulawesi',
  'sumatera barat': 'West Sumatra',
  'west sumatra': 'West Sumatra',
  'sumatera selatan': 'South Sumatra',
  'south sumatra': 'South Sumatra',
  'sumatera utara': 'North Sumatra',
  'north sumatra': 'North Sumatra',

  // Malaysia
  johor: 'Johor',
  kedah: 'Kedah',
  kelantan: 'Kelantan',
  melaka: 'Malacca',
  malacca: 'Malacca',
  'negeri sembilan': 'Negeri Sembilan',
  pahang: 'Pahang',
  perak: 'Perak',
  perlis: 'Perlis',
  'pulau pinang': 'Penang',
  penang: 'Penang',
  sabah: 'Sabah',
  sarawak: 'Sarawak',
  selangor: 'Selangor',
  terengganu: 'Terengganu',
  'wilayah persekutuan kuala lumpur': 'Kuala Lumpur',
  'kuala lumpur': 'Kuala Lumpur',
  'wilayah persekutuan labuan': 'Labuan',
  labuan: 'Labuan',
  'wilayah persekutuan putrajaya': 'Putrajaya',
  putrajaya: 'Putrajaya',
};

function findMatchedProvince(
  provinces: string[],
  state?: string,
  city?: string,
  subtitle?: string
): string | undefined {
  if (!provinces || provinces.length === 0) return undefined;
  const rawState = (state || '').trim().toLowerCase();
  const rawCity = (city || '').trim().toLowerCase();
  const rawSub = (subtitle || '').trim().toLowerCase();

  // 1. Direct alias match on rawState
  if (rawState && PROVINCE_NAME_ALIASES[rawState]) {
    const target = PROVINCE_NAME_ALIASES[rawState];
    const found = provinces.find((p) => p.toLowerCase() === target.toLowerCase());
    if (found) return found;
  }

  // 2. Exact match in provinces list
  if (rawState) {
    const exact = provinces.find((p) => p.toLowerCase() === rawState);
    if (exact) return exact;
  }

  // 3. Substring match against known aliases
  for (const [alias, target] of Object.entries(PROVINCE_NAME_ALIASES)) {
    if (
      (rawState && (rawState.includes(alias) || alias.includes(rawState))) ||
      (rawCity && rawCity.includes(alias)) ||
      (rawSub && rawSub.includes(alias))
    ) {
      const found = provinces.find((p) => p.toLowerCase() === target.toLowerCase());
      if (found) return found;
    }
  }

  // 4. Fallback: Check if city or subtitle mentions any province directly
  for (const prov of provinces) {
    const pLower = prov.toLowerCase();
    if (pLower.length > 3 && (rawCity.includes(pLower) || rawSub.includes(pLower))) {
      return prov;
    }
  }

  return undefined;
}

  const handleSelectDeliverySuggestion = (item: any) => {
    const filled: { city?: boolean; province?: boolean; postalCode?: boolean } = {};

    setAddress((prev) => {
      const next = { ...prev };
      next.addressLine1 = item.title
        ? `${item.title}${item.addressLine1 && item.addressLine1 !== item.title ? ', ' + item.addressLine1 : ''}`
        : item.addressLine1;
      if (item.postalCode) {
        next.postalCode = item.postalCode;
        filled.postalCode = true;
      }
      if (item.city && prev.country !== 'Singapore') {
        next.city = item.city;
        filled.city = true;
      }
      if (prev.country !== 'Singapore') {
        const matched = findMatchedProvince(
          availableProvinces,
          item.state,
          item.city,
          item.subtitle
        );
        if (matched) {
          next.province = matched;
          filled.province = true;
        }
      }
      return next;
    });

    setAutofilledFields(filled);
    setTimeout(() => {
      setAutofilledFields({});
    }, 800);

    setShowSuggestions(false);
  };

  const handleSelectBillingSuggestion = (item: any) => {
    const filled: { city?: boolean; province?: boolean; postalCode?: boolean } = {};

    setBillingAddress((prev) => {
      const next = { ...prev };
      next.addressLine1 = item.title
        ? `${item.title}${item.addressLine1 && item.addressLine1 !== item.title ? ', ' + item.addressLine1 : ''}`
        : item.addressLine1;
      if (item.postalCode) {
        next.postalCode = item.postalCode;
        filled.postalCode = true;
      }
      if (item.city && prev.country !== 'Singapore') {
        next.city = item.city;
        filled.city = true;
      }
      if (prev.country !== 'Singapore') {
        const matched = findMatchedProvince(
          billingProvinces,
          item.state,
          item.city,
          item.subtitle
        );
        if (matched) {
          next.province = matched;
          filled.province = true;
        }
      }
      return next;
    });

    setAutofilledBillingFields(filled);
    setTimeout(() => {
      setAutofilledBillingFields({});
    }, 800);

    setShowBillingSuggestions(false);
  };

  // Discount Voucher / Gift Card State
  const [discountInput, setDiscountInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState<{
    code: string;
    percent?: number;
    amount?: number;
    label: string;
  } | null>(null);
  const [discountError, setDiscountError] = useState('');

  // Mobile Order Summary Collapsible Accordion State
  const [showMobileSummary, setShowMobileSummary] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isCapturingPayment, setIsCapturingPayment] = useState(false);
  const [orderRef, setOrderRef] = useState('');
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);

  // Items from cart
  const items = useMemo(() => {
    return lines.map((l) => ({
      id: l.variantId,
      name: l.name,
      size: l.size || 'Standard',
      color: l.color || 'Signature',
      qty: l.qty,
      price: l.price,
      image:
        l.image ||
        'https://images.unsplash.com/photo-1625910513413-562a14e91ceb?auto=format&fit=crop&w=400&q=80',
    }));
  }, [lines]);

  // Handle return from PayPal Checkout
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const gateway = params.get('gateway');
    const token = params.get('token');
    const status = params.get('status');
    const refParam = params.get('ref');

    if (gateway === 'paypal' && (status === 'approved' || token)) {
      const orderToken = token || params.get('PayerID') || '';
      if (orderToken) {
        setIsCapturingPayment(true);
        apiFetch('/api/checkout/paypal/capture-order', {
          method: 'POST',
          body: JSON.stringify({ token: orderToken, paypalOrderId: orderToken }),
        })
          .then((res) => {
            if (res && res.success) {
              const saved = sessionStorage.getItem('ladrim_last_order');
              let snapshot: any = null;
              if (saved) {
                try {
                  snapshot = JSON.parse(saved);
                } catch {}
              }
              const finalRef =
                refParam ||
                snapshot?.orderRef ||
                sessionStorage.getItem('ladrim_pending_order_ref') ||
                `LDRM-PP-${Math.floor(100000 + Math.random() * 900000)}`;
              
              if (snapshot) {
                snapshot.orderRef = finalRef;
                snapshot.paymentMethod = 'PayPal';
                setCompletedOrder(snapshot);
              }
              setOrderRef(finalRef);
              setIsCompleted(true);
              clear();
              window.history.replaceState({}, document.title, window.location.pathname);
            } else {
              alert(res?.error || 'Failed to capture PayPal payment. Please contact support.');
            }
          })
          .catch((err) => {
            console.error('PayPal capture error:', err);
            alert(err.message || 'Error completing PayPal payment.');
          })
          .finally(() => {
            setIsCapturingPayment(false);
          });
      }
    } else if (gateway === 'paypal' && status === 'cancelled') {
      alert('PayPal payment was cancelled. You can try again or choose another payment method.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Load user profile on mount if available (Do NOT prefill first/last name)
  useEffect(() => {
    const initUserData = async () => {
      try {
        const res = await fetch('/api/auth/me', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.user) {
            setEmail((prev) => prev || data.user.email || '');
          }
        }
      } catch {
        // ignore
      }
    };

    initUserData();
  }, []);

  const subtotal = useMemo(
    () => items.reduce((acc, i) => acc + i.price * i.qty, 0),
    [items]
  );

  // Delivery address postal code validation
  const deliveryPostalValidation = useMemo(() => {
    return validatePostalCode(address.country, address.province, address.postalCode);
  }, [address.country, address.province, address.postalCode]);

  // Billing address postal code validation
  const billingPostalValidation = useMemo(() => {
    if (billingOption !== 'different') return { isValid: true };
    return validatePostalCode(billingAddress.country, billingAddress.province, billingAddress.postalCode);
  }, [billingOption, billingAddress.country, billingAddress.province, billingAddress.postalCode]);

  // Check if delivery address is completely filled and valid (dynamically adapted per country)
  const isAddressComplete = useMemo(() => {
    if (
      !address.country ||
      !address.firstName.trim() ||
      !address.lastName.trim() ||
      !address.addressLine1.trim() ||
      !address.phone.trim()
    ) {
      return false;
    }
    if (!deliveryPostalValidation.isValid) {
      return false;
    }
    // Singapore is a city-state without separate city/province
    if (address.country === 'Singapore') {
      return true;
    }
    // Indonesia & Malaysia require city & state/province
    return Boolean(address.city.trim() && address.province);
  }, [address, deliveryPostalValidation.isValid]);

  // Check if cart unlocked Free Delivery (Threshold $150 USD)
  const isFreeDelivery = useMemo(() => {
    return subtotal >= 150;
  }, [subtotal]);

  // Dynamic shipping options: Free Delivery applies ONLY to Standard ($0.00). Express is always a paid option ($17.50).
  const shippingOptions = useMemo<ShippingOption[]>(() => {
    if (isFreeDelivery) {
      return [
        {
          id: 'standard',
          name: 'Standard Delivery (7-14 Working Days)',
          timeframe: '7-14 Working Days',
          cost: 0,
        },
        {
          id: 'express',
          name: 'Express Delivery (2-4 Working Days)',
          timeframe: '2-4 Working Days',
          cost: 17.50,
        },
      ];
    }
    return [
      {
        id: 'standard',
        name: 'Standard (7-14 Working Days)',
        timeframe: '7-14 Working Days',
        cost: 9.50,
      },
      {
        id: 'express',
        name: 'Express (2-4 Working Days)',
        timeframe: '2-4 Working Days',
        cost: 17.50,
      },
    ];
  }, [isFreeDelivery]);

  // Shipping Speed State: starts unselected ('').
  // Can only be selected once address is complete.
  // If cart qualifies for Free Delivery, auto-selects Standard Delivery ($0.00). Otherwise user must pick.
  const [shippingMethod, setShippingMethod] = useState<'standard' | 'express' | ''>('');

  useEffect(() => {
    if (!isAddressComplete) {
      setShippingMethod('');
      return;
    }
    if (isFreeDelivery) {
      setShippingMethod('standard');
    }
  }, [isAddressComplete, isFreeDelivery]);

  const selectedShipping =
    shippingOptions.find((s) => s.id === shippingMethod) || null;
  const shippingCost = selectedShipping ? selectedShipping.cost : 0;

  // Calculate Voucher Discount
  const discountAmount = useMemo(() => {
    if (!appliedDiscount) return 0;
    if (appliedDiscount.percent) {
      return (subtotal * appliedDiscount.percent) / 100;
    }
    if (appliedDiscount.amount) {
      return Math.min(appliedDiscount.amount, subtotal);
    }
    return 0;
  }, [appliedDiscount, subtotal]);

  const grandTotal = Math.max(0, subtotal - discountAmount + shippingCost);

  const handleApplyDiscount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setDiscountError('');
    const clean = discountInput.trim().toUpperCase();
    if (!clean) return;

    if (clean === 'GYMSHARK') {
      setAppliedDiscount({
        code: 'GYMSHARK',
        percent: 15,
        label: '15% Off Gymshark VIP',
      });
      setDiscountInput('');
    } else if (clean === 'LADRIM10') {
      setAppliedDiscount({
        code: 'LADRIM10',
        percent: 10,
        label: '10% Off Welcome Privilege',
      });
      setDiscountInput('');
    } else if (clean === 'VIP25') {
      setAppliedDiscount({
        code: 'VIP25',
        amount: 25,
        label: '$25 Off VIP Club',
      });
      setDiscountInput('');
    } else {
      setDiscountError('Enter a valid gift card or discount code');
    }
  };

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null);
    setDiscountError('');
  };

  const handleCompleteOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.country) {
      alert('Please select your country/region.');
      return;
    }
    if (!address.firstName.trim() || !address.lastName.trim() || !address.addressLine1.trim() || !address.postalCode.trim() || !address.phone.trim()) {
      alert('Please fill in your delivery address.');
      return;
    }
    if (address.country !== 'Singapore' && (!address.city.trim() || !address.province)) {
      alert('Please select your state and city.');
      return;
    }
    if (!deliveryPostalValidation.isValid) {
      alert(deliveryPostalValidation.error || 'Please enter a valid postal code matching your address.');
      return;
    }
    if (!shippingMethod) {
      alert('Please select a shipping method.');
      return;
    }
    if (!paymentMethod) {
      alert('Please select a payment method.');
      return;
    }
    if (paymentMethod === 'credit_card') {
      if (!cardDetails.number.trim() || !cardDetails.expiry.trim() || !cardDetails.cvv.trim()) {
        alert('Please enter your credit card details.');
        return;
      }
    }
    if (!billingOption) {
      alert('Please select a billing address option.');
      return;
    }
    if (billingOption === 'different') {
      if (!billingAddress.country || !billingAddress.firstName.trim() || !billingAddress.lastName.trim() || !billingAddress.addressLine1.trim() || !billingAddress.postalCode.trim() || !billingAddress.phone.trim()) {
        alert('Please fill in your billing address.');
        return;
      }
      if (billingAddress.country !== 'Singapore' && (!billingAddress.city.trim() || !billingAddress.province)) {
        alert('Please fill in your complete billing address.');
        return;
      }
      if (!billingPostalValidation.isValid) {
        alert(`Billing Address: ${billingPostalValidation.error || 'Invalid postal code'}`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const orderRefId = `LDRM-${Math.floor(100000 + Math.random() * 900000)}`;
      const customerFullName = `${address.firstName} ${address.lastName}`.trim() || 'Valued Customer';
      
      const orderSnapshot = {
        orderRef: orderRefId,
        customerName: customerFullName,
        firstName: address.firstName || 'Customer',
        lastName: address.lastName || '',
        email: email || 'customer@ladrim.com',
        shippingAddress: { ...address },
        billingAddress: billingOption === 'different' ? { ...billingAddress } : undefined,
        shippingMethod: selectedShipping ? `${selectedShipping.name}` : 'Standard Shipping',
        shippingTimeframe: selectedShipping?.timeframe || '7-14 Working Days',
        shippingCost: Number(shippingCost) || 0,
        paymentMethod: paymentMethod === 'paypal' ? 'PayPal' : 'Credit Card',
        items: items.length > 0 ? [...items] : [],
        subtotal: Number(subtotal) || 0,
        discountAmount: Number(discountAmount) || 0,
        discountCode: appliedDiscount?.code,
        grandTotal: Number(grandTotal) || Number(subtotal),
        paidAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      // 1. IF PAYPAL IS SELECTED: REDIRECT TO PAYPAL SANDBOX/LIVE FOR PAYMENT
      if (paymentMethod === 'paypal') {
        sessionStorage.setItem('ladrim_last_order', JSON.stringify(orderSnapshot));
        const res = await apiFetch('/api/checkout/paypal/create-order', {
          method: 'POST',
          body: JSON.stringify({
            amount: grandTotal,
            currency: 'USD',
            email: email || 'customer@ladrim.com',
            address: billingOption === 'different' ? { ...address, billingAddress } : address,
            items,
            courier: selectedShipping?.name || 'Standard (7-14 Working Days)',
            shippingCost,
            subtotal,
            discount: discountAmount,
          }),
        });

        if (res && res.approvalUrl) {
          orderSnapshot.orderRef = res.referenceId || orderRefId;
          sessionStorage.setItem('ladrim_last_order', JSON.stringify(orderSnapshot));
          sessionStorage.setItem('ladrim_pending_order_ref', res.referenceId || '');
          sessionStorage.setItem('ladrim_pending_paypal_id', res.paypalOrderId || '');
          // REDIRECT USER TO PAYPAL TO COMPLETE PAYMENT
          window.location.href = res.approvalUrl;
          return;
        } else {
          throw new Error(res?.error || 'Failed to initiate PayPal Checkout. Please check your PayPal API credentials.');
        }
      }

      // 2. CREDIT CARD OR OTHER METHODS
      const payload = {
        email: email || 'customer@ladrim.com',
        address: billingOption === 'different' ? { ...address, billingAddress } : address,
        items,
        courier: selectedShipping?.name || 'Standard (7-14 Working Days)',
        shippingCost,
        subtotal,
        discount: discountAmount,
        total: grandTotal,
        paymentMethod: 'Credit Card',
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      const finalGeneratedRef = data.ref || orderRefId;
      orderSnapshot.orderRef = finalGeneratedRef;

      setCompletedOrder(orderSnapshot);
      sessionStorage.setItem('ladrim_last_order', JSON.stringify(orderSnapshot));
      setOrderRef(finalGeneratedRef);
      setIsCompleted(true);
      clear();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      console.error('Checkout error:', err);
      alert(err.message || 'Payment processing failed. Please check your payment details or try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // VERIFYING / CAPTURING PAYPAL SCREEN
  if (isCapturingPayment) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass rounded-2xl border border-neutral-200 text-center space-y-4 shadow-sm animate-fadeIn">
        <Loader2 size={36} className="animate-spin text-neutral-800 mx-auto" />
        <h2 className="text-lg font-bold text-ink">Verifying PayPal Payment...</h2>
        <p className="text-xs text-neutral-500">Please wait a moment while we authorize and confirm your transaction with PayPal.</p>
      </div>
    );
  }

  // SUCCESS / ORDER COMPLETED SCREEN
  if (isCompleted) {
    const orderData = completedOrder || {
      orderRef: orderRef || 'LDRM-505611',
      customerName: `${address.firstName} ${address.lastName}`.trim() || 'Valued Customer',
      firstName: address.firstName || 'Customer',
      lastName: address.lastName || '',
      email: email || 'customer@ladrim.com',
      shippingAddress: address,
      shippingMethod: selectedShipping?.name || 'Standard Shipping',
      shippingTimeframe: selectedShipping?.timeframe || '7-14 Working Days',
      shippingCost: shippingCost || 0,
      paymentMethod: paymentMethod === 'paypal' ? 'PayPal' : 'Credit Card',
      items: items,
      subtotal: subtotal || grandTotal,
      discountAmount: discountAmount || 0,
      discountCode: appliedDiscount?.code,
      grandTotal: grandTotal || subtotal,
      paidAt: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: lux }}
        className="max-w-2xl mx-auto space-y-5 py-4"
      >
        <div className="glass p-6 sm:p-10 text-center rounded-sm border border-black/10 shadow-sm space-y-6">
          {/* Header Icon & Status */}
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-ink text-white shadow-md">
            <CheckCircle2 size={30} />
          </div>

          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold tracking-widest uppercase text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full inline-block border border-emerald-200">
              Payment Confirmed
            </span>
            <h1 className="text-2xl sm:text-3xl text-ink font-bold">
              Thank you, {orderData.firstName || orderData.customerName}!
            </h1>
            <p className="text-xs sm:text-sm text-neutral-600">
              Your order is confirmed. A receipt and real-time tracking will be sent to{' '}
              <span className="font-medium text-ink">{orderData.email}</span>.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 text-xs text-neutral-500">
              <span className="bg-neutral-100 text-ink font-semibold tracking-wider px-2.5 py-0.5 rounded">
                Order #{orderData.orderRef}
              </span>
              <span>•</span>
              <span>{orderData.paidAt}</span>
            </div>
          </div>

          {/* Full & Complete Order Details Breakdown */}
          <div className="max-w-xl mx-auto bg-white/95 p-5 sm:p-6 rounded-sm border border-neutral-200 text-left text-xs sm:text-sm space-y-4 shadow-2xs">
            {/* 1. Items Purchased Section */}
            {orderData.items && orderData.items.length > 0 && (
              <div className="border-b border-neutral-100 pb-3">
                <p className="text-neutral-400 uppercase text-[10px] tracking-wider font-semibold mb-2">
                  Items Ordered ({orderData.items.reduce((acc: number, i: any) => acc + (i.qty || 1), 0)})
                </p>
                <div className="divide-y divide-neutral-100 max-h-56 overflow-y-auto pr-1">
                  {orderData.items.map((item: any, idx: number) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-12 w-12 rounded-sm bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-ink truncate">{item.name}</p>
                          <p className="text-[11px] text-neutral-500">
                            {item.size} • {item.color} • Qty: {item.qty}
                          </p>
                        </div>
                      </div>
                      <span className="font-semibold text-ink shrink-0">
                        ${(item.price * item.qty).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 2. Delivery & Payment Details 2-Column Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-neutral-100 pb-4">
              <div>
                <p className="text-neutral-400 uppercase text-[10px] tracking-wider font-semibold mb-1">
                  Delivery Address
                </p>
                <p className="font-semibold text-ink">
                  {orderData.shippingAddress?.firstName || orderData.customerName} {orderData.shippingAddress?.lastName || ''}
                </p>
                {orderData.shippingAddress?.addressLine1 && (
                  <p className="text-neutral-600 text-xs mt-0.5">{orderData.shippingAddress.addressLine1}</p>
                )}
                {orderData.shippingAddress?.addressLine2 && (
                  <p className="text-neutral-600 text-xs">{orderData.shippingAddress.addressLine2}</p>
                )}
                <p className="text-neutral-600 text-xs">
                  {[orderData.shippingAddress?.city, orderData.shippingAddress?.province, orderData.shippingAddress?.postalCode]
                    .filter(Boolean)
                    .join(', ')}
                </p>
                {orderData.shippingAddress?.country && (
                  <p className="text-neutral-600 text-xs">{orderData.shippingAddress.country}</p>
                )}
                {orderData.shippingAddress?.phone && (
                  <p className="text-neutral-500 text-[11px] mt-1">Phone: {orderData.shippingAddress.phone}</p>
                )}
              </div>

              <div>
                <p className="text-neutral-400 uppercase text-[10px] tracking-wider font-semibold mb-1">
                  Payment & Shipping
                </p>
                <div className="space-y-1.5">
                  <div>
                    <span className="text-[11px] text-neutral-500 block">Method:</span>
                    <span className="font-semibold text-ink">
                      {orderData.paymentMethod === 'paypal' || orderData.paymentMethod === 'PayPal' ? (
                        <span className="text-[#003087] italic font-bold">PayPal</span>
                      ) : (
                        'Credit Card / Debit'
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] text-neutral-500 block">Shipping Speed:</span>
                    <span className="font-semibold text-ink">
                      {orderData.shippingMethod}
                    </span>
                    {orderData.shippingTimeframe && (
                      <span className="text-[11px] text-neutral-500 block">
                        Estimated: {orderData.shippingTimeframe}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Financial Summary */}
            <div className="pt-1 space-y-1.5 text-xs text-neutral-600">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">${Number(orderData.subtotal).toFixed(2)}</span>
              </div>
              {orderData.discountAmount > 0 && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Discount {orderData.discountCode ? `(${orderData.discountCode})` : ''}</span>
                  <span className="font-semibold">-${Number(orderData.discountAmount).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span>Shipping Fee</span>
                <span className="font-semibold text-ink">
                  {orderData.shippingCost === 0 ? 'FREE' : `$${Number(orderData.shippingCost).toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm font-bold text-ink pt-2.5 border-t border-neutral-200">
                <span>Total Paid</span>
                <span className="font-bold text-lg text-ink">
                  USD ${Number(orderData.grandTotal).toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
            <a href="/" className="btn-ink w-full sm:w-auto text-xs px-6 py-2.5">
              Continue Shopping
            </a>
            <a
              href="/account"
              className="btn-line w-full sm:w-auto text-xs px-6 py-2.5 text-center"
            >
              Track Order in Account
            </a>
          </div>
        </div>
      </motion.div>
    );
  }

  // EMPTY CART SCREEN
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-24 px-6 text-center space-y-5">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-neutral-100 text-neutral-400">
          <ShoppingBag size={28} />
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl uppercase tracking-wider text-ink">Your Cart is Empty</h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-sm mx-auto">
            You do not have any items in your cart to checkout.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="/"
            className="btn-ink inline-flex items-center justify-center gap-2 py-3 px-8 text-xs font-semibold uppercase tracking-widest"
          >
            <ArrowLeft size={14} />
            <span>Return to Shop</span>
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-16 w-full max-w-full min-w-0 overflow-x-hidden">
      {/* ================= MAIN 2-COLUMN CHECKOUT GRID ================= */}
      <form onSubmit={handleCompleteOrder} className="w-full max-w-full min-w-0 grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-10">
        {/* ================= LEFT COLUMN: CHECKOUT FORM ================= */}
        <div className="w-full max-w-full min-w-0 lg:col-span-7 space-y-4">
          {/* 1. CONTACT SECTION */}
          <div className="glass p-4 sm:p-5 rounded-sm border border-neutral-200/70 shadow-sm space-y-2.5 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base sm:text-lg text-ink font-semibold tracking-normal">
                Contact
              </h2>
              <a
                href="/account"
                className="text-xs font-semibold text-neutral-700 hover:text-ink underline underline-offset-2 transition-colors shrink-0"
              >
                Sign in
              </a>
            </div>

            <div className="relative w-full">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="w-full bg-white border border-neutral-300 pl-3 pr-8 py-2 text-xs sm:text-sm outline-none focus:border-ink transition-colors rounded-sm"
              />
              <HelpCircle
                size={14}
                className="absolute right-3 top-2.5 text-neutral-400 pointer-events-none"
              />
            </div>

            <label className="flex items-start gap-2 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={newsletter}
                onChange={(e) => setNewsletter(e.target.checked)}
                className="mt-0.5 accent-black rounded shrink-0"
              />
              <span className="text-[11px] text-neutral-600 leading-tight">
                Tick here to receive emails about our products, apps, sales, exclusive content and more.
              </span>
            </label>

            <p className="text-[10px] text-neutral-500 pt-0.5">
              View our{' '}
              <a href="#" className="underline text-ink">
                Privacy Policy
              </a>
              .
            </p>
          </div>

          {/* 2. DELIVERY ADDRESS SECTION */}
          <div className="glass p-4 sm:p-5 rounded-sm border border-neutral-200/70 shadow-sm space-y-2.5 w-full max-w-full min-w-0">
            <h2 className="text-base sm:text-lg text-ink font-semibold tracking-normal">
              Delivery
            </h2>

            {/* Country/Region */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                Country
              </label>
              <div className="relative w-full">
                <select
                  required
                  value={address.country}
                  onChange={(e) => handleCountryChange(e.target.value)}
                  className={`w-full bg-white border border-neutral-300 pl-3 pr-8 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm appearance-none cursor-pointer ${!address.country ? 'text-neutral-400' : 'text-ink'
                    }`}
                >
                  <option value="" disabled>
                    Country/Region
                  </option>
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} className="text-ink">
                      {c}
                    </option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-2.5 text-neutral-500 pointer-events-none"
                />
              </div>
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  First name
                </label>
                <input
                  type="text"
                  required
                  value={address.firstName}
                  onChange={(e) => setAddress({ ...address, firstName: e.target.value })}
                  placeholder="First name"
                  className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Last name
                </label>
                <input
                  type="text"
                  required
                  value={address.lastName}
                  onChange={(e) => setAddress({ ...address, lastName: e.target.value })}
                  placeholder="Last name"
                  className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                />
              </div>
            </div>

            {/* Address Line 1 with Autocomplete Search */}
            <div ref={deliverySearchRef} className="relative">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                Address Line 1
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={address.addressLine1}
                  onChange={(e) => {
                    setAddress({ ...address, addressLine1: e.target.value });
                    setShowSuggestions(true);
                  }}
                  onFocus={() => {
                    if (address.addressLine1.length >= 2) setShowSuggestions(true);
                  }}
                  placeholder="Address Line 1"
                  className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm pr-9"
                />
                <div className="absolute right-3 top-2.5 pointer-events-none text-neutral-400">
                  {isLoadingSuggestions ? (
                    <Loader2 size={15} className="animate-spin text-neutral-500" />
                  ) : (
                    <Search size={15} className="text-neutral-400" />
                  )}
                </div>
              </div>

              {/* Suggestions Dropdown Popup */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-sm shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                  <div className="px-3 py-1.5 bg-neutral-50 border-b border-neutral-100 text-[10px] uppercase tracking-wider font-semibold text-neutral-500 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <MapPin size={11} className="text-neutral-400" />
                      Suggested Places
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowSuggestions(false)}
                      className="text-neutral-400 hover:text-ink cursor-pointer"
                    >
                      Close
                    </button>
                  </div>
                  <div className="divide-y divide-neutral-100">
                    {addressSuggestions.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleSelectDeliverySuggestion(item)}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-50/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                      >
                        <MapPin size={14} className="text-neutral-400 group-hover:text-ink shrink-0 mt-0.5 transition-colors" />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium text-ink truncate group-hover:underline">
                            {item.title}
                          </div>
                          {item.subtitle && (
                            <div className="text-[11px] text-neutral-500 truncate">
                              {item.subtitle}
                            </div>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Address Line 2 */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                Address Line 2 (optional)
              </label>
              <input
                type="text"
                value={address.addressLine2}
                onChange={(e) => setAddress({ ...address, addressLine2: e.target.value })}
                placeholder="Address Line 2 (optional)"
                className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
              />
            </div>

            {/* ================= DYNAMIC COUNTRY-SPECIFIC FIELDS ================= */}
            {address.country === 'Singapore' ? (
              /* SINGAPORE: Only Postal code */
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                  Postal code
                </label>
                <div className="relative">
                  <div className={`w-full bg-white border rounded-sm overflow-hidden transition-colors ${address.postalCode.trim() && !deliveryPostalValidation.isValid
                      ? 'border-red-500 bg-red-50/20'
                      : 'border-neutral-300 focus-within:border-ink'
                    }`}>
                    <input
                      type="text"
                      required
                      inputMode="numeric"
                      value={address.postalCode}
                      onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                      placeholder="Postal code"
                      className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none ${address.postalCode.trim() && !deliveryPostalValidation.isValid ? 'pr-9' : ''} ${autofilledFields.postalCode ? 'animate-text-in' : ''}`}
                    />
                  </div>
                  {address.postalCode.trim() && !deliveryPostalValidation.isValid && (
                    <div className="absolute right-3 top-2.5 pointer-events-none">
                      <AlertCircle size={15} className="text-red-500" />
                    </div>
                  )}
                </div>
                {address.postalCode.trim() && !deliveryPostalValidation.isValid && (
                  <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-start gap-1.5 leading-tight animate-fadeIn">
                    <AlertCircle size={13} className="shrink-0 mt-0.5" />
                    <span>{deliveryPostalValidation.error}</span>
                  </p>
                )}
              </div>
            ) : address.country === 'Malaysia' ? (
              /* MALAYSIA: City, State, and Postal Code */
              <div className="space-y-2.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                      City
                    </label>
                    <div className="w-full bg-white border border-neutral-300 rounded-sm overflow-hidden focus-within:border-ink transition-colors">
                      <input
                        type="text"
                        required
                        value={address.city}
                        onChange={(e) => setAddress({ ...address, city: e.target.value })}
                        placeholder="City"
                        className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none ${autofilledFields.city ? 'animate-text-in' : ''}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                      State
                    </label>
                    <div className="relative w-full bg-white border border-neutral-300 rounded-sm overflow-hidden focus-within:border-ink transition-colors">
                      <select
                        required
                        value={address.province}
                        onChange={(e) => setAddress({ ...address, province: e.target.value })}
                        className={`w-full bg-transparent pl-3 pr-8 py-2 text-xs sm:text-sm outline-none appearance-none cursor-pointer ${autofilledFields.province ? 'animate-text-in-delay-1' : ''} ${!address.province ? 'text-neutral-400' : 'text-ink'
                          }`}
                      >
                        <option value="" disabled>
                          State
                        </option>
                        {availableProvinces.map((prov) => (
                          <option key={prov} value={prov} className="text-ink">
                            {prov}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-2.5 text-neutral-500 pointer-events-none"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                    Postal code
                  </label>
                  <div className="relative">
                    <div className={`w-full bg-white border rounded-sm overflow-hidden transition-colors ${address.postalCode.trim() && !deliveryPostalValidation.isValid
                        ? 'border-red-500 bg-red-50/20'
                        : 'border-neutral-300 focus-within:border-ink'
                      }`}>
                      <input
                        type="text"
                        required
                        inputMode="numeric"
                        value={address.postalCode}
                        onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                        placeholder="Postal code"
                        className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none ${address.postalCode.trim() && !deliveryPostalValidation.isValid ? 'pr-9' : ''} ${autofilledFields.postalCode ? 'animate-text-in-delay-2' : ''}`}
                      />
                    </div>
                    {address.postalCode.trim() && !deliveryPostalValidation.isValid && (
                      <div className="absolute right-3 top-2.5 pointer-events-none">
                        <AlertCircle size={15} className="text-red-500" />
                      </div>
                    )}
                  </div>
                  {address.postalCode.trim() && !deliveryPostalValidation.isValid && (
                    <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-start gap-1.5 leading-tight animate-fadeIn">
                      <AlertCircle size={13} className="shrink-0 mt-0.5" />
                      <span>{deliveryPostalValidation.error}</span>
                    </p>
                  )}
                </div>
              </div>
            ) : (
              /* INDONESIA (Default): City, State, and Postal Code */
              <div className="space-y-2.5">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                    City
                  </label>
                  <div className={`w-full bg-white border border-neutral-300 rounded-sm overflow-hidden focus-within:border-ink transition-colors ${!address.country ? 'bg-neutral-100' : ''}`}>
                    <input
                      type="text"
                      required
                      disabled={!address.country}
                      value={address.city}
                      onChange={(e) => setAddress({ ...address, city: e.target.value })}
                      placeholder="City"
                      className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none disabled:text-neutral-400 ${autofilledFields.city ? 'animate-text-in' : ''}`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                      State
                    </label>
                    <div className={`relative w-full bg-white border border-neutral-300 rounded-sm overflow-hidden focus-within:border-ink transition-colors ${!address.country ? 'bg-neutral-100' : ''}`}>
                      <select
                        required
                        disabled={!address.country}
                        value={address.province}
                        onChange={(e) => setAddress({ ...address, province: e.target.value })}
                        className={`w-full bg-transparent pl-3 pr-8 py-2 text-xs sm:text-sm outline-none appearance-none cursor-pointer disabled:text-neutral-400 disabled:cursor-not-allowed ${autofilledFields.province ? 'animate-text-in-delay-1' : ''} ${!address.province ? 'text-neutral-400' : 'text-ink'
                          }`}
                      >
                        <option value="" disabled>
                          State
                        </option>
                        {availableProvinces.map((prov) => (
                          <option key={prov} value={prov} className="text-ink">
                            {prov}
                          </option>
                        ))}
                      </select>
                      <ChevronDown
                        size={14}
                        className="absolute right-3 top-2.5 text-neutral-500 pointer-events-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                      Postal code
                    </label>
                    <div className="relative">
                      <div className={`w-full bg-white border rounded-sm overflow-hidden transition-colors ${address.postalCode.trim() && !deliveryPostalValidation.isValid
                          ? 'border-red-500 bg-red-50/20'
                          : !address.country
                          ? 'border-neutral-300 bg-neutral-100'
                          : 'border-neutral-300 focus-within:border-ink'
                        }`}>
                        <input
                          type="text"
                          required
                          disabled={!address.country}
                          inputMode="numeric"
                          value={address.postalCode}
                          onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
                          placeholder="Postal code"
                          className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none disabled:text-neutral-400 ${address.postalCode.trim() && !deliveryPostalValidation.isValid ? 'pr-9' : ''} ${autofilledFields.postalCode ? 'animate-text-in-delay-2' : ''}`}
                        />
                      </div>
                      {address.postalCode.trim() && !deliveryPostalValidation.isValid && (
                        <div className="absolute right-3 top-2.5 pointer-events-none">
                          <AlertCircle size={15} className="text-red-500" />
                        </div>
                      )}
                    </div>
                    {address.postalCode.trim() && !deliveryPostalValidation.isValid && (
                      <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-start gap-1.5 leading-tight animate-fadeIn">
                        <AlertCircle size={13} className="shrink-0 mt-0.5" />
                        <span>{deliveryPostalValidation.error}</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Phone */}
            <div>
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                Phone
              </label>
              <input
                type="tel"
                required
                value={address.phone}
                onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                placeholder="Phone"
                className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
              />
            </div>
          </div>

          {/* 3. SHIPPING METHOD SECTION */}
          <div className="glass p-4 sm:p-5 rounded-sm border border-neutral-200/70 shadow-sm space-y-2.5 w-full max-w-full min-w-0">
            <h2 className="text-base sm:text-lg text-ink font-semibold tracking-normal flex items-center gap-2">
              <Truck size={18} className="text-neutral-700 shrink-0" />
              <span>Shipping Method</span>
            </h2>

            {!isAddressComplete ? (
              <div className="border border-dashed border-neutral-300 rounded-sm p-4 bg-neutral-50/70 text-center">
                <p className="text-xs text-neutral-500">
                  Please complete your delivery address above to view available shipping methods.
                </p>
              </div>
            ) : (
              <div className="border border-neutral-300 rounded-sm overflow-hidden divide-y divide-neutral-200 bg-white w-full">
                {shippingOptions.map((opt) => {
                  const isSelected = shippingMethod === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-center justify-between gap-3 p-3 cursor-pointer transition-colors ${isSelected ? 'bg-neutral-50/90 font-medium' : 'hover:bg-neutral-50/50'
                        }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input
                          type="radio"
                          name="shippingOption"
                          checked={isSelected}
                          onChange={() => setShippingMethod(opt.id)}
                          className="h-4 w-4 accent-black cursor-pointer shrink-0"
                        />
                        <span className="text-xs sm:text-sm text-ink truncate">
                          {opt.name}
                        </span>
                      </div>
                      <span className={`text-xs sm:text-sm font-bold shrink-0 ${opt.cost === 0 ? 'text-emerald-700' : 'text-ink'}`}>
                        {opt.cost === 0 ? 'FREE' : `$${opt.cost.toFixed(2)}`}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. PAYMENT SECTION */}
          <div className="glass p-4 sm:p-5 rounded-sm border border-neutral-200/70 shadow-sm space-y-2.5 w-full max-w-full min-w-0">
            <div>
              <h2 className="text-base sm:text-lg text-ink font-semibold tracking-normal flex items-center gap-2">
                <CreditCard size={18} className="text-neutral-700 shrink-0" />
                <span>Payment</span>
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                All transactions are secure and encrypted.
              </p>
            </div>

            <div className="border border-neutral-300 rounded-sm overflow-hidden divide-y divide-neutral-200 bg-white w-full">
              {/* Option 1: Credit Card */}
              <div>
                <label
                  className={`flex items-center justify-between gap-3 p-3 cursor-pointer transition-colors ${paymentMethod === 'credit_card' ? 'bg-neutral-50/90 font-medium' : 'hover:bg-neutral-50/50'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="credit_card"
                      checked={paymentMethod === 'credit_card'}
                      onChange={() => setPaymentMethod('credit_card')}
                      className="h-4 w-4 accent-black cursor-pointer shrink-0"
                    />
                    <span className="text-xs sm:text-sm text-ink">
                      Credit Card
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <div className="h-5 px-1.5 bg-[#1A1F71] text-white text-[8px] font-black italic rounded flex items-center justify-center">
                      VISA
                    </div>
                    <div className="h-5 px-1 bg-neutral-900 rounded flex items-center justify-center gap-0.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#EB001B] inline-block -mr-1" />
                      <span className="w-2.5 h-2.5 rounded-full bg-[#F79E1B] inline-block opacity-90" />
                    </div>
                    <div className="h-5 px-1.5 bg-[#006FCF] text-white text-[8px] font-black rounded flex items-center justify-center">
                      AMEX
                    </div>
                  </div>
                </label>

                {paymentMethod === 'credit_card' && (
                  <div className="p-4 bg-neutral-50/60 border-t border-neutral-200 space-y-3">
                    <div>
                      <input
                        type="text"
                        required={paymentMethod === 'credit_card'}
                        value={cardDetails.number}
                        onChange={(e) => setCardDetails({ ...cardDetails, number: e.target.value })}
                        placeholder="Card number"
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        required={paymentMethod === 'credit_card'}
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        placeholder="Expiration date (MM / YY)"
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                      />
                      <div className="relative">
                        <input
                          type="password"
                          maxLength={4}
                          required={paymentMethod === 'credit_card'}
                          value={cardDetails.cvv}
                          onChange={(e) => setCardDetails({ ...cardDetails, cvv: e.target.value })}
                          placeholder="Security code (CVV)"
                          className="w-full bg-white border border-neutral-300 pl-3 pr-7 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                        />
                        <Lock size={12} className="absolute right-2.5 top-3 text-neutral-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <input
                        type="text"
                        required={paymentMethod === 'credit_card'}
                        value={cardDetails.name}
                        onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                        placeholder="Name on card"
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Option 2: PayPal */}
              <div>
                <label
                  className={`flex items-center justify-between gap-3 p-3 cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'bg-neutral-50/90 font-medium' : 'hover:bg-neutral-50/50'
                    }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paypal"
                      checked={paymentMethod === 'paypal'}
                      onChange={() => setPaymentMethod('paypal')}
                      className="h-4 w-4 accent-black cursor-pointer shrink-0"
                    />
                    <span className="text-xs sm:text-sm text-ink">
                      PayPal
                    </span>
                  </div>
                  <div className="flex items-center gap-1 font-bold italic tracking-normal text-xs sm:text-sm shrink-0">
                    <span className="text-[#003087]">Pay</span>
                    <span className="text-[#0079C1]">Pal</span>
                  </div>
                </label>

                {paymentMethod === 'paypal' && (
                  <div className="p-4 bg-neutral-50/60 border-t border-neutral-200 text-center text-xs text-neutral-600 space-y-1">
                    <p className="font-medium text-ink">You will be redirected to PayPal to complete your purchase securely.</p>
                    <p className="text-[11px] text-neutral-400">After payment authorization, you will return to LADRIM for confirmation.</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 5. BILLING ADDRESS SECTION */}
          <div className="glass p-4 sm:p-5 rounded-sm border border-neutral-200/70 shadow-sm space-y-2.5 w-full max-w-full min-w-0">
            <h2 className="text-base sm:text-lg text-ink font-semibold tracking-normal">
              Billing Address
            </h2>

            <div className="border border-neutral-300 rounded-sm overflow-hidden divide-y divide-neutral-200 bg-white w-full">
              <label
                className={`flex items-center gap-2.5 p-3 cursor-pointer text-xs sm:text-sm transition-colors ${billingOption === 'same' ? 'bg-neutral-50/90 font-medium' : 'hover:bg-neutral-50/50'
                  }`}
              >
                <input
                  type="radio"
                  name="billingAddress"
                  value="same"
                  checked={billingOption === 'same'}
                  onChange={() => setBillingOption('same')}
                  className="h-4 w-4 accent-black cursor-pointer shrink-0"
                />
                <span className="text-ink">Same as shipping address</span>
              </label>

              <div>
                <label
                  className={`flex items-center gap-2.5 p-3 cursor-pointer text-xs sm:text-sm transition-colors ${billingOption === 'different' ? 'bg-neutral-50/90 font-medium' : 'hover:bg-neutral-50/50'
                    }`}
                >
                  <input
                    type="radio"
                    name="billingAddress"
                    value="different"
                    checked={billingOption === 'different'}
                    onChange={() => setBillingOption('different')}
                    className="h-4 w-4 accent-black cursor-pointer shrink-0"
                  />
                  <span className="text-ink">Use a different billing address</span>
                </label>

                {billingOption === 'different' && (
                  <div className="p-4 bg-neutral-50/60 border-t border-neutral-200 space-y-2.5">
                    {/* Billing Country */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                        Country
                      </label>
                      <div className="relative w-full">
                        <select
                          required={billingOption === 'different'}
                          value={billingAddress.country}
                          onChange={(e) => handleBillingCountryChange(e.target.value)}
                          className={`w-full bg-white border border-neutral-300 pl-3 pr-8 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm appearance-none cursor-pointer ${!billingAddress.country ? 'text-neutral-400' : 'text-ink'
                            }`}
                        >
                          <option value="" disabled>
                            Country/Region
                          </option>
                          {COUNTRIES.map((c) => (
                            <option key={c} value={c} className="text-ink">
                              {c}
                            </option>
                          ))}
                        </select>
                        <ChevronDown
                          size={14}
                          className="absolute right-3 top-2.5 text-neutral-500 pointer-events-none"
                        />
                      </div>
                    </div>

                    {/* Billing First Name & Last Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                          First name
                        </label>
                        <input
                          type="text"
                          required={billingOption === 'different'}
                          value={billingAddress.firstName}
                          onChange={(e) => setBillingAddress({ ...billingAddress, firstName: e.target.value })}
                          placeholder="First name"
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                          Last name
                        </label>
                        <input
                          type="text"
                          required={billingOption === 'different'}
                          value={billingAddress.lastName}
                          onChange={(e) => setBillingAddress({ ...billingAddress, lastName: e.target.value })}
                          placeholder="Last name"
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                        />
                      </div>
                    </div>

                    {/* Billing Address Line 1 with Autocomplete Search */}
                    <div ref={billingSearchRef} className="relative">
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                        Address Line 1
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          required={billingOption === 'different'}
                          value={billingAddress.addressLine1}
                          onChange={(e) => {
                            setBillingAddress({ ...billingAddress, addressLine1: e.target.value });
                            setShowBillingSuggestions(true);
                          }}
                          onFocus={() => {
                            if (billingAddress.addressLine1.length >= 2) setShowBillingSuggestions(true);
                          }}
                          placeholder="Address Line 1"
                          className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm pr-9"
                        />
                        <div className="absolute right-3 top-2.5 pointer-events-none text-neutral-400">
                          {isLoadingBillingSuggestions ? (
                            <Loader2 size={15} className="animate-spin text-neutral-500" />
                          ) : (
                            <Search size={15} className="text-neutral-400" />
                          )}
                        </div>
                      </div>

                      {/* Billing Suggestions Dropdown */}
                      {showBillingSuggestions && billingSuggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-sm shadow-xl z-50 overflow-hidden max-h-56 overflow-y-auto">
                          <div className="px-3 py-1.5 bg-neutral-50 border-b border-neutral-100 text-[10px] uppercase tracking-wider font-semibold text-neutral-500 flex items-center justify-between">
                            <span className="flex items-center gap-1.5">
                              <MapPin size={11} className="text-neutral-400" />
                              Suggested Places
                            </span>
                            <button
                              type="button"
                              onClick={() => setShowBillingSuggestions(false)}
                              className="text-neutral-400 hover:text-ink cursor-pointer"
                            >
                              Close
                            </button>
                          </div>
                          <div className="divide-y divide-neutral-100">
                            {billingSuggestions.map((item, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectBillingSuggestion(item)}
                                className="w-full text-left px-3 py-2 hover:bg-neutral-50/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                              >
                                <MapPin size={14} className="text-neutral-400 group-hover:text-ink shrink-0 mt-0.5 transition-colors" />
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs font-medium text-ink truncate group-hover:underline">
                                    {item.title}
                                  </div>
                                  {item.subtitle && (
                                    <div className="text-[11px] text-neutral-500 truncate">
                                      {item.subtitle}
                                    </div>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Billing Address Line 2 */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                        Address Line 2 (optional)
                      </label>
                      <input
                        type="text"
                        value={billingAddress.addressLine2}
                        onChange={(e) => setBillingAddress({ ...billingAddress, addressLine2: e.target.value })}
                        placeholder="Address Line 2 (optional)"
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                      />
                    </div>

                    {/* DYNAMIC BILLING FIELDS */}
                    {billingAddress.country === 'Singapore' ? (
                      /* SINGAPORE: Only Postal code */
                      <div>
                        <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                          Postal code
                        </label>
                        <div className="relative">
                          <div className={`w-full bg-white border rounded-sm overflow-hidden transition-colors ${billingAddress.postalCode.trim() && !billingPostalValidation.isValid
                              ? 'border-red-500 bg-red-50/20'
                              : 'border-neutral-300 focus-within:border-ink'
                            }`}>
                            <input
                              type="text"
                              required={billingOption === 'different'}
                              inputMode="numeric"
                              value={billingAddress.postalCode}
                              onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                              placeholder="Postal code"
                              className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none ${billingAddress.postalCode.trim() && !billingPostalValidation.isValid ? 'pr-9' : ''} ${autofilledBillingFields.postalCode ? 'animate-text-in' : ''}`}
                            />
                          </div>
                          {billingAddress.postalCode.trim() && !billingPostalValidation.isValid && (
                            <div className="absolute right-3 top-2.5 pointer-events-none">
                              <AlertCircle size={15} className="text-red-500" />
                            </div>
                          )}
                        </div>
                        {billingAddress.postalCode.trim() && !billingPostalValidation.isValid && (
                          <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-start gap-1.5 leading-tight animate-fadeIn">
                            <AlertCircle size={13} className="shrink-0 mt-0.5" />
                            <span>{billingPostalValidation.error}</span>
                          </p>
                        )}
                      </div>
                    ) : billingAddress.country === 'Malaysia' ? (
                      /* MALAYSIA: City, State, and Postal Code */
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                              City
                            </label>
                            <div className="w-full bg-white border border-neutral-300 rounded-sm overflow-hidden focus-within:border-ink transition-colors">
                              <input
                                type="text"
                                required={billingOption === 'different'}
                                value={billingAddress.city}
                                onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                                placeholder="City"
                                className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none ${autofilledBillingFields.city ? 'animate-text-in' : ''}`}
                              />
                            </div>
                          </div>
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                              State
                            </label>
                            <div className="relative w-full bg-white border border-neutral-300 rounded-sm overflow-hidden focus-within:border-ink transition-colors">
                              <select
                                required={billingOption === 'different'}
                                value={billingAddress.province}
                                onChange={(e) => setBillingAddress({ ...billingAddress, province: e.target.value })}
                                className={`w-full bg-transparent pl-3 pr-8 py-2 text-xs sm:text-sm outline-none appearance-none cursor-pointer ${autofilledBillingFields.province ? 'animate-text-in-delay-1' : ''} ${!billingAddress.province ? 'text-neutral-400' : 'text-ink'
                                  }`}
                              >
                                <option value="" disabled>
                                  State
                                </option>
                                {billingProvinces.map((prov) => (
                                  <option key={prov} value={prov} className="text-ink">
                                    {prov}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={14}
                                className="absolute right-3 top-2.5 text-neutral-500 pointer-events-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                            Postal code
                          </label>
                          <div className="relative">
                            <div className={`w-full bg-white border rounded-sm overflow-hidden transition-colors ${billingAddress.postalCode.trim() && !billingPostalValidation.isValid
                                ? 'border-red-500 bg-red-50/20'
                                : 'border-neutral-300 focus-within:border-ink'
                              }`}>
                              <input
                                type="text"
                                required={billingOption === 'different'}
                                inputMode="numeric"
                                value={billingAddress.postalCode}
                                onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                                placeholder="Postal code"
                                className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none ${billingAddress.postalCode.trim() && !billingPostalValidation.isValid ? 'pr-9' : ''} ${autofilledBillingFields.postalCode ? 'animate-text-in-delay-2' : ''}`}
                              />
                            </div>
                            {billingAddress.postalCode.trim() && !billingPostalValidation.isValid && (
                              <div className="absolute right-3 top-2.5 pointer-events-none">
                                <AlertCircle size={15} className="text-red-500" />
                              </div>
                            )}
                          </div>
                          {billingAddress.postalCode.trim() && !billingPostalValidation.isValid && (
                            <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-start gap-1.5 leading-tight animate-fadeIn">
                              <AlertCircle size={13} className="shrink-0 mt-0.5" />
                              <span>{billingPostalValidation.error}</span>
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* INDONESIA: City, State, and Postal Code */
                      <div className="space-y-2.5">
                        <div>
                          <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                            City
                          </label>
                          <div className={`w-full bg-white border border-neutral-300 rounded-sm overflow-hidden focus-within:border-ink transition-colors ${!billingAddress.country ? 'bg-neutral-100' : ''}`}>
                            <input
                              type="text"
                              required={billingOption === 'different'}
                              disabled={!billingAddress.country}
                              value={billingAddress.city}
                              onChange={(e) => setBillingAddress({ ...billingAddress, city: e.target.value })}
                              placeholder="City"
                              className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none disabled:text-neutral-400 ${autofilledBillingFields.city ? 'animate-text-in' : ''}`}
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          <div>
                            <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                              State
                            </label>
                            <div className={`relative w-full bg-white border border-neutral-300 rounded-sm overflow-hidden focus-within:border-ink transition-colors ${!billingAddress.country ? 'bg-neutral-100' : ''}`}>
                              <select
                                required={billingOption === 'different'}
                                disabled={!billingAddress.country}
                                value={billingAddress.province}
                                onChange={(e) => setBillingAddress({ ...billingAddress, province: e.target.value })}
                                className={`w-full bg-transparent pl-3 pr-8 py-2 text-xs sm:text-sm outline-none appearance-none cursor-pointer disabled:text-neutral-400 disabled:cursor-not-allowed ${autofilledBillingFields.province ? 'animate-text-in-delay-1' : ''} ${!billingAddress.province ? 'text-neutral-400' : 'text-ink'
                                  }`}
                              >
                                <option value="" disabled>
                                  State
                                </option>
                                {billingProvinces.map((prov) => (
                                  <option key={prov} value={prov} className="text-ink">
                                    {prov}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown
                                size={14}
                                className="absolute right-3 top-2.5 text-neutral-500 pointer-events-none"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                              Postal code
                            </label>
                            <div className="relative">
                              <div className={`w-full bg-white border rounded-sm overflow-hidden transition-colors ${billingAddress.postalCode.trim() && !billingPostalValidation.isValid
                                  ? 'border-red-500 bg-red-50/20'
                                  : !billingAddress.country
                                  ? 'border-neutral-300 bg-neutral-100'
                                  : 'border-neutral-300 focus-within:border-ink'
                                }`}>
                                <input
                                  type="text"
                                  required={billingOption === 'different'}
                                  disabled={!billingAddress.country}
                                  inputMode="numeric"
                                  value={billingAddress.postalCode}
                                  onChange={(e) => setBillingAddress({ ...billingAddress, postalCode: e.target.value })}
                                  placeholder="Postal code"
                                  className={`w-full bg-transparent px-3 py-2 text-xs sm:text-sm outline-none disabled:text-neutral-400 ${billingAddress.postalCode.trim() && !billingPostalValidation.isValid ? 'pr-9' : ''} ${autofilledBillingFields.postalCode ? 'animate-text-in-delay-2' : ''}`}
                                />
                              </div>
                              {billingAddress.postalCode.trim() && !billingPostalValidation.isValid && (
                                <div className="absolute right-3 top-2.5 pointer-events-none">
                                  <AlertCircle size={15} className="text-red-500" />
                                </div>
                              )}
                            </div>
                            {billingAddress.postalCode.trim() && !billingPostalValidation.isValid && (
                              <p className="text-[11px] text-red-600 font-medium mt-1.5 flex items-start gap-1.5 leading-tight animate-fadeIn">
                                <AlertCircle size={13} className="shrink-0 mt-0.5" />
                                <span>{billingPostalValidation.error}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Billing Phone */}
                    <div>
                      <label className="block text-[11px] uppercase tracking-wider font-semibold text-neutral-600 mb-1">
                        Phone
                      </label>
                      <input
                        type="tel"
                        required={billingOption === 'different'}
                        value={billingAddress.phone}
                        onChange={(e) => setBillingAddress({ ...billingAddress, phone: e.target.value })}
                        placeholder="Phone"
                        className="w-full bg-white border border-neutral-300 px-3 py-2 text-xs sm:text-sm outline-none focus:border-ink rounded-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ================= 6. MOBILE COLLAPSIBLE ORDER SUMMARY (With > / Chevron Toggle) ================= */}
          <div className="lg:hidden glass rounded-sm border border-neutral-200/70 shadow-sm overflow-hidden w-full max-w-full min-w-0">
            {/* Header Accordion Toggle Button with > / Chevron */}
            <button
              type="button"
              onClick={() => setShowMobileSummary((prev) => !prev)}
              className="w-full flex items-center justify-between gap-2 p-3.5 bg-neutral-50/80 hover:bg-neutral-50 transition-colors cursor-pointer text-left"
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-ink tracking-wide min-w-0">
                <ShoppingBag size={16} className="text-neutral-700 shrink-0" />
                <span className="truncate">{showMobileSummary ? 'Hide order summary' : 'Show order summary'}</span>
                <ChevronDown
                  size={16}
                  className={`text-neutral-500 shrink-0 transition-transform duration-300 ${showMobileSummary ? 'rotate-180' : ''
                    }`}
                />
              </div>
              <div className="font-bold text-xs sm:text-sm text-ink shrink-0">
                USD ${grandTotal.toFixed(2)}
              </div>
            </button>

            {/* Collapsible Content */}
            <AnimatePresence>
              {showMobileSummary && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: lux }}
                  className="p-4 border-t border-neutral-200/70 space-y-3 bg-white w-full max-w-full min-w-0"
                >
                  {/* Product items in mobile summary */}
                  <div className="divide-y divide-neutral-200/60 max-h-56 overflow-y-auto pr-1">
                    {items.map((item) => (
                      <div key={item.id} className="py-2.5 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="relative h-11 w-11 rounded-sm border border-neutral-200 bg-white overflow-hidden shrink-0">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="h-full w-full object-cover"
                            />
                            <span className="absolute -top-1 -right-1 bg-ink text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                              {item.qty}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-ink truncate">{item.name}</p>
                            <p className="text-[10px] text-neutral-500 truncate">{item.size}</p>
                          </div>
                        </div>
                        <div className="text-xs font-bold text-ink shrink-0">
                          ${(item.price * item.qty).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Discount / Gift Card Input on Mobile */}
                  <div className="pt-1">
                    <div className="flex gap-2 w-full min-w-0">
                      <input
                        type="text"
                        value={discountInput}
                        onChange={(e) => setDiscountInput(e.target.value)}
                        placeholder="Gift Card or Discount code"
                        className="flex-1 min-w-0 bg-white border border-neutral-300 px-3 py-2 text-xs outline-none focus:border-ink rounded-sm"
                      />
                      <button
                        type="button"
                        onClick={() => handleApplyDiscount()}
                        className="bg-neutral-900 text-white px-4 py-2 text-xs font-semibold rounded-sm hover:bg-black transition-colors cursor-pointer shrink-0"
                      >
                        Apply
                      </button>
                    </div>
                    {discountError && (
                      <p className="text-xs text-rose-600 font-medium mt-1">{discountError}</p>
                    )}
                    {appliedDiscount && (
                      <div className="mt-2 flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded text-xs text-emerald-800">
                        <span className="flex items-center gap-1.5 font-medium truncate">
                          <Tag size={12} className="shrink-0" /> {appliedDiscount.code} ({appliedDiscount.label})
                        </span>
                        <button
                          type="button"
                          onClick={handleRemoveDiscount}
                          className="hover:text-black shrink-0 ml-2"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Subtotals on Mobile */}
                  <div className="border-t border-neutral-200/80 pt-2.5 space-y-1.5 text-xs text-neutral-600">
                    <div className="flex justify-between items-center gap-2">
                      <span className="truncate">Subtotal</span>
                      <span className="font-semibold text-ink shrink-0">${subtotal.toFixed(2)}</span>
                    </div>
                    {appliedDiscount && (
                      <div className="flex justify-between items-center gap-2 text-emerald-700">
                        <span className="truncate">Discount ({appliedDiscount.code})</span>
                        <span className="font-semibold shrink-0">-${discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center gap-2">
                      <span className="truncate">Shipping {selectedShipping ? `(${selectedShipping.name.split(' ')[0]})` : ''}</span>
                      <span className="font-semibold text-ink shrink-0">
                        {selectedShipping
                          ? selectedShipping.cost === 0
                            ? 'FREE'
                            : `$${selectedShipping.cost.toFixed(2)}`
                          : '—'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center gap-2 pt-2 border-t border-neutral-200 text-sm font-semibold text-ink">
                      <span>Total</span>
                      <span className="font-bold text-base text-ink shrink-0">
                        USD ${grandTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 7. POLICY NOTICE & PAY NOW BUTTON */}
          <div className="space-y-3 pt-1 w-full max-w-full min-w-0">
            <p className="text-[11px] text-neutral-600 leading-relaxed">
              By placing your order you agree to LADRIM&apos;s{' '}
              <a href="#" className="underline text-ink">
                Terms and Conditions
              </a>
              ,{' '}
              <a href="#" className="underline text-ink">
                Privacy Notice
              </a>{' '}
              and{' '}
              <a href="#" className="underline text-ink">
                Cookie Policy
              </a>
              .
            </p>

            {/* Pay Now Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-ink w-full px-4 py-3.5 text-sm sm:text-base font-semibold tracking-wider flex items-center justify-center gap-2 shadow-md relative overflow-hidden group disabled:opacity-75 cursor-pointer uppercase"
            >
              {isSubmitting && (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              )}
              <span>Pay Now</span>
            </button>

            {/* Footer link */}
            <div className="pt-0.5">
              <a href="#" className="text-xs text-neutral-500 hover:text-ink underline">
                Terms and policies
              </a>
            </div>
          </div>
        </div>

        {/* ================= RIGHT COLUMN: ORDER SUMMARY (DESKTOP ONLY) ================= */}
        <div className="hidden lg:block lg:col-span-5">
          <div className="glass p-5 rounded-sm border border-neutral-200/80 sticky top-24 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-black/10 pb-3">
              <h3 className="text-base sm:text-lg text-ink font-semibold tracking-normal">
                Order Summary ({items.length})
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                Verified
              </span>
            </div>

            {/* Product Items */}
            <div className="divide-y divide-black/5 max-h-[320px] overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <div className="relative h-14 w-14 rounded-sm border border-neutral-200 bg-white overflow-hidden shrink-0 shadow-xs">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover"
                    />
                    <span className="absolute -top-1 -right-1 bg-ink text-white text-[9px] font-bold h-4 w-4 rounded-full flex items-center justify-center shadow-sm">
                      {item.qty}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-semibold text-ink leading-snug truncate">
                      {item.name}
                    </p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">{item.size}</p>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-ink shrink-0">
                    ${(item.price * item.qty).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            {/* Discount / Gift Card Input */}
            <div className="pt-2 border-t border-black/10 space-y-1.5 w-full min-w-0">
              <div className="flex gap-2 w-full min-w-0">
                <input
                  type="text"
                  value={discountInput}
                  onChange={(e) => setDiscountInput(e.target.value)}
                  placeholder="Gift Card or Discount code"
                  className="flex-1 min-w-0 bg-white border border-neutral-300 px-3 py-2 text-xs outline-none focus:border-ink rounded-sm font-medium"
                />
                <button
                  type="button"
                  onClick={() => handleApplyDiscount()}
                  className="bg-neutral-900 hover:bg-black text-white px-4 py-2 text-xs font-semibold rounded-sm transition-colors cursor-pointer shrink-0"
                >
                  Apply
                </button>
              </div>

              {discountError && (
                <p className="text-xs text-rose-600 font-medium">{discountError}</p>
              )}

              {appliedDiscount && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded text-xs text-emerald-800">
                  <div className="flex items-center gap-1.5 font-medium">
                    <Tag size={12} className="text-emerald-700" />
                    <span>
                      <strong className="tracking-wide uppercase">{appliedDiscount.code}</strong> (
                      {appliedDiscount.label})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleRemoveDiscount}
                    className="text-neutral-500 hover:text-black transition-colors"
                  >
                    <X size={13} />
                  </button>
                </div>
              )}
            </div>

            {/* Cost Breakdown */}
            <div className="border-t border-black/10 pt-3 space-y-2 text-xs sm:text-sm text-neutral-600">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span className="font-semibold text-ink">${subtotal.toFixed(2)}</span>
              </div>

              {appliedDiscount && (
                <div className="flex justify-between items-center text-emerald-700">
                  <span>Discount ({appliedDiscount.code})</span>
                  <span className="font-semibold">-${discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span>Shipping</span>
                <span className="font-semibold text-ink">
                  {selectedShipping
                    ? selectedShipping.cost === 0
                      ? 'FREE'
                      : `$${selectedShipping.cost.toFixed(2)}`
                    : '—'}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-3 border-t border-black/10 text-ink">
                <span className="text-xs uppercase tracking-wider font-semibold">Total</span>
                <div className="text-right">
                  <span className="text-[10px] text-neutral-400 font-normal mr-1.5 uppercase">USD</span>
                  <span className="text-xl font-bold">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
