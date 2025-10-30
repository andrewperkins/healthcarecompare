/**
 * Currency formatter
 */
export const formatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) {
    return new Intl.NumberFormat('en', {
      currency: 'USD',
      style: 'currency',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(0);
  }
  return new Intl.NumberFormat('en', {
    currency: 'USD',
    style: 'currency',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  }).format(value);
};
