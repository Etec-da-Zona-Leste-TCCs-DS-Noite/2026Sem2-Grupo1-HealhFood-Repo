import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { router, useLocalSearchParams } from 'expo-router';

import { Botao } from '../components/Botao';

export default function Inicio() {
  const params = useLocalSearchParams();

  let preferencias = {
    restricoes: [],
    ingredientesEvitados: [],
  };

  try {
    if (params.preferencias) {
      const valor = Array.isArray(params.preferencias)
        ? params.preferencias[0]
        : params.preferencias;

      preferencias = JSON.parse(valor);
    }
  } catch {
    // Mantém as preferências vazias se os parâmetros forem inválidos.
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <View style={styles.cabecalho}>
          <View>
            <Text style={styles.marca}>🥗 Health Food</Text>
            <Text style={styles.bemVindo}>Sua alimentação, suas escolhas.</Text>
          </View>

          <TouchableOpacity
            style={styles.perfil}
            onPress={() => router.push('/perfil')}
          >
            <Text style={styles.perfilTexto}>Perfil</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.destaque}>
          <Text style={styles.destaqueTitulo}>
            Olá! Vamos cuidar melhor da sua alimentação?
          </Text>

          <Text style={styles.destaqueTexto}>
            Explore opções e encontre alimentos que combinem
            com suas preferências.
          </Text>
        </View>

        <Text style={styles.tituloSecao}>
          O que você deseja fazer?
        </Text>

        <Botao
          titulo="Explorar alimentos"
          onPress={() => router.push('/alimentos')}
          estilo={styles.botao}
        />

        <Botao
          titulo="Meu carrinho"
          onPress={() => router.push('/carrinho')}
          estilo={styles.botao}
        />

        <Botao
          titulo="Minhas restrições"
          onPress={() => router.push('/questionario')}
          estilo={styles.botaoSecundario}
          estiloTexto={styles.textoSecundario}
        />

        {preferencias.restricoes.length > 0 && (
          <View style={styles.resumo}>
            <Text style={styles.resumoTitulo}>
              Preferências desta visita
            </Text>

            <Text style={styles.resumoTexto}>
              {preferencias.restricoes.join(', ')}
            </Text>
          </View>
        )}

        <Text style={styles.aviso}>
          Sempre confira a composição e a rotulagem dos alimentos
          antes do consumo.
        </Text>
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
    paddingBottom: 35,
  },

  cabecalho: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 25,
  },

  marca: {
    fontSize: 23,
    fontWeight: 'bold',
    color: '#367A4C',
  },

  bemVindo: {
    color: '#667568',
    marginTop: 5,
  },

  perfil: {
    backgroundColor: '#E3EFE5',
    padding: 12,
    borderRadius: 10,
  },

  perfilTexto: {
    color: '#244B32',
    fontWeight: 'bold',
  },

  destaque: {
    backgroundColor: '#367A4C',
    borderRadius: 18,
    padding: 22,
    marginBottom: 25,
  },

  destaqueTitulo: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 31,
  },

  destaqueTexto: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    marginTop: 12,
  },

  tituloSecao: {
    color: '#244B32',
    fontSize: 21,
    fontWeight: 'bold',
    marginBottom: 15,
  },

  botao: {
    marginBottom: 12,
  },

  botaoSecundario: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#367A4C',
  },

  textoSecundario: {
    color: '#367A4C',
  },

  resumo: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 25,
  },

  resumoTitulo: {
    color: '#244B32',
    fontWeight: 'bold',
    marginBottom: 8,
  },

  resumoTexto: {
    color: '#667568',
    lineHeight: 21,
  },

  aviso: {
    fontSize: 12,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 25,
  },
});