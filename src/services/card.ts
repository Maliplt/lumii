// dogrulama
function onlyDigits(value: string): string {
  return value
    .split("")
    .filter((ch) => ch >= "0" && ch <= "9")
    .join("");
}

export function isValidCardNumber(value: string): boolean {
  const digits = onlyDigits(value);
  if (digits.length !== 16) return false;

  // luhn
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    let digit = Number(digits[i]);
    if ((digits.length - i) % 2 === 0) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
  }
  return sum % 10 === 0;
}

export function isValidExpiry(value: string): boolean {
  if (value.length !== 5 || value[2] !== "/") return false;

  const month = Number(value.slice(0, 2));
  const year = 2000 + Number(value.slice(3));
  if (!month || month > 12 || !year) return false;

  const now = new Date();
  const thisYear = now.getFullYear();
  const thisMonth = now.getMonth() + 1;

  if (year < thisYear) return false;
  if (year === thisYear && month < thisMonth) return false;
  return true;
}

export function isValidCvc(value: string): boolean {
  return value.length === 3 && onlyDigits(value).length === 3;
}

// format helper
export function formatCardNumber(value: string): string {
  const digits = onlyDigits(value).slice(0, 16);
  const groups = [];
  for (let i = 0; i < digits.length; i += 4) {
    groups.push(digits.slice(i, i + 4));
  }
  return groups.join(" ");
}

export function formatExpiry(value: string): string {
  const digits = onlyDigits(value).slice(0, 4);
  if (digits.length < 3) return digits;
  return digits.slice(0, 2) + "/" + digits.slice(2);
}

export function formatCvc(value: string): string {
  return onlyDigits(value).slice(0, 3);
}
