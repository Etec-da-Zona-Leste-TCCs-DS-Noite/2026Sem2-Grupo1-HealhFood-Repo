import { router } from 'expo-router';
import { useState } from 'react';

import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');

  function entrar() {
    if (!email.trim() || !senha) {
      Alert.alert(
        'Campos obrigatórios',
        'Informe seu e-mail e sua senha.'
      );
      return;
    }

    // O login real será implementado com autenticação.
    // Não validamos credenciais contra um banco de dados ainda.

    Alert.alert(
      'Login ainda não disponível',
      'Estamos preparando o sistema de contas do Health Food. Por enquanto, você pode conhecer o questionário alimentar.',
      [
        {
          text: 'Continuar',
          onPress: () => router.push('/questionario'),
        },
        {
          text: 'Voltar',
          style: 'cancel',
        },
      ]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => router.back()}
        >
          <Text style={styles.voltarTexto}>‹ Voltar</Text>
        </TouchableOpacity>

        <View style={styles.logoContainer}>
          <Text style={styles.logo}>🌿</Text>

          <Text style={styles.nomeMarca}>Health Food</Text>
        </View>

        <Text style={styles.titulo}>Bem-vindo de volta!</Text>

        <Text style={styles.descricao}>
          Entre para continuar sua experiência no Health Food.
        </Text>

        <View style={styles.formulario}>
          <Text style={styles.rotulo}>E-mail</Text>

          <TextInput
            style={styles.input}
            placeholder="voce@exemplo.com"
            placeholderTextColor="#89958D"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            autoCorrect={false}
          />

          <Text style={styles.rotulo}>Senha</Text>

          <TextInput
            style={styles.input}
            placeholder="Digite sua senha"
            placeholderTextColor="#89958D"
            value={senha}
            onChangeText={setSenha}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="current-password"
            onSubmitEditing={entrar}
          />

          <TouchableOpacity
            style={styles.botao}
            activeOpacity={0.85}
            onPress={entrar}
          >
            <Text style={styles.botaoTexto}>Entrar</Text>
          </TouchableOpacity>

          <View style={styles.cadastroContainer}>
            <Text style={styles.cadastroTexto}>
              Ainda não tem conta?
            </Text>

            <TouchableOpacity
              onPress={() => router.push('/cadastro')}
            >
              <Text style={styles.cadastroLink}>
                Cadastre-se
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.rodape}>
          Health Food — alimentação que entende você.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAF7',
  },

  conteudo: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 35,
  },

  voltar: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    marginBottom: 20,
  },

  voltarTexto: {
    color: '#237A45',
    fontSize: 16,
    fontWeight: '700',
  },

  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },

  logo: {
    fontSize: 42,
  },

  nomeMarca: {
    color: '#175B35',
    fontSize: 23,
    fontWeight: '800',
    marginTop: 5,
  },

  titulo: {
    color: '#1C3023',
    fontSize: 29,
    fontWeight: '800',
  },

  descricao: {
    color: '#68776D',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    marginBottom: 30,
  },

  formulario: {
    gap: 10,
  },

  rotulo: {
    color: '#294333',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 8,
  },

  input: {
    height: 56,
    borderWidth: 1,
    borderColor: '#DCE8DF',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 15,
    fontSize: 15,
    color: '#24382B',
  },

  botao: {
    height: 56,
    backgroundColor: '#237A45',
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  cadastroContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 25,
  },

  cadastroTexto: {
    color: '#68776D',
    fontSize: 14,
  },

  cadastroLink: {
    color: '#237A45',
    fontSize: 14,
    fontWeight: '800',
  },

  rodape: {
    marginTop: 45,
    textAlign: 'center',
    color: '#89958D',
    fontSize: 12,
  },
});