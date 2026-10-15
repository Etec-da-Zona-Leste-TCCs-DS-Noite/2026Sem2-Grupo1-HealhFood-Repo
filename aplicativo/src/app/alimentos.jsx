import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { router } from 'expo-router';

import AsyncStorage from '@react-native-async-storage/async-storage';

const CHAVE_CARRINHO = '@healthfood:carrinho';

const alimentos = [
  {
    id: '1',
    nome: 'Granola demonstrativa',
    descricao: 'Produto de exemplo para testar o catálogo.',
    preco: 18.90,
  },
  {
    id: '2',
    nome: 'Biscoito demonstrativo',
    descricao: 'Produto de exemplo para testar o catálogo.',
    preco: 9.50,
  },
  {
    id: '3',
    nome: 'Bebida vegetal demonstrativa',
    descricao: 'Produto de exemplo para testar o catálogo.',
    preco: 12.90,
  },
];

export default function Alimentos() {
  async function adicionarAoCarrinho(alimento) {
    try {
      const salvo = await AsyncStorage.getItem(CHAVE_CARRINHO);

      const carrinho = salvo ? JSON.parse(salvo) : [];

      const existente = carrinho.find(
        (item) => item.id === alimento.id
      );

      let atualizado;

      if (existente) {
        atualizado = carrinho.map((item) =>
          item.id === alimento.id
            ? { ...item, quantidade: item.quantidade + 1 }
            : item
        );
      } else {
        atualizado = [
          ...carrinho,
          { ...alimento, quantidade: 1 },
        ];
      }

      await AsyncStorage.setItem(
        CHAVE_CARRINHO,
        JSON.stringify(atualizado)
      );

      Alert.alert(
        'Adicionado',
        `${alimento.nome} foi adicionado ao carrinho.`
      );
    } catch {
      Alert.alert(
        'Erro',
        'Não foi possível adicionar o produto ao carrinho.'
      );
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.titulo}>
          Alimentos
        </Text>

        <Text style={styles.descricao}>
          Catálogo demonstrativo do Health Food.
        </Text>

        <View style={styles.aviso}>
          <Text style={styles.avisoTexto}>
            Produtos e preços fictícios. Antes de disponibilizar
            alimentos reais, será necessário cadastrar ingredientes,
            alérgenos e informações verificadas.
          </Text>
        </View>

        {alimentos.map((alimento) => (
          <View key={alimento.id} style={styles.card}>
            <Text style={styles.emoji}>🥗</Text>

            <Text style={styles.nome}>
              {alimento.nome}
            </Text>

            <Text style={styles.texto}>
              {alimento.descricao}
            </Text>

            <Text style={styles.preco}>
              R$ {alimento.preco.toFixed(2).replace('.', ',')}
            </Text>

            <TouchableOpacity
              style={styles.botao}
              onPress={() => adicionarAoCarrinho(alimento)}
            >
              <Text style={styles.botaoTexto}>
                Adicionar ao carrinho
              </Text>
            </TouchableOpacity>
          </View>
        ))}

        <TouchableOpacity
          style={styles.botaoCarrinho}
          onPress={() => router.push('/carrinho')}
        >
          <Text style={styles.botaoTexto}>
            Ver carrinho
          </Text>
        </TouchableOpacity>

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
  },

  descricao: {
    color: '#667568',
    marginTop: 8,
    marginBottom: 20,
  },

  aviso: {
    backgroundColor: '#FFF4D8',
    borderRadius: 10,
    padding: 14,
    marginBottom: 20,
  },

  avisoTexto: {
    color: '#66501D',
    lineHeight: 20,
    fontSize: 13,
  },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
  },

  emoji: {
    fontSize: 36,
  },

  nome: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#244B32',
    marginTop: 8,
  },

  texto: {
    color: '#667568',
    marginTop: 7,
    lineHeight: 20,
  },

  preco: {
    fontSize: 19,
    fontWeight: 'bold',
    color: '#367A4C',
    marginTop: 12,
  },

  botao: {
    backgroundColor: '#367A4C',
    borderRadius: 10,
    padding: 14,
    marginTop: 15,
    alignItems: 'center',
  },

  botaoCarrinho: {
    backgroundColor: '#244B32',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginTop: 5,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },

  voltar: {
    padding: 15,
    alignItems: 'center',
  },

  voltarTexto: {
    color: '#367A4C',
    fontWeight: 'bold',
  },
});