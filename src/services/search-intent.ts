import { SearchQuery } from '@/types/commerce';

/** Extract only explicit constraints; leave unsupported phrases in the keyword. */
export function parseSearchIntent(keyword: string): Pick<SearchQuery, 'keyword' | 'maxPrice' | 'warrantyType' | 'shipsToTaiwan' | 'capacity' | 'color' | 'voltage' | 'countryOfOrigin'> {
  let remaining = keyword.trim();
  const result: ReturnType<typeof parseSearchIntent> = { keyword: remaining };
  const budget = remaining.match(/(?:預算|不超過|低於)\s*(?:NT\$|TWD|新台幣)?\s*([\d,]+)/i);
  if (budget) {
    result.maxPrice = Number(budget[1].replaceAll(',', ''));
    remaining = remaining.replace(budget[0], ' ');
  }
  if (/台灣公司貨/.test(remaining)) {
    result.countryOfOrigin = 'TW';
    result.warrantyType = 'TAIWAN_OFFICIAL';
    remaining = remaining.replace(/台灣公司貨/g, ' ');
  }
  if (/台灣原廠保固/.test(remaining)) {
    result.warrantyType = 'TAIWAN_OFFICIAL';
    remaining = remaining.replace(/台灣原廠保固/g, ' ');
  }
  if (/可寄台灣|寄送台灣/.test(remaining)) {
    result.shipsToTaiwan = true;
    remaining = remaining.replace(/可寄台灣|寄送台灣/g, ' ');
  }
  const capacity = remaining.match(/\b(64|128|256|512)\s*GB\b|\b(1|2)\s*TB\b/i);
  if (capacity) {
    result.capacity = capacity[0].replace(/\s+/g, '').toUpperCase();
    remaining = remaining.replace(capacity[0], ' ');
  }
  if (/黑色/.test(remaining)) {
    result.color = '黑';
    remaining = remaining.replace(/黑色/g, ' ');
  } else if (/白色/.test(remaining)) {
    result.color = '白';
    remaining = remaining.replace(/白色/g, ' ');
  }
  const voltage = remaining.match(/\b(100|110|220)V\b/i);
  if (voltage) {
    result.voltage = `${voltage[1]}V`;
    remaining = remaining.replace(voltage[0], ' ');
  }
  result.keyword = remaining.replace(/\s+/g, ' ').trim();
  return result;
}
