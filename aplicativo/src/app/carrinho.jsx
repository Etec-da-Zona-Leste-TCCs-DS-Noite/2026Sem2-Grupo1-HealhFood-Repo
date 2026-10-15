import { useCallback, useState } from 'react';

import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { router, useFocusEffect } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_CARRINHO = '@healthfood:carrinho';

export default function Carrinho() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);

  const carregarCarrinho = useCallback(async () => {
    try {
      setCarregando(true);

      const salvo = await AsyncStorage.getItem(CHAVE_CARRINHO);

      setItens(salvo ? JSON.parse(salvo) : []);
    } catch {
      Alert.alert('Erro', 'Não foi possível carregar o carrinho.');
      setItens([]);
    } finally {
      setCarregando(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      carregarCarrinho();
    }, [carregarCarrinho])
  );

  async function salvarCarrinho(novosItens) {
    try {
      await AsyncStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(novosItens)
      );

      setItens(novosItens);
    } catch {
      Alert.alert('Erro', 'Não foi possível atualizar o carrinho.');
    }
  }

  function alterarQuantidade(id, variacao) {
    const atualizados = itens
      .map((item) => {
        if (item.id !== id) {
          return item;
        }

        return {
          ...item,
          quantidade: item.quantidade + variacao,
        };
      })
      .filter((item) => item.quantidade > 0);

    salvarCarrinho(atualizados);
  }

  function removerItem(id) {
    const atualizados = itens.filter((item) => item.id !== id);
    salvarCarrinho(atualizados);
  }

  const total = itens.reduce(
    (soma, item) => soma + item.preco * item.quantidade,
    0
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>
          Meu carrinho
        </Text>

        {carregando ? (
          <Text style={styles.mensagem}>
            Carregando carrinho...
          </Text>
        ) : itens.length === 0 ? (
          <View style={styles.vazio}>
            <Text style={styles.emoji}>🛒</Text>

            <Text style={styles.vazioTitulo}>
              Seu carrinho está vazio.
            </Text>

            <Text style={styles.mensagem}>
              Explore os alimentos e adicione os produtos desejados.
            </Text>

            <TouchableOpacity
              style={styles.botao}
              onPress={() => router.push('/alimentos')}
            >
              <Text style={styles.botaoTexto}>
                Explorar alimentos
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {itens.map((item) => (
              <View key={item.id} style={styles.card}>
                <Text style={styles.nome}>
                  {item.nome}
                </Text>

                <Text style={styles.preco}>
                  R$ {item.preco.toFixed(2).replace('.', ',')}
                </Text>

                <View style={styles.linha}>
                  <TouchableOpacity
                    style={styles.quantidadeBotao}
                    onPress={() => alterarQuantidade(item.id, -1)}
                  >
                    <Text style={styles.quantidadeTexto}>−</Text>
                  </TouchableOpacity>

                  <Text style={styles.quantidade}>
                    {item.quantidade}
                  </Text>

                  <TouchableOpacity
                    style={styles.quantidadeBotao}
                    onPress={() => alterarQuantidade(item.id, 1)}
                  >
                    <Text style={styles.quantidadeTexto}>+</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.remover}
                    onPress={() => removerItem(item.id)}
                  >
                    <Text style={styles.removerTexto}>
                      Remover
                    </Text>
                  </TouchableOpacity>
                </View>

                <Text style={styles.subtotal}>
                  Subtotal: R${' '}
                  {(item.preco * item.quantidade)
                    .toFixed(2)
                    .replace('.', ',')}
                </Text>
              </View>
            ))}

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>
                Total demonstrativo
              </Text>

              <Text style={styles.total}>
                R$ {total.toFixed(2).replace('.', ',')}
              </Text>
            </View>

            <Text style={styles.aviso}>
              Este carrinho é demonstrativo. Nenhum pedido ou pagamento
              será realizado.
            </Text>
          </>
        )}

        <TouchableOpacity
          style={styles.voltar}
          onPress={() => router.replace('/inicio')}
        >
          <Text style={styles.voltarTexto}>
            Voltar ao início
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5EF',
  },

  conteudo: {
    padding: 22,
    paddingBottom: 40,
  },

  titulo: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#244B32',
    marginBottom: 22,
  },

  vazio: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 25,
    alignItems: 'center',
  },

  emoji: {
    fontSize: 48,
  },

  vazioTitulo: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#244B32',
    marginTop: 15,
    textAlign: 'center',
  },

  mensagem: {
    color: '#667568',
    marginTop: 12,
    lineHeight: 21,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 17,
    marginBottom: 13,
  },

  nome: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#244B32',
  },

  preco: {
    color: '#367A4C',
    fontSize: 16,
    marginTop: 7,
  },

  linha: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
  },

  quantidadeBotao: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: '#E3EFE5',
    alignItems: 'center',
    justifyContent: 'center',
  },

  quantidadeTexto: {
    fontSize: 22,
    color: '#244B32',
    fontWeight: 'bold',
  },

  quantidade: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 14,
    color: '#244B32',
  },

  remover: {
    marginLeft: 'auto',
    padding: 8,
  },

  removerTexto: {
    color: '#A33A3A',
    fontWeight: 'bold',
  },

  subtotal: {
    color: '#555555',
    marginTop: 13,
  },

  totalCard: {
    backgroundColor: '#E3EFE5',
    borderRadius: 14,
    padding: 18,
    marginTop: 8,
  },

  totalLabel: {
    color: '#244B32',
    fontSize: 14,
  },

  total: {
    color: '#244B32',
    fontSize: 25,
    fontWeight: 'bold',
    marginTop: 7,
  },

  aviso: {
    color: '#777777',
    fontSize: 12,
    lineHeight: 18,
    marginTop: 15,
  },

  botao: {
    backgroundColor: '#367A4C',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  voltar: {
    padding: 16,
    alignItems: 'center',
    marginTop: 12,
  },

  voltarTexto: {
    color: '#367A4C',
    fontWeight: 'bold',
  },
});