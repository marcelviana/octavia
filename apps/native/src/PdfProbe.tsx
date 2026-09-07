/**
 * Prova de T1-R26 (N0-PR5): PDF renderizado do disco; se o arquivo não está no cache e não há rede,
 * placeholder "arquivo não baixado" com ação "baixar" — nunca tela branca em silêncio.
 */
import { useCallback, useEffect, useState } from 'react'
import { Button, StyleSheet, Text, View, useWindowDimensions } from 'react-native'
import Pdf from 'react-native-pdf'
import { ensureFile, fileNameFromUrl } from './files'
import { log } from './log'

interface Props {
  url: string
  label: string
  onClose: () => void
}

type State = { kind: 'loading' } | { kind: 'ready'; uri: string } | { kind: 'placeholder'; error: string | null }

export function PdfProbe({ url, label, onClose }: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' })
  const { width } = useWindowDimensions()
  const name = fileNameFromUrl(url)

  const load = useCallback(async () => {
    setState({ kind: 'loading' })
    try {
      const f = await ensureFile(url)
      setState({ kind: 'ready', uri: f.uri })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      log(`pdf-placeholder name=${name}`)
      log(`download-error ${msg}`)
      setState({ kind: 'placeholder', error: msg })
    }
  }, [url, name])

  useEffect(() => {
    void load()
  }, [load])

  if (state.kind === 'loading') return <View style={styles.center}><Text>Carregando {label}…</Text></View>

  if (state.kind === 'placeholder') {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Arquivo não baixado</Text>
        <Text>{label}</Text>
        {state.error ? <Text style={styles.error}>Sem rede: {state.error}</Text> : null}
        <Button title="Baixar" onPress={() => void load()} />
        <Button title="Voltar" onPress={onClose} />
      </View>
    )
  }

  return (
    <View style={styles.full}>
      <Pdf
        source={{ uri: state.uri, cache: false }}
        style={[styles.pdf, { width }]}
        onLoadComplete={(pages) => log(`pdf-render pages=${pages} src=disk`)}
        onPageChanged={(page, pages) => log(`pdf-page n=${page}/${pages}`)}
        onError={(error) => log(`pdf-error ${error instanceof Error ? error.message : String(error)}`)}
      />
      <View style={styles.bar}>
        <Button title="Voltar" onPress={onClose} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  full: { flex: 1, backgroundColor: '#fff' },
  pdf: { flex: 1, backgroundColor: '#eee' },
  bar: { padding: 12, paddingBottom: 72 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 22 },
  error: { color: '#b00020' },
})
