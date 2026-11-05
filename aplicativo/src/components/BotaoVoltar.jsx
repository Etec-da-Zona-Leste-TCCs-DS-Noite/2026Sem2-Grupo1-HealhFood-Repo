import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { cores } from '../theme';

// Volta para a tela anterior; se não houver, vai para o destino indicado.
export default function BotaoVoltar({ destino = '/' }) {
  function voltar() {
    if (router.canGoBack()) router.back();
    else router.replace(destino);
  }

  return (
    <Pressable onPress={voltar} style={styles.botao} accessibilityRole="button">
      <Text style={styles.texto}>‹ Voltar</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  botao: { alignSelf: 'flex-start', paddingVertical: 8, marginBottom: 8 },
  texto: { color: cores.verde, fontSize: 16, fontWeight: '700' },
});
