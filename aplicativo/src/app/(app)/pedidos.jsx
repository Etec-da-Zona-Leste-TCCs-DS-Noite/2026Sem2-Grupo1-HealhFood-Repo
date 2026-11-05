import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Tela from '../../components/Tela';
import { useApp } from '../../context/AppContext';
import { listarPedidos } from '../../services/pedidosService';
import { BORDAS_ABAS, cores } from '../../theme';
import { formatarData, formatarPreco } from '../../utils/formatar';

// Mesmos status do painel administrativo.
const COR_STATUS = {
  Pendente: { fundo: cores.atencaoClaro, texto: cores.atencao },
  'Em preparo': { fundo: cores.atencaoClaro, texto: cores.atencao },
  Concluído: { fundo: cores.verdeClaro, texto: cores.verdeEscuro },
  Cancelado: { fundo: cores.erroClaro, texto: cores.erro },
};

export default function Pedidos() {
  const { usuario } = useApp();
  const [pedidos, setPedidos] = useState(null);

  useFocusEffect(
    useCallback(() => {
      listarPedidos(usuario.id).then(setPedidos).catch(() => setPedidos([]));
    }, [usuario.id])
  );

  return (
    <Tela bordas={BORDAS_ABAS}>
      <Text style={styles.titulo}>Meus pedidos</Text>

      {pedidos === null ? (
        <Text style={styles.vazio}>Carregando pedidos...</Text>
      ) : pedidos.length === 0 ? (
        <Text style={styles.vazio}>Você ainda não fez nenhum pedido.</Text>
      ) : (
        pedidos.map((pedido) => {
          const cor = COR_STATUS[pedido.status] ?? COR_STATUS.Pendente;
          return (
            <View key={pedido.id} style={styles.card}>
              <View style={styles.topo}>
                <Text style={styles.restaurante}>{pedido.restaurante}</Text>
                <Text style={[styles.status, { backgroundColor: cor.fundo, color: cor.texto }]}>
                  {pedido.status}
                </Text>
              </View>
              <Text style={styles.data}>{formatarData(pedido.criadoEm)}</Text>
              {pedido.itens.map((item) => (
                <Text key={item.produtoId} style={styles.item}>
                  {item.quantidade}x {item.nome}
                </Text>
              ))}
              <Text style={styles.valor}>{formatarPreco(pedido.valor)}</Text>
            </View>
          );
        })
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { color: cores.texto, fontSize: 28, fontWeight: '800', marginBottom: 16 },
  vazio: { color: cores.textoSuave, textAlign: 'center', marginTop: 32 },
  card: { backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda, borderRadius: 16, padding: 16, marginBottom: 12, gap: 4 },
  topo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  restaurante: { flex: 1, color: cores.texto, fontSize: 17, fontWeight: '700' },
  status: { fontSize: 12, fontWeight: '700', paddingVertical: 4, paddingHorizontal: 10, borderRadius: 20, overflow: 'hidden' },
  data: { color: cores.textoSuave, fontSize: 12, marginBottom: 6 },
  item: { color: cores.texto, fontSize: 14 },
  valor: { color: cores.verde, fontSize: 18, fontWeight: '800', marginTop: 8 },
});
