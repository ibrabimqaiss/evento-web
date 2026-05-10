export const formatNumber = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('en-US')
}

export const formatCurrency = (num) => {
  if (num === null || num === undefined) return '0'
  return Number(num).toLocaleString('en-US') + ' د.ع'
}

export const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB')
}
