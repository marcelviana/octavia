/**
 * I1-PR-6 — as frases das cinco telas de auth (lista declarada da I1-D10/D17;
 * `DESIGN-I1/README-design.md` §5.1, §5.2 e a N1 da §5.10; tabela chave · texto
 * · origem em `docs/ux/I1-PR6-anexos/README.md`). pt-BR, estilo do nativo:
 * minúsculas, travessão, sem ponto final; botões com inicial maiúscula. As sete
 * da sessão (I1-PR-1) moram em `frases-sessao.ts` e vêm de lá, intactas.
 *
 * A frase se escolhe pelo CÓDIGO que o contexto devolve (decisão 5 do aval, A2):
 * `fraseDoErroDeEntrar`, `fraseDoErroDoGoogle`, `fraseDoErroDeCriar`,
 * `fraseDoErroDeReenviar`. O que não tem código conhecido vira `motivo.generico`.
 */
import { FRASES_SESSAO } from './frases-sessao'

export const FRASES_AUTH = {
  // §5.1 — comuns
  'motivo.generico': 'algo deu errado — tente de novo',
  'motivo.limite': 'muitas tentativas — tente de novo em instantes',
  'acao.tentar': FRASES_SESSAO['tentar-de-novo'],
  'estado.carregando': 'carregando…',
  // §5.2 — login
  'login.credencial': 'e-mail ou senha não conferem',
  'login.sem-conta-email': 'nenhuma conta com este e-mail',
  'login.senha-incorreta': 'senha incorreta',
  'login.google-cancelado': 'o login com Google foi cancelado',
  'login.google-bloqueado': 'o navegador bloqueou a janela do Google — libere pop-ups e tente de novo',
  'login.rotulo': 'Entrar',
  'login.entrar': 'Entrar',
  'login.entrando': 'Entrando…',
  'login.email': 'E-mail',
  'login.email.placeholder': 'voce@exemplo.com',
  'login.senha': 'Senha',
  'login.esqueci': 'Esqueci a senha',
  'login.ou': 'ou',
  'login.google': 'Entrar com Google',
  'login.google.carregando': 'Carregando…',
  'login.sem-conta': 'Não tem conta?',
  'login.criar-conta': 'Criar conta',
  'login.abrindo': 'abrindo o painel…',
  'login.nao-abriu': 'Não abriu?',
  'login.abrir-painel': 'Abrir o painel',
  'login.nao-configurado': 'o login não está disponível neste servidor',
  // §5.2 — signup
  'signup.rotulo': 'Criar conta',
  'signup.criar': 'Criar conta',
  'signup.nome': 'Nome',
  'signup.sobrenome': 'Sobrenome',
  'signup.instrumento': 'Instrumento principal',
  'signup.senha.dica': 'no mínimo 6 caracteres',
  'signup.confirmar': 'Confirmar a senha',
  'signup.criando': 'Criando a conta…',
  'signup.ja-tem': 'Já tem conta?',
  'signup.voltar': 'Voltar para o login',
  'signup.senhas': 'as senhas não conferem',
  'signup.email-usado': 'já existe uma conta com este e-mail — entre ou use outro',
  'signup.senha-fraca': 'senha fraca — use pelo menos 6 caracteres',
  'signup.rede': 'sem conexão — a conta não foi criada',
  'signup.limite': 'muitas tentativas — tente de novo em instantes',
  'signup.perfil': 'falha no servidor — o perfil não foi criado',
  // §5.2 — confirm-email
  'confirm.rotulo': 'Confirme o e-mail',
  'confirm.apoio': 'enviamos um link de confirmação para {email} — abra o link para ativar a conta',
  'confirm.ir-login': 'Ir para o login',
  'confirm.nao-recebeu': 'Não recebeu o e-mail?',
  'confirm.reenviar': 'Reenviar o e-mail',
  'confirm.enviando': 'Enviando…',
  'confirm.enviado': 'e-mail de confirmação enviado — veja a caixa de entrada',
  'confirm.rede': 'sem conexão — o e-mail não foi enviado',
  'confirm.sessao-caiu': 'a sessão caiu — entre de novo',
  // §5.2 — verify-email
  'verify.apoio': 'confirme o e-mail {email} para usar o Octavia',
  'verify.ja-confirmei': 'Já confirmei',
  'verify.conferindo': 'Conferindo…',
  'verify.sair': 'Sair',
  'verify.ajuda': 'problemas? veja o spam ou fale com o suporte',
  'verify.nao-confirmado': 'o e-mail ainda não foi confirmado — abra o link que enviamos',
  'verify.checar-falhou': 'não foi possível conferir a confirmação',
  // §5.2 — forgot-password, e a N1 da §5.10
  'forgot.rotulo': 'Trocar a senha',
  'forgot.apoio': 'digite o e-mail e enviamos um link para trocar a senha',
  'forgot.enviar': 'Enviar o link',
  'forgot.lembrou': 'Lembrou a senha?',
  'forgot.entrar': 'Entrar',
  'forgot.enviando': 'Enviando…',
  'forgot.indisponivel': 'a troca de senha não está disponível',
  'forgot.erro': 'não foi possível enviar o e-mail — algo deu errado',
  'forgot.veja': 'Veja o e-mail',
  'forgot.enviado': 'enviamos as instruções para {email} — não chegou? veja o spam ou tente de novo',
  'forgot.voltar': 'Voltar para o login',
  // nomes acessíveis (os das folhas: "Octavia" é o nome do produto, "Google" o da marca de terceiro)
  'marca.octavia': 'Octavia',
  'marca.google': 'Google',
} as const

