/**
 * S0 — Entrar (PRD T1-R6 e T1-R36; aceites A1 e A20), com o acabamento do
 * DESIGN-V1 na V1-PR6 (a moldura `S0` do `telas.html`, com as erratas da §9
 * prevalecendo).
 *
 * Layout do design congelado: a marca na metade esquerda, coluna de formulário
 * à direita com o rótulo "ENTRAR", email, senha, botão e o erro **abaixo** dos
 * campos.
 *
 * Só email/senha (H18): sem Google, sem "criar conta" (o cadastro é do web,
 * PRD §13), sem "esqueci a senha". Nenhuma chamada a `/api/*` acontece aqui.
 *
 * O que a V1-PR6 mudou é pintura, não comportamento:
 *
 *  - a **marca real**, inteira e sem recorte, a 340 dp (§8.4). A V1-PR4 já
 *    tinha recortado o laço a 60 dp no S1f; aqui é o arquivo todo, que é o que
 *    a captura mostra e o que a moldura refez. O `accessibilityLabel="Octavia"`
 *    continua onde estava — é uma das **duas** casas do app (E11);
 *  - os dois campos ganham ícone de 20 em `lineInfo` (§3.3, regra 1: ícone),
 *    e os rótulos flutuantes "Email" e "Senha" saem da tela e viram
 *    `accessibilityLabel` do próprio campo: o desenho passa a marcar o papel,
 *    e o leitor de tela não perde nada;
 *  - o erro ganha o triângulo de `falha` ao lado do texto, e o campo da senha
 *    ganha borda em `errorInk`;
 *  - o botão ganha o `log-in` de 24 — o desenho que a E8 descreve, a porta
 *    espelhada com a seta entrando;
 *  - **E3**: o botão inativo era `opacity: 0.4`, e a §6.2 proíbe opacidade em
 *    estado. Passa a ser tinta: o preenchimento vai para `lineInfo`, que é o
 *    token que a §3.3 dá ao elemento desabilitado (e que a norma isenta de
 *    contraste justamente por estar inativo). O pressionado, pela mesma razão,
 *    troca `opacity: 0.85` pelo preenchimento em `muted`.
 *
 * Nenhum texto de erro muda (T1-R36, §1), nenhum controle deixa de aceitar
 * toque, e nada aqui fala com a rede.
 */
import { useState } from 'react'
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import { Icone } from '../icones/Icone'
import { log } from '../log'
import { signIn, type AuthErrorKey } from '../session'
import { dark, font, radius, size, space, touch, tracking } from '../theme'

/** Textos pt-BR das chaves de erro (T1-R36: a mensagem deriva do código). */
const MENSAGEM: Record<AuthErrorKey, string> = {
  'erro.credenciais_invalidas': 'email ou senha inválidos',
  'erro.sem_conexao': 'sem conexão — verifique a internet e tente de novo',
  'erro.muitas_tentativas': 'muitas tentativas seguidas — espere um pouco',
  'erro.desconhecido': 'não foi possível entrar — tente de novo',
}

