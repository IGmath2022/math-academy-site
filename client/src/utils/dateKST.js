// client/src/utils/dateKST.js
/** 브라우저 로컬(한국) 기준으로 YYYY-MM-DD 생성 (toISOString 금지!) */
export function toYmdLocal(d = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    return `${y}-${m}-${day}`;
  }
  
  /** YYYY-MM (달 네비게이션 등에 사용) */
  export function toYmLocal(d = new Date()) {
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
  }
  
  /** 'YYYY-MM'에서 ±n개월 이동 */
  export function shiftYm(ym, diff) {
    const dt = new Date(`${ym}-01T00:00:00`);
    dt.setMonth(dt.getMonth() + diff);
    return toYmLocal(dt);
  }
  