import { Category } from '../types';
import { useSettingsStore } from '../store/useSettingsStore';

// Theme colors
export const Colors = {
  primary: '#000000',
  primaryDark: '#000000',
  secondary: '#666666',
  background: '#FFFFFF',
  surface: '#FFFFFF',
  error: '#333333',
  success: '#000000',
  warning: '#888888',
  text: '#000000',
  textSecondary: '#888888',
  border: '#E5E5E5',
  income: '#000000',
  expense: '#666666',
  disabled: '#CCCCCC',
};

export const DarkColors = {
  primary: '#FFFFFF',
  primaryDark: '#FFFFFF',
  secondary: '#AAAAAA',
  background: '#121212',
  surface: '#1E1E1E',
  error: '#CF6679',
  success: '#FFFFFF',
  warning: '#AAAAAA',
  text: '#FFFFFF',
  textSecondary: '#AAAAAA',
  border: '#333333',
  income: '#FFFFFF',
  expense: '#AAAAAA',
  disabled: '#555555',
};

export const useThemeColors = () => {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  return isDarkMode ? DarkColors : Colors;
};

// Category icons (Material Design icon names)
export const CategoryIcons = [
  'food',
  'cart',
  'car',
  'bus',
  'airplane',
  'home',
  'flash',
  'water',
  'wifi',
  'phone',
  'medical-bag',
  'pill',
  'school',
  'book',
  'movie',
  'gamepad',
  'music',
  'gift',
  'shopping',
  'tag',
  'cash',
  'credit-card',
  'bank',
  'wallet',
  'briefcase',
  'tools',
  'account',
  'account-group',
  'baby-carriage',
  'paw',
  'dumbbell',
  'yoga',
  'spa',
  'content-cut',
  'tshirt-crew',
  'hanger',
  'coffee',
  'beer',
  'pizza',
  'hamburger',
];

// Category colors (grayscale shades)
export const CategoryColors = [
  '#1A1A1A',
  '#2A2A2A',
  '#3A3A3A',
  '#4A4A4A',
  '#555555',
  '#606060',
  '#6B6B6B',
  '#767676',
  '#818181',
  '#8C8C8C',
  '#979797',
  '#A2A2A2',
  '#ADADAD',
  '#B3B3B3',
  '#BEBEBE',
  '#C4C4C4',
  '#CACACA',
  '#D4D4D4',
];

// Default categories
export const DefaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Expense categories
  { name: 'Food & Dining', icon: 'food', color: CategoryColors[0], isIncome: false },
  { name: 'Groceries', icon: 'cart', color: CategoryColors[1], isIncome: false },
  { name: 'Transport', icon: 'car', color: CategoryColors[2], isIncome: false },
  { name: 'Fuel', icon: 'gas-station', color: CategoryColors[3], isIncome: false },
  { name: 'Shopping', icon: 'shopping', color: CategoryColors[4], isIncome: false },
  { name: 'Entertainment', icon: 'movie', color: CategoryColors[5], isIncome: false },
  { name: 'Bills & Utilities', icon: 'flash', color: CategoryColors[6], isIncome: false },
  { name: 'Healthcare', icon: 'medical-bag', color: CategoryColors[7], isIncome: false },
  { name: 'Education', icon: 'school', color: CategoryColors[8], isIncome: false },
  { name: 'Personal Care', icon: 'spa', color: CategoryColors[9], isIncome: false },
  { name: 'Home', icon: 'home', color: CategoryColors[10], isIncome: false },
  { name: 'Travel', icon: 'airplane', color: CategoryColors[11], isIncome: false },
  { name: 'Subscriptions', icon: 'youtube-subscription', color: CategoryColors[12], isIncome: false },
  { name: 'Gifts', icon: 'gift', color: CategoryColors[13], isIncome: false },
  { name: 'Other Expense', icon: 'tag', color: CategoryColors[14], isIncome: false },

  // Income categories
  { name: 'Salary', icon: 'cash', color: CategoryColors[15], isIncome: true },
  { name: 'Business', icon: 'briefcase', color: CategoryColors[16], isIncome: true },
  { name: 'Investment', icon: 'chart-line', color: CategoryColors[17], isIncome: true },
  { name: 'Freelance', icon: 'laptop', color: CategoryColors[0], isIncome: true },
  { name: 'Refund', icon: 'cash-refund', color: CategoryColors[1], isIncome: true },
  { name: 'Other Income', icon: 'plus-circle', color: CategoryColors[2], isIncome: true },
];

