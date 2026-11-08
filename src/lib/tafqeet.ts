/**
 * Tafqeet Utility for Arabic Number-to-Words Conversion
 * Specially tailored for Algerian Dinars (DZD) and official administrative reporting.
 */

const ONES = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر"
];

const TENS = [
  "",
  "عشرة",
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون"
];

const HUNDREDS = [
  "",
  "مائة",
  "مائتان",
  "ثلاثمائة",
  "أربعمائة",
  "خمسمائة",
  "ستمائة",
  "سبعمائة",
  "ثمانمائة",
  "تسعمائة"
];

function convertGroup(num: number): string {
  let result = "";
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    result += HUNDREDS[hundreds];
  }

  if (remainder > 0) {
    if (result.length > 0) {
      result += " و";
    }

    if (remainder < 20) {
      result += ONES[remainder];
    } else {
      const ones = remainder % 10;
      const tens = Math.floor(remainder / 10);
      if (ones > 0) {
        result += ONES[ones] + " و" + TENS[tens];
      } else {
        result += TENS[tens];
      }
    }
  }

  return result;
}

/**
 * Converts any non-negative integer number into Arabic words.
 */
export function numberToArabicWords(n: number): string {
  const num = Math.floor(Math.abs(Number(n) || 0));
  if (num === 0) return "صفر";

  const billions = Math.floor(num / 1000000000);
  const millions = Math.floor((num % 1000000000) / 1000000);
  const thousands = Math.floor((num % 1000000) / 1000);
  const remainder = num % 1000;

  const parts: string[] = [];

  // Billions (مليار)
  if (billions > 0) {
    if (billions === 1) {
      parts.push("مليار");
    } else if (billions === 2) {
      parts.push("ملياران");
    } else if (billions >= 3 && billions <= 10) {
      parts.push(`${convertGroup(billions)} ملايير`);
    } else {
      parts.push(`${convertGroup(billions)} مليار`);
    }
  }

  // Millions (مليون)
  if (millions > 0) {
    if (millions === 1) {
      parts.push("مليون");
    } else if (millions === 2) {
      parts.push("مليونان");
    } else if (millions >= 3 && millions <= 10) {
      parts.push(`${convertGroup(millions)} ملايين`);
    } else {
      parts.push(`${convertGroup(millions)} مليون`);
    }
  }

  // Thousands (ألف)
  if (thousands > 0) {
    if (thousands === 1) {
      parts.push("ألف");
    } else if (thousands === 2) {
      parts.push("ألفان");
    } else if (thousands >= 3 && thousands <= 10) {
      parts.push(`${convertGroup(thousands)} آلاف`);
    } else {
      parts.push(`${convertGroup(thousands)} ألف`);
    }
  }

  // Remainder (< 1000)
  if (remainder > 0) {
    parts.push(convertGroup(remainder));
  }

  return parts.join(" و");
}

/**
 * Formats a currency amount in Algerian Dinars with words in Arabic.
 * Example:
 * tafqeetDinar(15000) -> "خمسة عشر ألف دينار جزائري"
 * withPrefix: "فقط خمسة عشر ألف دينار جزائري لا غير"
 */
export function tafqeetDinar(amount: number, options: { withPrefixSuffix?: boolean } = {}): string {
  const words = numberToArabicWords(amount);
  
  if (options.withPrefixSuffix) {
    return `فقط ${words} دينار جزائري لا غير`;
  }
  return `${words} دينار جزائري`;
}
