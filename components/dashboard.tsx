"use client";

/**
 * O PAINEL (I1-PR-9; folha `4-content-lista`: `DASH`, `DASH-vazio`,
 * `DASH-vazio-favoritas`, `DASH-erro`, `SESSAO-nao-renovada`). Título *Painel* e
 * *Adicionar*; abas Visão geral · Recentes · Favoritas; a linha da tela abaixo
 * das abas (uma por tela: a sessão vence; senão `dash.erro` com *Tentar de
 * novo*, que refaz o SSR — `router.refresh()`, um por clique); os contadores
 * (só na visão geral) e as duas listas. Vazio ≠ erro (decisão 4 do aval): na
 * falha, o contador é "—" e a lista não diz "nada".
 */
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BotaoAdicionar, TituloDaTela, alternavel } from "@/components/identidade/controles";
import { LinhaDaTela } from "@/components/identidade/linha-da-tela";
import { ContadoresDoPainel } from "@/components/painel/contadores-do-painel";
import { ListaDoPainel } from "@/components/painel/lista-do-painel";
import { FRASES_LISTA, comDado, type ChaveLista } from "@/components/library/frases-lista";

export type ContentItem = {
  id: string;
  title: string;
  content_type: string;
  created_at: string;
  updated_at: string;
  is_favorite: boolean;
};

export type UserStats = {
  totalContent: number;
  totalSetlists: number;
  favoriteContent: number;
  recentlyViewed: number;
};

export interface DashboardProps {
  recentContent: ContentItem[];
  favoriteContent: ContentItem[];
  stats: UserStats | null;
  erroConteudo: boolean;
  erroNumeros: boolean;
}

type Aba = "geral" | "recentes" | "favoritas";
const ABAS: readonly { id: Aba; rotulo: ChaveLista }[] = [
  { id: "geral", rotulo: "dash.abas.geral" },
  { id: "recentes", rotulo: "dash.abas.recentes" },
  { id: "favoritas", rotulo: "dash.abas.favoritas" },
];

export function Dashboard({ recentContent, favoriteContent, stats, erroConteudo, erroNumeros }: DashboardProps) {
  const router = useRouter();
  const [aba, setAba] = useState<Aba>("geral");
  const falhou = erroConteudo || erroNumeros;
  const recentes = (
    <ListaDoPainel titulo={FRASES_LISTA["dash.recentes"]} vazio={FRASES_LISTA["dash.vazio.recentes"]} itens={recentContent} falhou={erroConteudo} />
  );
  const favoritas = (
    <ListaDoPainel titulo={FRASES_LISTA["dash.favoritas"]} vazio={FRASES_LISTA["dash.vazio.favoritas"]} itens={favoriteContent} falhou={erroConteudo} />
  );

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-espaco-lg">
        <TituloDaTela>{FRASES_LISTA["dash.titulo"]}</TituloDaTela>
        <BotaoAdicionar rotulo={FRASES_LISTA["dash.adicionar"]} />
      </div>
      <div role="tablist" className="flex flex-wrap gap-espaco-sm">
        {ABAS.map((a) => (
          <button key={a.id} type="button" role="tab" aria-selected={aba === a.id} onClick={() => setAba(a.id)} className={alternavel(aba === a.id, "px-espaco-lg")}>
            {FRASES_LISTA[a.rotulo]}
          </button>
        ))}
      </div>
      <LinhaDaTela
        rotuloTentar={FRASES_LISTA["acao.tentar"]}
        falha={falhou ? { tipo: "falha", motivo: comDado("dash.erro", { motivo: FRASES_LISTA["motivo.servidor"] }), onTentar: () => router.refresh() } : null}
      />
      {aba === "geral" && (
        <>
          <ContadoresDoPainel stats={erroNumeros ? null : stats} />
          <div className="grid grid-cols-1 c:grid-cols-2 gap-espaco-xl">
            {recentes}
            {favoritas}
          </div>
        </>
      )}
      {aba === "recentes" && recentes}
      {aba === "favoritas" && favoritas}
    </>
  );
}