// Bank sender IDs for SMS parsing
export const BankSenderPatterns = {
  HDFC: ['HDFCBK', 'HDFC', 'HDFCBANK'],
  ICICI: ['ICICIB', 'ICICI', 'ICICIBANK'],
  SBI: ['SBIINB', 'SBIATM', 'SBI', 'SBIBANK'],
  AXIS: ['AXISBK', 'AXIS', 'AXISBANK'],
  KOTAK: ['KOTAKB', 'KOTAK', 'KOTAKBANK'],
  YESBANK: ['YESBK', 'YESBNK', 'YESBANK'],
  INDUSIND: ['INDBNK', 'INDUSIND', 'IDFCFB'],
  BOB: ['BOBTXN', 'BARODA', 'BOBSMS'],
  PNB: ['PNBSMS', 'PUNJNB', 'PNB'],
  FEDERAL: ['FEDBK', 'FEDBNK', 'FEDERAL'],
  PAYTM: ['PYTM', 'PAYTM', 'PAYTMB'],
  GPAY: ['GPAY', 'GOOGLE'],
  PHONEPE: ['PHONEPE', 'PHNEPE'],
  AMAZON: ['AMAZON', 'AMZNPAY'],
  HSBC: ['HSBC', 'HSBCBK', 'HSBCBANK', 'HSBCIN', 'HSBCIM'],
};

// Common merchant keywords for auto-categorization
export const MerchantCategoryMap: Record<string, string> = {
  // Food & Dining
  'swiggy': 'Food & Dining',
  'zomato': 'Food & Dining',
  'dominos': 'Food & Dining',
  'mcdonalds': 'Food & Dining',
  'starbucks': 'Food & Dining',
  'cafe': 'Food & Dining',
  'restaurant': 'Food & Dining',
  'food': 'Food & Dining',

  // Groceries
  'bigbasket': 'Groceries',
  'blinkit': 'Groceries',
  'zepto': 'Groceries',
  'dmart': 'Groceries',
  'reliance fresh': 'Groceries',
  'more': 'Groceries',

  // Transport
  'uber': 'Transport',
  'ola': 'Transport',
  'rapido': 'Transport',
  'metro': 'Transport',

  // Fuel
  'petrol': 'Fuel',
  'iocl': 'Fuel',
  'bpcl': 'Fuel',
  'hpcl': 'Fuel',
  'indian oil': 'Fuel',
  'bharat petroleum': 'Fuel',

  // Shopping
  'amazon': 'Shopping',
  'flipkart': 'Shopping',
  'myntra': 'Shopping',
  'ajio': 'Shopping',
  'nykaa': 'Shopping',

  // Entertainment
  'netflix': 'Subscriptions',
  'hotstar': 'Subscriptions',
  'prime': 'Subscriptions',
  'spotify': 'Subscriptions',
  'youtube': 'Subscriptions',
  'bookmyshow': 'Entertainment',
  'pvr': 'Entertainment',
  'inox': 'Entertainment',

  // Bills & Utilities
  'electricity': 'Bills & Utilities',
  'water': 'Bills & Utilities',
  'gas': 'Bills & Utilities',
  'airtel': 'Bills & Utilities',
  'jio': 'Bills & Utilities',
  'vodafone': 'Bills & Utilities',
  'vi ': 'Bills & Utilities',

  // Healthcare
  'pharmacy': 'Healthcare',
  'apollo': 'Healthcare',
  'pharmeasy': 'Healthcare',
  'netmeds': 'Healthcare',
  '1mg': 'Healthcare',
  'hospital': 'Healthcare',
  'clinic': 'Healthcare',

  // Education
  'udemy': 'Education',
  'coursera': 'Education',
  'school': 'Education',
  'college': 'Education',
  'university': 'Education',
};

// Date format constants
export const DateFormats = {
  display: 'dd MMM yyyy',
  displayWithTime: 'dd MMM yyyy, hh:mm a',
  input: 'yyyy-MM-dd',
  month: 'MMMM yyyy',
  monthShort: 'MMM yyyy',
};

// Budget thresholds
export const BudgetThresholds = {
  warning: 0.8, // 80%
  danger: 1.0,  // 100%
};
