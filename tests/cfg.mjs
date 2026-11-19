/* v4.9.0: a Configuração está em grupos que abrem e fecham (<details>), e só
   «Dados» abre sozinho. Os smoke tests mexem em campos de todos os grupos:
   este passo abre-os todos, para que fiquem visíveis e se possam carregar. */
export async function abrirGruposCfg(pg) {
  await pg.evaluate(() => document.querySelectorAll("#view-cfg details.grp").forEach((d) => { d.open = true; }));
}
