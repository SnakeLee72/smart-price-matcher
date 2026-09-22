import { RawProduct, ProductVariant, ProductCondition, WarrantyType } from '@/types/commerce';

export interface NormalizedResult {
  normalizedTitle: string;
  brand: string;
  model: string;
  condition: ProductCondition;
  warrantyType: WarrantyType;
  variant: ProductVariant;
  voltageNotice?: string;
  isAccessory: boolean;
}

export class NormalizationService {
  // 品牌名稱對照表 (正規化為官方標準名稱)
  private static BRAND_MAPPINGS: Record<string, string> = {
    'sony': 'Sony',
    'ソニー': 'Sony',
    '索尼': 'Sony',
    'apple': 'Apple',
    '蘋果': 'Apple',
    'アップル': 'Apple',
    'bose': 'Bose',
    'ボーズ': 'Bose',
    'samsung': 'Samsung',
    '三星': 'Samsung',
    'サムスン': 'Samsung',
    'dell': 'Dell',
    '戴爾': 'Dell',
    'デル': 'Dell',
    'lg': 'LG',
    'logitech': 'Logitech',
    '羅技': 'Logitech',
    'ロジクール': 'Logitech',
    'logicool': 'Logitech',
    'keychron': 'Keychron',
    'zojirushi': 'Zojirushi',
    '象印': 'Zojirushi',
    'panasonic': 'Panasonic',
    '國際牌': 'Panasonic',
    'パナソニック': 'Panasonic',
    'sharp': 'Sharp',
    '夏普': 'Sharp',
    'シャープ': 'Sharp',
    'dyson': 'Dyson',
    '戴森': 'Dyson',
    'ダイソン': 'Dyson'
  };

  /**
   * 全形轉半形字元轉換
   */
  public static toHalfWidth(str: string): string {
    if (!str) return '';
    return str
      .replace(/[\uff01-\uff5e]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/\u3000/g, ' ')
      .trim();
  }

