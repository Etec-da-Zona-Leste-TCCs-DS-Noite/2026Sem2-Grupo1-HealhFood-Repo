import { useEffect, useState } from 'react';

import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from '../lib/supabase';

import Botao from '../components/Botao';

export default function Perfil() {
  const [usuario, setUsuario] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregarPerfil() {
      try {
        const { data, error } = await supabase.auth.getUser();

        if (error) {
          throw error;
        }

        setUsuario(data.user);
      } catch {
        Alert.alert(
          'Sessão indisponível',
          'Entre novamente para acessar seu perfil.'
        );
      } finally {
        setCarregando(false);
      }
    }

    carregarPerfil();
  }, []);

  async function sair() {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      router.replace('/');
    } catch (error) {
      Alert.alert(
        'Erro',
        error.message || 'Não foi possível sair da conta.'
      );
    }
  }

  if (carregando) {
    return (
      <View style={styles.carregando}>
        <ActivityIndicator size="large" color="#367A4C" />
        <Text style={styles.textoCarregando}>
          Carregando perfil...
        </Text>
      </View>
    );
  }

  const nome =
    usuario?.user_metadata?.nome || 'Usuário do Health Food';

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.conteudo}>
        <Text style={styles.icone}>👤</Text>

        <Text style={styles.titulo}>
          Meu perfil
        </Text>

        <View style={styles.card}>
          <Text style={styles.rotulo}>Nome</Text>
          <Text style={styles.valor}>{nome}</Text>

          <Text style={styles.rotulo}>E-mail</Text>
          <Text style={styles.valor}>
            {usuario?.email || 'Não informado'}
          </Text>

          <Text style={styles.rotulo}>Restrições alimentares</Text>
          <Text style={styles.valor}>
            As preferências serão carregadas do banco na próxima etapa.
          </Text>
        </View>

        <Botao
          titulo="Voltar ao início"
          onPress={() => router.replace('/inicio')}
          estilo={styles.botao}
        />

        <Botao
          titulo="Sair da conta"
          onPress={sair}
          estilo={styles.sair}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F5EF',
  },

  conteudo: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },

  carregando: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7F5EF',
  },

  textoCarregando: {
    marginTop: 12,
    color: '#667568',
  },

  icone: {
    fontSize: 55,
    textAlign: 'center',
  },

  titulo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#244B32',
    textAlign: 'center',
    marginVertical: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 16,
  },

  rotulo: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#367A4C',
    marginTop: 12,
  },

  valor: {
    color: '#333333',
    fontSize: 16,
    marginTop: 5,
    lineHeight: 23,
  },

  botao: {
    marginTop: 25,
  },

  sair: {
    backgroundColor: '#8D3737',
    marginTop: 12,
  },
});