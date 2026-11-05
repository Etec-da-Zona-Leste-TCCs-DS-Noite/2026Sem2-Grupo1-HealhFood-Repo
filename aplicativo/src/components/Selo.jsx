import { StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme';

const ESTILOS = {
  ok: { fundo: cores.verdeClaro, texto: cores.verdeEscuro, rotulo: 'Combina com seu perfil' },
  atencao: { fundo: cores.atencaoClaro, texto: cores.atencao, rotulo: 'Confira antes de consumir' },
  evitar: { fundo: cores.erroClaro, texto: cores.erro, rotulo: 'Contém item que você evita' },
};

// Mostra o resultado de avaliarProduto(). Não aparece se a pessoa não tem restrições.
export default function Selo({ avaliacao }) {
  if (!avaliacao || avaliacao.semPerfil) return null;
  const estilo = ESTILOS[avaliacao.nivel];

  return (
    <View style={[styles.selo, { backgroundColor: estilo.fundo }]}>
      <Text style={[styles.texto, { color: estilo.texto }]}>{estilo.rotulo}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  selo: { alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20 },
  texto: { fontSize: 12, fontWeight: '700' },
});