  /**
   * 清理多餘特殊符號與行銷字樣
   */
  public static cleanTitle(title: string): string {
    let cleaned = this.toHalfWidth(title);
    // 移除常見的促銷框括號字眼，如 【公司貨】、【全新現貨】、【特惠下殺】
    cleaned = cleaned.replace(/【[^】]*】/g, ' ');
    cleaned = cleaned.replace(/\[[^\]]*\]/g, ' ');
    cleaned = cleaned.replace(/\([^\)]*(現貨|免運|特價|公司貨|保固)[^\)]*\)/gi, ' ');
    // 壓縮連續空白
    return cleaned.replace(/\s+/g, ' ').trim();
  }

  /**
   * 辨識品牌
   */
  public static recognizeBrand(title: string, rawBrand?: string): string {
    if (rawBrand && this.BRAND_MAPPINGS[rawBrand.toLowerCase()]) {
      return this.BRAND_MAPPINGS[rawBrand.toLowerCase()];
    }

    const lower = title.toLowerCase();
    for (const [alias, standardName] of Object.entries(this.BRAND_MAPPINGS)) {
      const regex = new RegExp(`\\b${alias}\\b|${alias}`, 'i');
      if (regex.test(lower)) {
        return standardName;
      }
    }

    return rawBrand ? rawBrand.trim() : 'Unknown';
  }

  /**
   * 辨識型號
   */
  public static recognizeModel(title: string, rawModel?: string): string {
    if (rawModel) return rawModel.trim();

    const half = this.toHalfWidth(title);

    // 常見電子產品型號的正則比對
    const patterns = [
      /\b(WH-1000XM[456]|WF-1000XM[45])\b/i,
      /\b(QuietComfort\s+Ultra|QC\s+Ultra)\b/i,
      /\b(iPhone\s+1[1-6]\s*(?:Pro\s*Max|Pro|Plus)?)\b/i,
      /\b(Galaxy\s+S2[0-5]\s*Ultra|S2[0-5]\+?)\b/i,
      /\b(U2723QE|U2724DE|U3223QE)\b/i,
      /\b(27UP850N?-W?|27GP850)\b/i,
      /\b(MX\s+Master\s+3S?|MX\s+Anywhere\s+3S?)\b/i,
      /\b(Q1\s*Pro|K2\s*Pro|Q2\s*Pro)\b/i,
      /\b(NW-[A-Z0-9]+)\b/i,
      /\b(NA-LX[0-9]+[A-Z]*)\b/i,
      /\b(Airstrait|Airwrap|Supersonic)\b/i,
      /\b(Watch\s+Series\s+[0-9]+|Watch\s+Ultra\s*[12]?)\b/i,
      /\b(KI-[A-Z0-9]+)\b/i
    ];

    for (const p of patterns) {
      const match = half.match(p);
      if (match) return match[0].trim();
    }

    // 一般大寫英數字型號比對，例如 ABC-1234, X100
    const genericMatch = half.match(/\b([A-Z0-9]{2,}-[A-Z0-9]{2,})\b/i);
    if (genericMatch) return genericMatch[1].toUpperCase();

    return '';
  }

  /**
   * 辨識規格變體 (Color, Capacity, Size, Voltage 等)
   */
  public static extractVariants(title: string, rawAttrs: Record<string, unknown> = {}): ProductVariant {
    const text = this.toHalfWidth(title);
    const variant: ProductVariant = {};

    // 顏色辨識
    if (/黑|black|ブラック|スレートブラック/i.test(text)) variant.color = '黑色';
    else if (/白|white|ホワイト|マットホワイト/i.test(text)) variant.color = '白色';
    else if (/銀|silver|シルバー|プラチナシルバー/i.test(text)) variant.color = '銀色';
    else if (/鈦灰|原色鈦|チタニウム|titanium/i.test(text)) variant.color = '原色鈦金屬';
    else if (/普魯士藍|藍|blue|ブルー/i.test(text)) variant.color = '普魯士藍';
    else if (/石墨灰|灰色|グレー|gray|grey/i.test(text)) variant.color = '石墨灰';
    else if (/星光色|starlight/i.test(text)) variant.color = '星光色';
    else if (/午夜色|midnight/i.test(text)) variant.color = '午夜色';

    // 容量辨識 (手機、硬碟等)
    const capMatch = text.match(/\b(64GB|128GB|256GB|512GB|1TB|2TB)\b/i);
    if (capMatch) {
      variant.capacity = capMatch[1].toUpperCase();
    }

    // 尺寸辨識 (螢幕 27吋、手錶 41mm/45mm、電子鍋 5.5合)
    const sizeMatch = text.match(/\b(24|27|32|34|43|49)\s*(?:吋|inch|インチ)\b/i) ||
                      text.match(/\b(40mm|41mm|44mm|45mm|49mm)\b/i) ||
                      text.match(/\b(5\.5合|1升|10合|3合)\b/i) ||
                      text.match(/\b(12kg|10kg|6kg)\b/i);
    if (sizeMatch) {
      variant.size = sizeMatch[0];
    }

    // 電壓辨識 (日本電器 100V vs 台灣 110V vs 全球 100-240V)
    if (/100V\s*專用|100V\s*日本/i.test(text)) {
      variant.voltage = '100V (日本專用規格)';
    } else if (/110V/i.test(text)) {
      variant.voltage = '110V (台灣標準電壓)';
    } else if (/100-240V|全球電壓/i.test(text)) {
      variant.voltage = '100-240V 全球電壓相容';
    }

    // 合併 Raw Attributes
    if (rawAttrs.color && typeof rawAttrs.color === 'string') variant.color = variant.color || rawAttrs.color;
    if (rawAttrs.capacity && typeof rawAttrs.capacity === 'string') variant.capacity = variant.capacity || rawAttrs.capacity;
    if (rawAttrs.size && typeof rawAttrs.size === 'string') variant.size = variant.size || rawAttrs.size;
    if (rawAttrs.voltage && typeof rawAttrs.voltage === 'string') variant.voltage = variant.voltage || rawAttrs.voltage;

    return variant;
  }

  /**
   * 辨識是否為配件 (避免與主商品錯誤合併)
   */
  public static isAccessory(title: string): boolean {
    const text = title.toLowerCase();
    const accessoryKeywords = ['耳罩保護套', '充電線', '專用保護殼', '替換耳塞', '螢幕支架', '電源線', '濾網配件', '內鍋單售', '配件'];
    return accessoryKeywords.some((kw) => text.includes(kw));
  }

  /**
   * 統一對 RawProduct 進行全方位標準化
   */
  public static normalizeRawProduct(raw: RawProduct): NormalizedResult {
    const brand = this.recognizeBrand(raw.title, raw.brand);
    const model = this.recognizeModel(raw.title, raw.model);
    const variant = this.extractVariants(raw.title, raw.rawAttributes);
    const isAcc = this.isAccessory(raw.title);

    // 建立標準化後的乾淨標題
    const titleParts = [brand !== 'Unknown' ? brand : '', model, variant.color, variant.capacity, variant.size].filter(Boolean);
    const normalizedTitle = titleParts.length > 0 ? titleParts.join(' ') : this.cleanTitle(raw.title);

    let voltageNotice: string | undefined;
    if (raw.countryOfOrigin === 'JP' && variant.voltage?.includes('100V')) {
      voltageNotice = '日本原裝 100V 電器在台灣使用建議搭配降壓器使用以延長壽命。';
    }

    return {
      normalizedTitle,
      brand,
      model,
      condition: raw.condition,
      warrantyType: raw.warrantyType,
      variant,
      voltageNotice,
      isAccessory: isAcc
    };
  }
}