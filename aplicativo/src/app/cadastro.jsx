import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Botao from '../components/Botao';
import BotaoVoltar from '../components/BotaoVoltar';
import Campo from '../components/Campo';
import Tela from '../components/Tela';
import { useApp } from '../context/AppContext';
import { cores } from '../theme';
import { avisar } from '../utils/dialogo';

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Cadastro() {
  const { cadastrar } = useApp();
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (!nome.trim() || !email.trim() || !senha) {
      avisar('Atenção', 'Preencha todos os campos.');
      return;
    }
    if (!EMAIL_VALIDO.test(email.trim())) {
      avisar('E-mail inválido', 'Confira o e-mail digitado.');
      return;
    }
    if (senha.length < 6) {
      avisar('Senha inválida', 'Use pelo menos seis caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      avisar('Atenção', 'As senhas não coincidem.');
      return;
    }

    try {
      setCarregando(true);
      await cadastrar({ nome, email, senha });
      router.replace('/questionario');
    } catch (erro) {
      avisar('Erro no cadastro', erro.message || 'Não foi possível cadastrar.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <BotaoVoltar />
      <Text style={styles.icone}>🥗</Text>
      <Text style={styles.titulo}>Criar conta</Text>

      <Campo rotulo="Nome completo" value={nome} onChangeText={setNome} placeholder="Digite seu nome" />
      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="seuemail@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="Crie uma senha"
        secureTextEntry
        autoCapitalize="none"
      />
      <Campo
        rotulo="Confirmar senha"
        value={confirmacao}
        onChangeText={setConfirmacao}
        placeholder="Repita a senha"
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={enviar}
      />

      <Botao titulo="Criar conta" onPress={enviar} carregando={carregando} estilo={styles.botao} />

      <View style={styles.linha}>
        <Text style={styles.texto}>Já tem conta?</Text>
        <Pressable onPress={() => router.replace('/login')}>
          <Text style={styles.link}>Entrar</Text>
        </Pressable>
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  icone: { fontSize: 44, textAlign: 'center' },
  titulo: { fontSize: 28, fontWeight: '800', color: cores.texto, textAlign: 'center', marginVertical: 16 },
  botao: { marginTop: 8 },
  linha: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  texto: { color: cores.textoSuave },
  link: { color: cores.verde, fontWeight: '800' },
});
