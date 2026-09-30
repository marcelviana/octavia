#!/bin/sh
# I1-PR-13 — os remendos da pré-verificação sem sessão. Rodar NA CÓPIA da árvore (nunca na árvore da PR):
#   sh docs/ux/I1-PR13-anexos/pre-verificacao/remendos.sh
# Sem Firebase não há usuário nem token; os três remendos dão um usuário e um token DE FUMAÇA para a tela andar. As
# leituras e as escritas seguem fabricadas no navegador pelo roteiro (`rodar.ts`); o que escapar é abortado e contado.
set -e
[ -e .env.local ] && { echo "remendos: há .env.local aqui — isto não é a cópia"; exit 1; }
mkdir -p "app/fumaca-i1pr13/[estado]"
cp docs/ux/I1-PR13-anexos/pre-verificacao/pagina-fumaca.tsx "app/fumaca-i1pr13/[estado]/page.tsx"
python3 - <<'PY'
def rep(p, a, b, n=1):
    s = open(p, encoding='utf-8').read()
    assert s.count(a) == n, (p, a, s.count(a))
    open(p, 'w', encoding='utf-8').write(s.replace(a, b))
FUMACA = '{ uid: "fumaca", email: "fumaca@exemplo.com", displayName: "Fumaça" }'
# 1. o hook da tela: um usuário de fumaça, sem carregar
# (o usuário é uma constante do módulo: um objeto novo a cada render refaria a carga sem parar)
rep('components/setlists/use-setlists.ts', 'const { user, isLoading } = useFirebaseAuth()',
    'useFirebaseAuth(); const user = USUARIO_DE_FUMACA, isLoading = false')
rep('components/setlists/use-setlists.ts', 'type Formulario = ', 'const USUARIO_DE_FUMACA = %s\ntype Formulario = ' % FUMACA)
# 2. o serviço das setlists: o `auth` de fumaça (usuário + token)
rep('lib/setlist-service.ts', 'import { auth } from "@/lib/firebase"',
    'const auth: any = { currentUser: { uid: "fumaca", email: "fumaca@exemplo.com", getIdToken: async () => "fumaca" } }')
rep('lib/setlist-service.ts', '    const { auth } = await import("@/lib/firebase")\n', '', 7)
# 3. a leitura da biblioteca: usuário e token de fumaça
rep('lib/content-service.ts', '''  try {
    if (typeof window !== "undefined") {
      const { auth } = await import("@/lib/firebase");''', '''  try {
    if (typeof window !== "undefined") return { id: "fumaca", email: "fumaca@exemplo.com" };
    if (typeof window !== "undefined") {
      const { auth } = await import("@/lib/firebase");''')
rep('lib/auth-manager.ts', 'export async function getValidToken', 'export async function getValidToken() { return { token: "fumaca", error: null } }\nexport async function getValidTokenDeVerdade')
PY
echo "remendos aplicados"
