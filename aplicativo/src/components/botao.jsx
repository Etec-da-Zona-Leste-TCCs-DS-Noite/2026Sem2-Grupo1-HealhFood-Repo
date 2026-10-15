import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

export default function Botao({
  titulo,
  onPress,
  carregando = false,
  desabilitado = false,
  estilo,
  estiloTexto,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.botao,
        desabilitado && styles.desabilitado,
        estilo,
      ]}
      onPress={onPress}
      disabled={desabilitado || carregando}
      activeOpacity={0.8}
    >
      {carregando ? (
        <ActivityIndicator color="#FFFFFF" />
      ) : (
        <Text style={[styles.texto, estiloTexto]}>
          {titulo}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  botao: {
    backgroundColor: '#367A4C',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },

  desabilitado: {
    opacity: 0.6,
  },

  texto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});