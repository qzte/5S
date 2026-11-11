/* Auxiliar dos smoke tests (4.2.6): uma auditoria nova começa sem serviço, e
   gravar sem ele não grava. Antes de gravar uma auditoria nova, os testes
   escolhem um serviço — o pedido, ou o primeiro da lista — pela mesma função
   que a caixa do serviço usa. Em edição o serviço já vem escolhido, e isto não
   faz nada. */
export async function escolherServico(pg, nome) {
  if (await pg.locator("#f-service").inputValue()) return;
  await pg.evaluate(n => {
    const v = n || [...document.querySelectorAll("#f-service option")].map(o => o.value).find(Boolean);
    if (v) escolherServico(v);
  }, nome || null);
}
