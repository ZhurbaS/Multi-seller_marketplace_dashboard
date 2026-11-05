// Експорт CSV: GET /seller/analytics/export/<report>.csv через axios (blob, cookie-сесія як в усіх запитах кабінету).
import api from "../../../../api/api";

async function blobError(e) {
  try {
    const data = e?.response?.data;
    if (data && typeof data.text === "function") {
      const j = JSON.parse(await data.text());
      return j.error || j.message || null;
    }
  } catch {
    /* не JSON */
  }
  return null;
}

/** downloadCsv('sales'|'products'|'inventory'|'customers', {from,to,compare}) — завантажує файл. */
export async function downloadCsv(report, query = {}) {
  try {
    const res = await api.get(`/seller/analytics/export/${encodeURIComponent(report)}.csv`, {
      params: query,
      responseType: "blob",
      withCredentials: true,
    });
    const cd = res.headers?.["content-disposition"] || "";
    const m = /filename="?([^";]+)"?/i.exec(cd);
    const name = m ? m[1] : `${report}_${query.from || ""}_${query.to || ""}.csv`;
    const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch (e) {
    const msg = (await blobError(e)) || (e?.response ? "Не вдалося сформувати файл" : "Немає зв'язку із сервером");
    throw new Error(msg);
  }
}
