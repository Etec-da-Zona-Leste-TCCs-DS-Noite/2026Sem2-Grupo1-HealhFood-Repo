import { StyleSheet, Text, TextInput, View } from 'react-native';

import { cores } from '../theme';

// Campo de texto com rótulo e mensagem de erro opcional.
export default function Campo({ rotulo, erro, ...props }) {
  return (
    <View style={styles.grupo}>
      <Text style={styles.rotulo}>{rotulo}</Text>
      <TextInput
        placeholderTextColor="#89958D"
        style={[styles.input, erro ? styles.inputErro : null]}
        {...props}
      />
      {erro ? <Text style={styles.erro}>{erro}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grupo: { marginBottom: 14 },
  rotulo: { color: cores.texto, fontWeight: '600', marginBottom: 6 },
  input: {
    minHeight: 52,
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: cores.texto,
  },
  inputErro: { borderColor: cores.erro },
  erro: { color: cores.erro, fontSize: 12, marginTop: 5 },
});
