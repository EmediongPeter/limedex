export const validateInput = (value: string) => {
  // Allow only numbers and a single decimal point
  const validatedValue = value.replace(/[^0-9.]/g, ""); // Remove invalid characters
  const decimalCount = (validatedValue.match(/\./g) || []).length;
  if (decimalCount > 1) return; // Allow only one decimal point

  return validatedValue;
};
