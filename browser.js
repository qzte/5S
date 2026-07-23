const { chromium } = require("playwright");

(async () => {
  const b = await chromium.launch();
  const pg = await b.newPage();
  const errs = [];
  pg.on("pageerror", e => errs.push("PAGEERROR: " + e.message));
  pg.on("console", m => { if (m.type() === "error") errs.push("CONSOLE: " + m.text()); });

  /* Semear localStorage com 8 auditorias ao mesmo serviço, para exercitar o
     corte às 6 e o desenho das barras. */
  await pg.addInitScript(() => {
    const auds = [];
    for (let i = 1; i <= 8; i++) {
      auds.push({
        id: 1000 + i, service: "UCIP (11120)",
        date: "2026-0" + i + "-15",
        pick: "Ana", repo: "Rui", verif: "Sofia", note: "",
        scores: new Array(19).fill(i % 3 === 0 ? 2 : i % 3 === 1 ? 1 : 0)
      });
    }
    localStorage.setItem("audits", JSON.stringify(auds));
    localStorage.setItem("services", JSON.stringify(["UCIP (11120)"]));
  });

  await pg.goto("http://localhost:8899/index.html");
  await pg.waitForTimeout(600);

  await pg.click('[data-v="history"]');
  await pg.waitForTimeout(300);
  await pg.click('[data-rep="0"]');
  await pg.waitForTimeout(500);

  const r = await pg.evaluate(() => {
    const p1 = document.querySelector("#view-report .page-1");
    const p3 = document.querySelector("#view-report .page-3");
    const hist = document.querySelector("#view-report .hist-block");
    return {
      pages: document.querySelectorAll("#view-report .page").length,
      histPresent: !!hist,
      histBars: hist ? hist.querySelectorAll("rect").length : 0,
      p3Present: !!p3,
      recBlocks: p3 ? p3.querySelectorAll(".rec-block").length : 0,
      recTitles: p3 ? [...p3.querySelectorAll(".rec-block h3")].map(h => h.textContent.trim()) : [],
      textareas: p3 ? p3.querySelectorAll("textarea[data-rec]").length : 0
    };
  });
  console.log("Estrutura do relatório:", JSON.stringify(r, null, 2));

  /* Escrever uma recomendação e confirmar que é gravada. */
  await pg.fill('textarea[data-rec="M"]', "Substituir a calha da prateleira 3.");
  await pg.waitForTimeout(400);
  const saved = await pg.evaluate(() => {
    const a = JSON.parse(localStorage.getItem("audits")).find(x => x.id === 1008);
    return a && a.recs ? a.recs["M"] : null;
  });
  console.log("Texto gravado em localStorage:", JSON.stringify(saved));

  /* Confirmar que nenhuma foto entra em localStorage. */
  const noPhoto = await pg.evaluate(() =>
    !JSON.stringify(localStorage).includes("data:image"));
  console.log("localStorage sem fotos:", noPhoto);

  await pg.emulateMedia({ media: "print" });
  await pg.waitForTimeout(300);
  await pg.screenshot({ path: "print-preview.png", fullPage: true });
  console.log("Erros:", errs.length ? errs : "nenhum");
  await b.close();
})();
