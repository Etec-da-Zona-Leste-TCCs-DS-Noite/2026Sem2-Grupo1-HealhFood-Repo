import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cores } from '../theme';
import { formatarPreco } from '../utils/formatar';
import Botao from './Botao';
import Selo from './Selo';

export default function CardProduto({ produto, avaliacao, onAbrir, onAdicionar }) {
  return (
    <View style={styles.card}>
      <Pressable onPress={onAbrir} accessibilityRole="button">
        <Text style={styles.meta}>
          {produto.categoria} - {produto.restaurante}
        </Text>
        <Text style={styles.nome}>{produto.nome}</Text>
        <Text style={styles.descricao}>{produto.descricao}</Text>
        <Selo avaliacao={avaliacao} />
      </Pressable>

      <View style={styles.rodape}>
        <Text style={styles.preco}>{formatarPreco(produto.preco)}</Text>
        {onAdicionar ? (
          <Botao titulo="Adicionar" onPress={onAdicionar} estilo={styles.botao} />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: cores.cartao,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cores.borda,
    padding: 16,
    marginBottom: 12,
    gap: 8,
  },
  meta: { color: cores.textoSuave, fontSize: 12, marginBottom: 4 },
  nome: { color: cores.texto, fontSize: 18, fontWeight: '700' },
  descricao: { color: cores.textoSuave, fontSize: 14, lineHeight: 20, marginVertical: 6 },
  rodape: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  preco: { color: cores.verde, fontSize: 18, fontWeight: '800' },
  botao: { minHeight: 42, paddingHorizontal: 18 },
});
