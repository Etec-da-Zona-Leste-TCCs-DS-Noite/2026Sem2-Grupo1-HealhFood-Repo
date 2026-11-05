import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Botao from '../../components/Botao';
import Tela from '../../components/Tela';
import { useApp } from '../../context/AppContext';
import { BORDAS_ABAS, cores } from '../../theme';
import { avisar, confirmar } from '../../utils/dialogo';
import { formatarPreco } from '../../utils/formatar';
import { avaliarProduto } from '../../utils/restricoes';

export default function Carrinho() {
  const { carrinho, perfil, alterarQuantidade, removerDoCarrinho, finalizarPedido } = useApp();
  const [enviando, setEnviando] = useState(false);

  const total = carrinho.reduce((soma, item) => soma + item.preco * item.quantidade, 0);
  const comAlerta = carrinho.filter((item) => avaliarProduto(item, perfil).nivel === 'evitar');

  async function finalizar() {
    const aviso =
      comAlerta.length > 0
        ? `\n\nAtenção: ${comAlerta.map((item) => item.nome).join(', ')} contém ingrediente que você marcou para evitar.`
        : '';
    const continuar = await confirmar(
      'Finalizar pedido',
      `Total: ${formatarPreco(total)}. Será criado um pedido por restaurante.${aviso}`,
      'Finalizar'
    );
    if (!continuar) return;

    try {
      setEnviando(true);
      await finalizarPedido();
      avisar('Pedido registrado', 'Acompanhe o andamento na aba Pedidos.');
      router.push('/pedidos');
    } catch {
      avisar('Erro', 'Não foi possível finalizar o pedido.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Tela bordas={BORDAS_ABAS}>
      <Text style={styles.titulo}>Meu carrinho</Text>

      {carrinho.length === 0 ? (
        <View style={styles.vazio}>
          <Text style={styles.emoji}>🛒</Text>
          <Text style={styles.vazioTitulo}>Seu carrinho está vazio.</Text>
          <Text style={styles.vazioTexto}>Explore os alimentos e adicione os que você quiser.</Text>
          <Botao titulo="Explorar alimentos" onPress={() => router.push('/alimentos')} />
        </View>
      ) : (
        <>
          {comAlerta.length > 0 ? (
            <Text style={styles.alerta}>
              Há itens no carrinho que contêm ingredientes que você marcou para evitar.
            </Text>
          ) : null}

          {carrinho.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.nome}>{item.nome}</Text>
              <Text style={styles.meta}>{item.restaurante}</Text>
              <View style={styles.linha}>
                <View style={styles.quantidade}>
                  <Pressable style={styles.passo} onPress={() => alterarQuantidade(item.id, -1)}>
                    <Text style={styles.passoTexto}>−</Text>
                  </Pressable>
                  <Text style={styles.numero}>{item.quantidade}</Text>
                  <Pressable style={styles.passo} onPress={() => alterarQuantidade(item.id, 1)}>
                    <Text style={styles.passoTexto}>+</Text>
                  </Pressable>
                </View>
                <Text style={styles.subtotal}>{formatarPreco(item.preco * item.quantidade)}</Text>
              </View>
              <Pressable onPress={() => removerDoCarrinho(item.id)}>
                <Text style={styles.remover}>Remover</Text>
              </Pressable>
            </View>
          ))}

          <View style={styles.total}>
            <Text style={styles.totalRotulo}>Total</Text>
            <Text style={styles.totalValor}>{formatarPreco(total)}</Text>
          </View>

          <Text style={styles.aviso}>
            Nesta versão o pagamento ainda não está disponível: o pedido fica registrado com status
            Pendente.
          </Text>

          <Botao titulo="Finalizar pedido" onPress={finalizar} carregando={enviando} />
        </>
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { color: cores.texto, fontSize: 28, fontWeight: '800', marginBottom: 16 },
  vazio: { alignItems: 'center', gap: 8, paddingTop: 32 },
  emoji: { fontSize: 52 },
  vazioTitulo: { color: cores.texto, fontSize: 20, fontWeight: '800' },
  vazioTexto: { color: cores.textoSuave, textAlign: 'center', marginBottom: 12 },
  alerta: { color: cores.erro, backgroundColor: cores.erroClaro, borderRadius: 10, padding: 12, fontSize: 13, marginBottom: 12 },
  card: { backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda, borderRadius: 16, padding: 16, marginBottom: 12 },
  nome: { color: cores.texto, fontSize: 17, fontWeight: '700' },
  meta: { color: cores.textoSuave, fontSize: 12, marginTop: 2 },
  linha: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  quantidade: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  passo: { width: 36, height: 36, borderRadius: 10, backgroundColor: cores.verdeClaro, alignItems: 'center', justifyContent: 'center' },
  passoTexto: { color: cores.verde, fontSize: 20, fontWeight: '800' },
  numero: { color: cores.texto, fontSize: 16, fontWeight: '700', minWidth: 20, textAlign: 'center' },
  subtotal: { color: cores.verde, fontSize: 17, fontWeight: '800' },
  remover: { color: cores.erro, fontSize: 13, marginTop: 12 },
  total: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  totalRotulo: { color: cores.texto, fontSize: 18, fontWeight: '700' },
  totalValor: { color: cores.texto, fontSize: 22, fontWeight: '800' },
  aviso: { color: '#777777', fontSize: 12, lineHeight: 18, marginBottom: 16 },
});
