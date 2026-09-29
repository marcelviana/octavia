/**
 * `LIB-salvo` (I1-PR-11, decisão 1 do aval): o sinal de que o editor acabou de salvar, para a biblioteca dizer
 * *alterações salvas* (folha 4). Estado EM MEMÓRIA do módulo — o mesmo padrão do `contentCache` de
 * `lib/content-service.ts` —, vivo durante a navegação suave do `router.push("/library")`; recarregar a página o perde
 * (a frase é do instante). Sem rota, sem URL, sem armazenamento. A biblioteca o lê e APAGA uma vez.
 */
let salvo = false

export function marcarSalvo(): void {
  salvo = true
}

export function consumirSalvo(): boolean {
  const era = salvo
  salvo = false
  return era
}
