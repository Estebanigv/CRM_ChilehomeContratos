// Helper function to safely parse JSON responses
export async function safeParseJSON(response: Response) {
  const responseText = await response.text()
  
  // Check if server returned HTML instead of JSON
  if (responseText.trim().startsWith('<!DOCTYPE') || responseText.trim().startsWith('<html')) {
    console.error('🚨 Frontend: Server returned HTML instead of JSON:', responseText.substring(0, 200) + '...')
    throw new Error('Server returned HTML instead of JSON - possible authentication error')
  }
  
  try {
    return JSON.parse(responseText)
  } catch (parseError) {
    console.error('🚨 Frontend: JSON Parse Error:', parseError)
    console.error('🚨 Frontend: Response text:', responseText.substring(0, 500) + '...')
    throw new Error(`Invalid JSON response: ${parseError}`)
  }
}

// Format currency in Chilean pesos
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

// Format RUT with proper format
export const formatRUT = (rut: string): string => {
  if (!rut) return ''
  
  // Remove any existing formatting
  const cleanRUT = rut.replace(/[^\dkK]/g, '')
  
  if (cleanRUT.length < 2) return cleanRUT
  
  // Split number and verification digit
  const number = cleanRUT.slice(0, -1)
  const verifier = cleanRUT.slice(-1).toUpperCase()
  
  // Add thousand separators
  const formattedNumber = number.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  
  return `${formattedNumber}-${verifier}`
}