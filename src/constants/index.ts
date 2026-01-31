import { Category } from '../types';

// Theme colors
export const Colors = {
  primary: '#6200ee',
  primaryDark: '#3700b3',
  secondary: '#03dac6',
  background: '#f5f5f5',
  surface: '#ffffff',
  error: '#b00020',
  success: '#4caf50',
  warning: '#ff9800',
  text: '#000000',
  textSecondary: '#666666',
  border: '#e0e0e0',
  income: '#4caf50',
  expense: '#f44336',
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

// Category colors
export const CategoryColors = [
  '#f44336', // Red
  '#e91e63', // Pink
  '#9c27b0', // Purple
  '#673ab7', // Deep Purple
  '#3f51b5', // Indigo
  '#2196f3', // Blue
  '#03a9f4', // Light Blue
  '#00bcd4', // Cyan
  '#009688', // Teal
  '#4caf50', // Green
  '#8bc34a', // Light Green
  '#cddc39', // Lime
  '#ffeb3b', // Yellow
  '#ffc107', // Amber
  '#ff9800', // Orange
  '#ff5722', // Deep Orange
  '#795548', // Brown
  '#607d8b', // Blue Grey
];

// Default categories
export const DefaultCategories: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>[] = [
  // Expense categories
  { name: 'Food & Dining', icon: 'food', color: '#ff5722', isIncome: false },
  { name: 'Groceries', icon: 'cart', color: '#4caf50', isIncome: false },
  { name: 'Transport', icon: 'car', color: '#2196f3', isIncome: false },
  { name: 'Fuel', icon: 'gas-station', color: '#ff9800', isIncome: false },
  { name: 'Shopping', icon: 'shopping', color: '#e91e63', isIncome: false },
  { name: 'Entertainment', icon: 'movie', color: '#9c27b0', isIncome: false },
  { name: 'Bills & Utilities', icon: 'flash', color: '#ffeb3b', isIncome: false },
  { name: 'Healthcare', icon: 'medical-bag', color: '#f44336', isIncome: false },
  { name: 'Education', icon: 'school', color: '#3f51b5', isIncome: false },
  { name: 'Personal Care', icon: 'spa', color: '#00bcd4', isIncome: false },
  { name: 'Home', icon: 'home', color: '#795548', isIncome: false },
  { name: 'Travel', icon: 'airplane', color: '#03a9f4', isIncome: false },
  { name: 'Subscriptions', icon: 'youtube-subscription', color: '#673ab7', isIncome: false },
  { name: 'Gifts', icon: 'gift', color: '#cddc39', isIncome: false },
  { name: 'Other Expense', icon: 'tag', color: '#607d8b', isIncome: false },

  // Income categories
  { name: 'Salary', icon: 'cash', color: '#4caf50', isIncome: true },
  { name: 'Business', icon: 'briefcase', color: '#2196f3', isIncome: true },
  { name: 'Investment', icon: 'chart-line', color: '#ff9800', isIncome: true },
  { name: 'Freelance', icon: 'laptop', color: '#9c27b0', isIncome: true },
  { name: 'Refund', icon: 'cash-refund', color: '#00bcd4', isIncome: true },
  { name: 'Other Income', icon: 'plus-circle', color: '#8bc34a', isIncome: true },
];

// Bank sender IDs for SMS parsing
export const BankSenderPatterns = {
  HDFC: ['HDFCBK', 'HDFC', 'HDFCBANK'],
  ICICI: ['ICICIB', 'ICICI', 'ICICIBANK'],
  SBI: ['SBIINB', 'SBIATM', 'SBI', 'SBIBANK'],
  AXIS: ['AXISBK', 'AXIS', 'AXISBANK'],
  KOTAK: ['KOTAKB', 'KOTAK', 'KOTAKBANK'],
  PAYTM: ['PYTM', 'PAYTM', 'PAYTMB'],
  GPAY: ['GPAY', 'GOOGLE'],
  PHONEPE: ['PHONEPE', 'PHNEPE'],
  AMAZON: ['AMAZON', 'AMZNPAY'],
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
