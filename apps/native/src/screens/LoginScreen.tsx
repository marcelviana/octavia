/**
 * S0 — Entrar (PRD T1-R6 e T1-R36; aceites A1 e A20).
 * Layout do design congelado: logo na metade esquerda (recorte que exclui a
 * tagline — D-2 do Marcel), coluna de 400 dp à direita com rótulo "ENTRAR",
 * email, senha, botão e o erro em pt-BR **abaixo** do formulário.
 *
 * Só email/senha (H18): sem Google, sem "criar conta" (o cadastro é do web,
 * PRD §13), sem "esqueci a senha". Nenhuma chamada a `/api/*` acontece aqui.
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
            source={require('../../assets/logo-octavia.png')}
            style={styles.logo}
            resizeMode="contain"
            accessibilityLabel="Octavia"
          />
        </View>

        <View style={styles.formulario}>
          <Text style={styles.titulo}>ENTRAR</Text>

          <Text style={styles.rotulo}>Email</Text>
          <TextInput
            style={styles.campo}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
            placeholder="voce@exemplo.com.br"
            placeholderTextColor={dark.muted}
            editable={!enviando}
            testID="email"
          />

          <Text style={styles.rotulo}>Senha</Text>
          <TextInput
            style={styles.campo}
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="password"
            editable={!enviando}
            onSubmitEditing={() => void entrar()}
            returnKeyType="go"
            testID="senha"
          />

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
              <Text style={styles.botaoTexto}>Entrar</Text>
            )}
          </Pressable>

          {erro !== null ? (
            <Text style={styles.erro} testID="erro">
              {MENSAGEM[erro]}
            </Text>
          ) : null}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const COLUNA = 400

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
    gap: space.xxxl,
    padding: space.xxl,
  },
  marca: { flexShrink: 1, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 600, height: 240, maxWidth: '100%' },
  formulario: { width: COLUNA, maxWidth: '100%', gap: space.sm },
  titulo: {
    color: dark.muted,
    fontFamily: font.ui,
    fontSize: size.label,
    letterSpacing: size.label * tracking.label,
    textTransform: 'uppercase',
    marginBottom: space.md,
  },
  rotulo: { color: dark.muted, fontFamily: font.ui, fontSize: size.label, marginTop: space.sm },
  campo: {
    height: touch.list + 4,
    borderWidth: 1,
    borderColor: dark.line,
    borderRadius: radius.control,
    paddingHorizontal: space.lg,
    color: dark.text,
    fontFamily: font.ui,
    fontSize: size.input,
  },
  botao: {
    height: touch.list,
    marginTop: space.lg,
    borderRadius: radius.control,
    backgroundColor: dark.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botaoInativo: { opacity: 0.4 },
  botaoPressionado: { opacity: 0.85 },
  botaoTexto: { color: dark.bg, fontFamily: font.uiBold, fontSize: size.button },
  erro: { color: dark.error, fontFamily: font.ui, fontSize: size.bodySmall, marginTop: space.lg },
})
