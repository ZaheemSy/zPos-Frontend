const ONES = [
  'Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];

const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const tens = Math.floor(n / 10);
  const ones = n % 10;
  return ones === 0 ? TENS[tens] : `${TENS[tens]}-${ONES[ones]}`;
}

function threeDigits(n: number): string {
  const hundreds = Math.floor(n / 100);
  const rest = n % 100;
  if (hundreds === 0) return twoDigits(rest);
  if (rest === 0) return `${ONES[hundreds]} Hundred`;
  return `${ONES[hundreds]} Hundred ${twoDigits(rest)}`;
}

/** Converts an integer into Indian numbering system words (Lakh/Crore groups). */
function integerToWords(value: number): string {
  if (value === 0) return 'Zero';

  const crore = Math.floor(value / 10000000);
  const lakh = Math.floor((value % 10000000) / 100000);
  const thousand = Math.floor((value % 100000) / 1000);
  const hundred = value % 1000;

  const parts: string[] = [];
  if (crore > 0) parts.push(`${threeDigits(crore)} Crore`);
  if (lakh > 0) parts.push(`${threeDigits(lakh)} Lakh`);
  if (thousand > 0) parts.push(`${threeDigits(thousand)} Thousand`);
  if (hundred > 0) parts.push(threeDigits(hundred));

  return parts.join(', ');
}

/** Renders a rupee amount as words, e.g. 46500 -> "Forty-Six Thousand, Five Hundred Point Zero Zero" */
export function amountInWords(amount: number): string {
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);

  const rupeeWords = integerToWords(rupees);
  const paiseTens = ONES[Math.floor(paise / 10)];
  const paiseOnes = ONES[paise % 10];

  return `${rupeeWords} Point ${paiseTens} ${paiseOnes}`;
}
