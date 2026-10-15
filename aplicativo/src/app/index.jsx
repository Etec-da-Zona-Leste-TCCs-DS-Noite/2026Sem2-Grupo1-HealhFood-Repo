import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';

import { router } from 'expo-router';

import { Botao } from '../components/Botao';

export default function Index() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.conteudo}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.icone}>🥗</Text>

          <Text style={styles.logo}>
            Health Food
          </Text>

          <Text style={styles.subtitulo}>
            Alimentação personalizada para você
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.titulo}>
            Sua alimentação começa aqui.
          </Text>

          <Text style={styles.descricao}>
            Descubra opções alimentares considerando
            suas restrições e preferências.
          </Text>

          <Botao
            titulo="Criar minha conta"
            onPress={() => router.push('/cadastro')}
            estilo={styles.botao}
          />

          <Botao
            titulo="Já tenho uma conta"
            onPress={() => router.push('/login')}
            estilo={styles.botaoSecundario}
            estiloTexto={styles.textoSecundario}
          />

          <Text style={styles.aviso}>
            O Health Food auxilia na escolha de alimentos,
            mas não substitui orientações médicas ou
            nutricionais.
          </Text>
        </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 35,
  },

  icone: {
    fontSize: 65,
    marginBottom: 8,
  },

  logo: {
    fontSize: 34,
    fontWeight: 'bold',
    color: '#367A4C',
  },

  subtitulo: {
    fontSize: 14,
    color: '#667568',
    marginTop: 8,
    textAlign: 'center',
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 24,
    borderRadius: 20,
    elevation: 3,
  },

  titulo: {
    fontSize: 25,
    fontWeight: 'bold',
    color: '#244B32',
    marginBottom: 14,
    textAlign: 'center',
  },

  descricao: {
    fontSize: 15,
    color: '#626B63',
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 25,
  },

  botao: {
    marginBottom: 12,
  },

  botaoSecundario: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#367A4C',
    marginBottom: 10,
  },

  textoSecundario: {
    color: '#367A4C',
  },

  aviso: {
    fontSize: 11,
    color: '#777777',
    lineHeight: 16,
    textAlign: 'center',
    marginTop: 15,
  },
});