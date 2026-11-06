/* Auxiliar dos smoke tests: responde à caixa de diálogo própria da app
   (<dialog id="dlg">, desde 3.9.0) como pg.on("dialog") responde às nativas.

   `responder({titulo, texto, temCampo})` devolve o rótulo do botão a carregar
   ("Confirmar", "Cancelar", "Fundir", "Substituir tudo") ou {campo, botao}
   para escrever primeiro no campo (o código de acesso).

   Com um código errado a caixa fica aberta, com o aviso, à espera de nova
   tentativa: o auxiliar desiste, carregando em Cancelar — é o que faz quem não
   sabe o código. */
export async function ligarDialogos(pg, responder) {
  await pg.exposeFunction("__dlgResposta", (titulo, texto, temCampo) =>
    responder({ titulo, texto, temCampo }));
  await pg.addInitScript(() => {
    const ligar = () => {
      const d = document.getElementById("dlg");
      if (!d) return;
      const botao = rot => [...document.querySelectorAll("#dlg-btns button")].find(b => b.textContent === rot);
      new MutationObserver(async () => {
        if (!d.open) return;
        const r = await window.__dlgResposta(
          document.getElementById("dlg-tit").textContent,
          document.getElementById("dlg-txt").textContent,
          !document.getElementById("dlg-campo").classList.contains("hidden"));
        const { campo, botao: rot } = typeof r === "string" ? { botao: r } : r;
        if (campo != null) document.getElementById("dlg-campo").value = campo;
        botao(rot).click();
        if (d.open && !document.getElementById("dlg-erro").classList.contains("hidden"))
          botao("Cancelar").click();
      }).observe(d, { attributes: true, attributeFilter: ["open"] });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligar);
    else ligar();
  });
}

/* Espera que a caixa feche e que a acção que a abriu tenha continuado. */
export const semDialogo = pg =>
  pg.waitForFunction(() => !document.getElementById("dlg").open);
