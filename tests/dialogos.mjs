/* Auxiliar dos smoke tests: responde à caixa de diálogo própria da app
   (<dialog id="dlg">, desde 3.9.0; desde 3.13.0 é também a dos avisos e das
   confirmações, que deixaram de ser alert()/confirm() nativos).

   `responder({titulo, texto, temCampo})` devolve:
   - o rótulo do botão a carregar ("Confirmar", "Cancelar", "Fundir", ...);
   - {campo, botao}, para escrever primeiro no campo (o código de acesso);
   - nada (undefined), para carregar no botão por omissão (OK, Confirmar...).
   Um rótulo que a caixa não tenha também cai no botão por omissão: assim um
   teste que só responde ao código de acesso aceita os avisos pelo caminho.

   Cada caixa é respondida UMA vez (data-seq): duas notificações do observador
   para a mesma caixa não podem carregar em botões da seguinte.

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
      const botoes = () => [...document.querySelectorAll("#dlg-btns button")];
      let respondida = null;
      new MutationObserver(async () => {
        if (!d.open || d.dataset.seq === respondida) return;
        const seq = respondida = d.dataset.seq;
        const r = await window.__dlgResposta(
          document.getElementById("dlg-tit").textContent,
          document.getElementById("dlg-txt").textContent,
          !document.getElementById("dlg-campo").classList.contains("hidden"));
        if (!d.open || d.dataset.seq !== seq) return;
        const { campo, botao } = r == null ? {} : typeof r === "string" ? { botao: r } : r;
        if (campo != null) document.getElementById("dlg-campo").value = campo;
        const b = botoes().find(x => x.textContent === botao) || botoes().find(x => x.hasAttribute("data-def"));
        b.click();
        if (d.open && d.dataset.seq === seq && !document.getElementById("dlg-erro").classList.contains("hidden"))
          botoes().find(x => x.textContent === "Cancelar").click();
      }).observe(d, { attributes: true, attributeFilter: ["open", "data-seq"] });
    };
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", ligar);
    else ligar();
  });
}

/* Espera que a caixa feche e que a acção que a abriu tenha continuado. Duas
   verificações espaçadas: uma acção pode abrir uma caixa logo a seguir a outra
   (confirmação e depois o código de acesso). */
export async function semDialogo(pg) {
  const fechada = () => pg.waitForFunction(() => !document.getElementById("dlg").open);
  await fechada();
  await pg.waitForTimeout(50);
  await fechada();
}
