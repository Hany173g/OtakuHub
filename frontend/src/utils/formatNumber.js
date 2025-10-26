// Number formatting utility
export const formatNumber = (num) => {
  if (!num || num === 0) return '0'
  
  const number = parseInt(num)
  
  if (number >= 1000000) {
    return (number / 1000000).toFixed(1).replace('.0', '') + 'M'
  }
  
  if (number >= 1000) {
    return (number / 1000).toFixed(1).replace('.0', '') + 'K'
  }
  
  return number.toLocaleString('ar-EG')
}

export default formatNumber
