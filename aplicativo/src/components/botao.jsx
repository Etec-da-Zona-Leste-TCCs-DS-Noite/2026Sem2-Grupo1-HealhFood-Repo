import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { cores } from '../theme';

// variante: 'primario' (padrão), 'secundario' ou 'perigo'
export default function Botao({
  titulo,
  onPress,
  carregando = false,
  desabilitado = false,
  variante = 'primario',
  estilo,
}) {
  const inativo = desabilitado || carregando;
  const secundario = variante === 'secundario';
  const perigo = variante === 'perigo';

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={inativo}
      style={({ pressed }) => [
        styles.base,
        secundario && styles.secundario,
        perigo && styles.perigo,
        inativo && styles.inativo,
        pressed && styles.pressionado,
        estilo,
      ]}
    >
      {carregando ? (
        <ActivityIndicator color={secundario || perigo ? cores.verde : '#FFFFFF'} />
      ) : (
        <Text
          style={[
            styles.texto,
            secundario && styles.textoSecundario,
            perigo && styles.textoPerigo,
          ]}
        >
          {titulo}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 52,
    borderRadius: 14,
    backgroundColor: cores.verde,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  secundario: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.verde,
  },
  perigo: {
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.erro,
  },
  inativo: { opacity: 0.55 },
  pressionado: { opacity: 0.85 },
  texto: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  textoSecundario: { color: cores.verde },
  textoPerigo: { color: cores.erro },
});
