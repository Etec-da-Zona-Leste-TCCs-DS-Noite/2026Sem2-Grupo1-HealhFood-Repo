import { useState } from 'react';

import {
  View,
  Text,
  TextInput,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';

import { router } from 'expo-router';

import { supabase } from './lib/supabase';

import { Botao } from '../components/Botao';

export default function Cadastro() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function cadastrar() {
    if (!nome.trim() || !email.trim() || !senha) {
      Alert.alert('Atenção', 'Preencha todos os campos.');
      return;
    }

    if (senha.length < 6) {
      Alert.alert(
        'Senha inválida',
        'Use pelo menos seis caracteres.'
      );
      return;
    }

    if (senha !== confirmacao) {
      Alert.alert('Atenção', 'As senhas não coincidem.');
      return;
    }

    try {
      setCarregando(true);

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: senha,
        options: {
          data: {
            nome: nome.trim(),
          },
        },
      });

      if (error) throw error;

      if (data.session) {
        router.replace('/questionario');
      } else {
        Alert.alert(
          'Cadastro realizado',
          'Confira seu e-mail para confirmar a conta.',
          [
            {
              text: 'Ir para o login',
              onPress: () => router.replace('/login'),
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Erro no cadastro',
        error.message || 'Não foi possível cadastrar.'
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.conteudo}>
        <Text style={styles.icone}>🥗</Text>

        <Text style={styles.titulo}>Criar conta</Text>

        <View style={styles.card}>
          <Text style={styles.label}>Nome completo</Text>

          <TextInput
            style={styles.input}
            value={nome}
            onChangeText={setNome}
            placeholder="Digite seu nome"
          />

          <Text style={styles.label}>E-mail</Text>

          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="seuemail@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Senha</Text>

          <TextInput
            style={styles.input}
            value={senha}
            onChangeText={setSenha}
            placeholder="Crie uma senha"
            secureTextEntry
          />

          <Text style={styles.label}>Confirmar senha</Text>

          <TextInput
            style={styles.input}
            value={confirmacao}
            onChangeText={setConfirmacao}
            placeholder="Repita a senha"
            secureTextEntry
          />

          <Botao
            titulo="Criar conta"
            onPress={cadastrar}
            carregando={carregando}
            desabilitado={carregando}
            estilo={styles.botao}
          />

          <Botao
            titulo="Já tenho uma conta"
            onPress={() => router.replace('/login')}
            estilo={styles.secundario}
            estiloTexto={styles.textoSecundario}
          />
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

  icone: {
    fontSize: 50,
    textAlign: 'center',
  },

  titulo: {
    fontSize: 29,
    fontWeight: 'bold',
    color: '#244B32',
    textAlign: 'center',
    marginVertical: 20,
  },

  card: {
    backgroundColor: '#FFFFFF',
    padding: 22,
    borderRadius: 18,
  },

  label: {
    color: '#244B32',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 7,
  },

  input: {
    backgroundColor: '#F7F5EF',
    borderWidth: 1,
    borderColor: '#E0E5DE',
    borderRadius: 10,
    padding: 14,
  },

  botao: {
    marginTop: 24,
  },

  secundario: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#367A4C',
    marginTop: 12,
  },

  textoSecundario: {
    color: '#367A4C',
  },
});