export function LoginScreen(): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<AuthErrorKey | null>(null)

  const podeEnviar = email.trim().length > 0 && senha.length > 0 && !enviando

  const entrar = async (): Promise<void> => {
    if (!podeEnviar) return
    setErro(null)
    setEnviando(true)
    const resultado = await signIn(email, senha)
    if (!resultado.ok) {
      // Só o código do SDK vai ao log — nunca o email nem a senha.
      log(`login-error code=${resultado.code}`)
      setErro(resultado.messageKey)
      setEnviando(false)
      return
    }
    // O sucesso vira `auth uid=… src=login` no App, via onAuthStateChanged.
    setSenha('')
    setEnviando(false)
  }

  return (
    <KeyboardAvoidingView
      style={styles.tela}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
        <View style={styles.marca}>
          <Image
            source={require('../../assets/logo-octavia-dark.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Octavia"
          />
        </View>

        <View style={styles.formulario}>
          <Text style={styles.titulo}>ENTRAR</Text>

          <View style={styles.campos}>
            <View style={styles.campo}>
              <Icone nome="email" tamanho={20} cor={dark.lineInfo} />
              <TextInput
                style={styles.entrada}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                placeholder="voce@exemplo.com.br"
                placeholderTextColor={dark.muted}
                editable={!enviando}
                accessibilityLabel="Email"
                testID="email"
              />
            </View>

            {/* A moldura pinta a borda da senha em errorInk sempre que o
                formulário falha — inclusive no erro genérico, que é o que ela
                desenha. É o campo do segredo que leva a marca, não o
                diagnóstico da causa: a causa está no texto abaixo. */}
            <View style={[styles.campo, erro !== null && styles.campoComErro]}>
              <Icone nome="senha" tamanho={20} cor={dark.lineInfo} />
              <TextInput
                style={styles.entrada}
                value={senha}
                onChangeText={setSenha}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="password"
                editable={!enviando}
                onSubmitEditing={() => void entrar()}
                returnKeyType="go"
                accessibilityLabel="Senha"
                testID="senha"
              />
            </View>

            {erro !== null ? (
              <View style={styles.erro}>
                <Icone nome="falha" tamanho={20} cor={dark.errorInk} />
                <Text style={styles.erroTexto} testID="erro">
                  {MENSAGEM[erro]}
                </Text>
              </View>
            ) : null}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.botao,
              !podeEnviar && styles.botaoInativo,
              pressed && podeEnviar && styles.botaoPressionado,
            ]}
            onPress={() => void entrar()}
            disabled={!podeEnviar}
            accessibilityRole="button"
            testID="entrar"
          >
            {enviando ? (
              <ActivityIndicator color={dark.bg} />
            ) : (
              <>
                <Icone nome="log-in" tamanho={24} cor={dark.bg} />
                <Text style={styles.botaoTexto}>Entrar</Text>
              </>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

/**
 * Medidas da moldura `S0`. Onde ela usa um número fora das escalas do
 * `theme.ts`, entra o degrau mais próximo — a regra da **errata E10**; a
 * tabela desta tela está no anexo da PR. Ficam como literal, declarados, os
 * que não têm degrau nem escala: a marca (340 × 219, que é o PNG de 952 × 614
 * à largura que a moldura pede), a coluna do formulário (420) e a folga entre
 * as duas (140 — a escala de `space` para em 48).
 *
 * Duas divergências em que a REGRA vence a moldura, pelo critério da E9/E12:
 * a altura do campo (a moldura desenha 52, empate entre `touch.min` e
 * `touch.list`, e a §5.2 nomeia este elemento por escrito — "`touch.list + 4`
 * = 60 (campo do login)") e o `falha` do erro a 20 e não aos 24 da §6.4, que
 * o dá ao banner do S1e e não nomeia o S0 (a §5.5 põe em 20 o "ícone dentro
 * de texto", que é o que ele é aqui).
 */
const COLUNA = 420
const MARCA = { largura: 340, altura: 219 }
/** A folga entre a marca e o formulário: 140 na moldura, sem degrau de `space`. */
const FOLGA_MARCA = 140

const styles = StyleSheet.create({
  tela: { flex: 1, backgroundColor: dark.bg },
  conteudo: {
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    // `alignContent` é o que centraliza as LINHAS quando há wrap (retrato):
    // sem ele o conteúdo encosta no topo.
    alignContent: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    // Separados: os 140 da moldura são a folga HORIZONTAL da paisagem; em
    // retrato, quando a coluna quebra, a folga vertical volta à escala.
    columnGap: FOLGA_MARCA,
    rowGap: space.xxl,
    padding: space.xxl,
  },
  marca: { flexShrink: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: MARCA.largura, height: MARCA.altura, maxWidth: '100%' },
  formulario: { width: COLUNA, maxWidth: '100%', gap: space.xxl },
  titulo: {
    color: dark.muted,
    fontFamily: font.display,
    fontSize: size.bodySmall,
    letterSpacing: size.bodySmall * tracking.displayWide,
    // O tracking sobra à direita da última letra; a moldura compensa à
    // esquerda para o bloco ficar alinhado com os campos.
    paddingLeft: space.xs,
    textTransform: 'uppercase',
  },
  campos: { gap: space.md },
  campo: {
    height: touch.list + 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderWidth: 1,
    borderColor: dark.line,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
  },
  campoComErro: { borderColor: dark.errorInk },
  entrada: {
    flex: 1,
    height: '100%',
    color: dark.text,
    fontFamily: font.ui,
    fontSize: size.bodySmall,
  },
  erro: { flexDirection: 'row', alignItems: 'flex-start', gap: space.md },
  erroTexto: {
    flex: 1,
    color: dark.errorInk,
    fontFamily: font.ui,
    fontSize: size.label,
    lineHeight: size.label * 1.45,
  },
  botao: {
    height: touch.list,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    borderRadius: radius.control,
    backgroundColor: dark.text,
  },
  // E3 — desabilitado é TINTA, nunca opacidade. `lineInfo` é o token do
  // elemento inativo (§3.3, regra 3), e é por estar inativo que ele é isento
  // dos 4,5:1 que o rótulo exigiria.
  botaoInativo: { backgroundColor: dark.lineInfo },
  botaoPressionado: { backgroundColor: dark.muted },
  botaoTexto: { color: dark.bg, fontFamily: font.uiBold, fontSize: size.button },
})
