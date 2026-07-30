"""Verificação de impressão (v3.1.0): 5 eixos no radar por responsável,
5 blocos de recomendações e nenhuma folha em transbordo."""
import json, sys
from playwright.sync_api import sync_playwright

# A4 retrato com margens de 10mm ≈ 190mm x 277mm úteis @96dpi
UTIL_H = 277 / 25.4 * 96

SEED = """
localStorage.clear();
const items = window.__ITEMS_FOR_TEST;
const mk = (id, date, r8) => ({
  id, service: 'Serviço A', date, pick: 'P', repo: 'R', verif: 'V', note: '',
  items: items.map(x => x.n === 8 ? Object.assign({}, x, {r: r8}) : x),
  scores: items.map((x, i) => i % 3),
  raw: items.map(() => 1)
});
localStorage.setItem('audits', JSON.stringify([
  mk(1, '2025-11-01', 'R'),   // auditoria anterior a v3.1.0
  mk(2, '2026-01-15', 'P')    // auditoria nova, com Picking
]));
localStorage.setItem('services', JSON.stringify(['Serviço A']));
"""

with sync_playwright() as p:
    b = p.chromium.launch(headless=True)
    pg = b.new_page(viewport={"width": 794, "height": 1123})
    pg.goto("http://localhost:8000/index.html")
    pg.wait_for_load_state("networkidle")
    pg.evaluate("window.__ITEMS_FOR_TEST = DEFAULT_ITEMS")
    pg.evaluate(SEED)
    pg.reload()
    pg.wait_for_load_state("networkidle")

    out = {}
    # abrir o relatório da auditoria nova
    pg.evaluate("openReport(audits.find(a=>a.id===2))")
    pg.wait_for_timeout(300)
    pg.emulate_media(media="print")
    pg.wait_for_timeout(200)

    out["eixos_radar_resp"] = pg.eval_on_selector_all(
        "#view-report .page-1 > .card:nth-child(2) svg text[font-weight='700']",
        "els => els.map(e => e.textContent)")
    out["barras_resp"] = pg.eval_on_selector_all(
        "#view-report .page-1 > .card:nth-child(2) .stat-row",
        "els => els.map(e => e.textContent.trim().replace(/\\s+/g,' '))")
    out["blocos_rec"] = pg.eval_on_selector_all(
        "#view-report .page-3 .rec-block h3", "els => els.map(e => e.textContent)")
    out["alturas"] = pg.eval_on_selector_all(
        "#view-report .page",
        "els => els.map(e => ({cls: e.className, h: Math.round(e.getBoundingClientRect().height)}))")

    # relatório da auditoria antiga: 4 eixos, sem Picking
    pg.emulate_media(media="screen")
    pg.evaluate("openReport(audits.find(a=>a.id===1))")
    pg.wait_for_timeout(300)
    out["eixos_antiga"] = pg.eval_on_selector_all(
        "#view-report .page-1 > .card:nth-child(2) svg text[font-weight='700']",
        "els => els.map(e => e.textContent)")

    # vista Análise: médias por responsável
    pg.evaluate("document.querySelector('[data-view=\"analysis\"], [data-nav=\"analysis\"]')?.click()")
    pg.wait_for_timeout(200)
    out["med_resp"] = pg.evaluate("medByResp(audits).map(d => d.name + ' ' + d.pct + '%')")

    # Pior caso da folha 3: foto em todos os cinco blocos.
    pg.emulate_media(media="screen")
    pg.evaluate("openReport(audits.find(a=>a.id===2))")
    pg.evaluate("""() => {
      const px = 'data:image/gif;base64,'
        + 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
      REC_KEYS.forEach(k => REC_FOTOS.set(k, px));
      redrawRecs(audits.find(a => a.id === 2));
    }""")
    pg.emulate_media(media="print")
    pg.wait_for_timeout(200)
    out["alturas"].append({
        "cls": "page page-3 (5 fotos)",
        "h": round(pg.eval_on_selector("#view-report .page-3",
                                       "e => e.getBoundingClientRect().height"))})

    out["limite_folha_px"] = round(UTIL_H)
    print(json.dumps(out, ensure_ascii=False, indent=1))
    b.close()

for pagina in out["alturas"]:
    if pagina["h"] > UTIL_H:
        print(f"TRANSBORDO: {pagina['cls']} = {pagina['h']}px > {round(UTIL_H)}px")
        sys.exit(1)
print("Sem transbordo em nenhuma folha.")