export type ChaveAuth = keyof typeof FRASES_AUTH

/** `{email}` (e qualquer `{x}`) é dado. */
export function comDado(chave: ChaveAuth, dados: Record<string, string>): string {
  return FRASES_AUTH[chave].replace(/\{(\w+)\}/g, (_, k: string) => dados[k] ?? '')
}

/** Onde a frase aparece: sob o campo (validação), sob o botão do Google, ou na `LinhaDeAviso`. */
export type TipoAviso = 'falha' | 'rede' | 'limite' | 'sucesso'
export type FraseDeErro =
  | { onde: 'campo'; campo: 'email' | 'senha' | 'confirmar'; texto: string }
  | { onde: 'google'; texto: string }
  | { onde: 'linha'; tipo: TipoAviso; texto: string; tentar: boolean }

const linha = (tipo: TipoAviso, texto: string, tentar: boolean): FraseDeErro => ({ onde: 'linha', tipo, texto, tentar })
const GENERICO = linha('falha', FRASES_AUTH['motivo.generico'], false)

/** O código de uma falha do SDK (ou do contexto) → a frase do login por e-mail e senha. */
export function fraseDoErroDeEntrar(codigo: string | undefined): FraseDeErro {
  switch (codigo) {
    case 'auth/invalid-credential':
    case 'auth/invalid-email':
      return { onde: 'campo', campo: 'senha', texto: FRASES_AUTH['login.credencial'] }
    case 'auth/user-not-found':
      return { onde: 'campo', campo: 'email', texto: FRASES_AUTH['login.sem-conta-email'] }
    case 'auth/wrong-password':
      return { onde: 'campo', campo: 'senha', texto: FRASES_AUTH['login.senha-incorreta'] }
    case 'auth/too-many-requests':
      return linha('limite', FRASES_SESSAO['limite-sem-prazo'], false)
    case 'auth/network-request-failed':
      return linha('rede', FRASES_SESSAO.rede, true)
    case 'octavia/nao-configurado':
      return linha('falha', FRASES_AUTH['login.nao-configurado'], false)
    default:
      return GENERICO
  }
}

/** A falha do *Entrar com Google* — sob o botão do Google (resposta 5 da rodada 2). */
export function fraseDoErroDoGoogle(codigo: string | undefined): FraseDeErro {
  switch (codigo) {
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return { onde: 'google', texto: FRASES_AUTH['login.google-cancelado'] }
    case 'auth/popup-blocked':
      return { onde: 'google', texto: FRASES_AUTH['login.google-bloqueado'] }
    case 'auth/network-request-failed':
      return linha('rede', FRASES_SESSAO.rede, true)
    case 'octavia/nao-configurado':
      return linha('falha', FRASES_AUTH['login.nao-configurado'], false)
    default:
      return { onde: 'google', texto: FRASES_AUTH['motivo.generico'] }
  }
}

/** A falha de *Criar conta*. */
export function fraseDoErroDeCriar(codigo: string | undefined): FraseDeErro {
  switch (codigo) {
    case 'auth/email-already-in-use':
      return linha('falha', FRASES_AUTH['signup.email-usado'], false)
    case 'auth/weak-password':
      return linha('falha', FRASES_AUTH['signup.senha-fraca'], false)
    case 'auth/network-request-failed':
      return linha('rede', FRASES_AUTH['signup.rede'], true)
    case 'auth/too-many-requests':
      return linha('limite', FRASES_AUTH['signup.limite'], false)
    case 'octavia/perfil':
      return linha('falha', FRASES_AUTH['signup.perfil'], true)
    case 'octavia/nao-configurado':
      return linha('falha', FRASES_AUTH['login.nao-configurado'], false)
    default:
      return linha('falha', FRASES_AUTH['motivo.generico'], true)
  }
}

/** A falha de *Reenviar o e-mail* (confirm-email e verify-email). */
export function fraseDoErroDeReenviar(codigo: string | undefined): FraseDeErro {
  switch (codigo) {
    case 'auth/too-many-requests':
      return linha('limite', FRASES_AUTH['motivo.limite'], false)
    case 'auth/network-request-failed':
      return linha('rede', FRASES_AUTH['confirm.rede'], true)
    case 'octavia/sem-usuario':
      return linha('falha', FRASES_AUTH['confirm.sessao-caiu'], false)
    default:
      return linha('falha', FRASES_AUTH['motivo.generico'], true)
  }
}
