import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme';

export default function Carregando({ texto = 'Carregando...' }) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={cores.verde} />
      <Text style={styles.texto}>{texto}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: cores.fundo },
  texto: { marginTop: 12, color: cores.textoSuave },
});
