import { LandedCostBreakdown } from '@/types/commerce';

export interface CalculationInput {
  itemPrice: number;
  currency: string;
  category: string;
  domesticShipping: number;
  internationalShipping: number;
  couponDiscount: number;
  couponConfirmed?: boolean;
  shipsToTaiwan: boolean;
  isShippingEstimated?: boolean;
}

export class LandedCostCalculator {
  // 即時匯率參考表 (在 MVP 中保存靜態基準，並記錄更新時間)
  private static EXCHANGE_RATES: Record<string, number> = {
    TWD: 1.0,
    JPY: 0.215, // 1 日圓約等於 0.215 新台幣
    USD: 32.2,  // 1 美元約等於 32.2 新台幣
    EUR: 35.1
  };

  // Rates are illustrative fixtures, not live exchange data.
  private static LAST_RATES_UPDATED = '1970-01-01T00:00:00.000Z';

  /**
   * 計算標準總到手價 (新台幣計價)
   */
  public static calculate(input: CalculationInput): LandedCostBreakdown {
    const cur = input.currency.toUpperCase();
    const rate = this.EXCHANGE_RATES[cur] || 1.0;
    const isForeign = cur !== 'TWD';
    const notes: string[] = [];
    const missingCostFields: string[] = [];

    let isEstimated = false;

    // 1. 商品基礎價格與確定折扣換算
    const rawPriceTwd = Math.round(input.itemPrice * rate);
    // 嚴格規定：僅扣除已確認可套用之優惠，若為不確定之信用卡或條件折價不計
    const discountTwd = input.couponConfirmed ? Math.max(0, Math.round(input.couponDiscount * rate)) : 0;
    if (input.couponDiscount > 0 && !input.couponConfirmed) notes.push('未確認可使用的優惠券，未計入折扣');
    const netItemPriceTwd = Math.max(0, rawPriceTwd - discountTwd);

    if (discountTwd > 0) {
      notes.push(`已扣除賣場折價券 NT$ ${discountTwd.toLocaleString()}`);
    }

    // 2. 當地運費 (若是台灣賣場則為國內運費；國外賣場則為境內寄送運費)
    const domesticShippingTwd = Math.round(input.domesticShipping * rate);
    if (domesticShippingTwd === 0) {
      notes.push('符合平台境內免運條件');
    } else {
      notes.push(`境內運費: NT$ ${domesticShippingTwd.toLocaleString()}`);
    }

    // 3. 國際運費評估
    let internationalShippingTwd = 0;
    if (isForeign) {
      if (input.internationalShipping > 0) {
        internationalShippingTwd = Math.round(input.internationalShipping * rate);
        notes.push(`國際空運/海運運費: NT$ ${internationalShippingTwd.toLocaleString()}`);
      } else if (input.isShippingEstimated) {
        // 若運費未明或大型家電需估算
        internationalShippingTwd = 450; // 小型包裹預設估算基準
        isEstimated = true;
        missingCostFields.push('internationalShipping');
        notes.push('⚠️ 國際運費尚未取得最終報價，目前依標準包裹預估 NT$ 450，結帳前請向賣家確認。');
      }
    }

    // 4. 關稅與進口營業稅估算 (台灣海關規範：完稅價格 CIF = 商品淨額 + 運費)
    // 門檻：新台幣 2,000 元以上需徵收關稅與 5% 營業稅
    const cifTwd = netItemPriceTwd + domesticShippingTwd + internationalShippingTwd;
    let dutyRate = 0.0;

    // 依品類區分關稅率 (電腦周邊/手機通常為零關稅；家電如電子鍋約 5% ~ 10%)
    if (input.category === 'Appliances') {
      dutyRate = 0.05; // 5% 家電進口稅
    } else if (input.category === 'Headphones') {
      dutyRate = 0.0;  // 資訊耳機多數為零關稅
    } else if (input.category === 'Smartphones') {
      dutyRate = 0.0;  // 通訊設備零關稅
    } else if (input.category === 'Monitors') {
      dutyRate = 0.0;
    }

    let estimatedDutyTwd = 0;
    let estimatedTaxTwd = 0;

    if (isForeign && cifTwd > 2000) {
      estimatedDutyTwd = Math.round(cifTwd * dutyRate);
      // 營業稅 = (CIF + 關稅) * 5%
      estimatedTaxTwd = Math.round((cifTwd + estimatedDutyTwd) * 0.05);
      isEstimated = true;
      notes.push(`海關課稅估算: 進口關稅 NT$ ${estimatedDutyTwd} (${(dutyRate * 100).toFixed(0)}%) + 進口營業稅 NT$ ${estimatedTaxTwd} (5%)`);
    } else if (isForeign && cifTwd <= 2000) {
      notes.push('總額在 NT$ 2,000 以內，享有海外包裹半年 6 次免稅額度優惠');
    }

    // 5. 服務費 (如代購或跨國刷卡手續費 1.5%)
    let serviceFeeTwd = 0;
    if (isForeign) {
      isEstimated = true;
      notes.push('外幣匯率為示範固定值，非即時行情');
      serviceFeeTwd = Math.round(netItemPriceTwd * 0.015);
      notes.push(`國際刷卡手續費預估 1.5%: NT$ ${serviceFeeTwd}`);
    }

    // 6. 總到手價加總
    const totalTwd = netItemPriceTwd + domesticShippingTwd + internationalShippingTwd + estimatedDutyTwd + estimatedTaxTwd + serviceFeeTwd;

    if (isForeign) {
      notes.push(`匯率基準: 1 ${cur} = ${rate} TWD (資料時間: ${this.LAST_RATES_UPDATED.split('T')[0]})`);
      notes.push('最終扣款以發卡行或電商結帳頁面為主');
    }

    return {
      itemPriceTwd: netItemPriceTwd,
      discountTwd,
      domesticShippingTwd,
      internationalShippingTwd,
      estimatedDutyTwd,
      estimatedTaxTwd,
      serviceFeeTwd,
      totalTwd,
      exchangeRate: rate,
      exchangeRateUpdatedAt: this.LAST_RATES_UPDATED,
      isEstimated,
      missingCostFields,
      calculationNotes: notes
    };
  }
}
