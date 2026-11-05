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

export default function Login() {
  const { entrar } = useApp();
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [carregando, setCarregando] = useState(false);

  async function enviar() {
    if (!email.trim() || !senha) {
      avisar('Campos obrigatórios', 'Informe seu e-mail e sua senha.');
      return;
    }

    try {
      setCarregando(true);
      await entrar({ email, senha });
      router.replace('/inicio');
    } catch (erro) {
      avisar('Não foi possível entrar', erro.message || 'Tente novamente.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <Tela>
      <BotaoVoltar />
      <Text style={styles.icone}>🌿</Text>
      <Text style={styles.titulo}>Bem-vindo de volta!</Text>
      <Text style={styles.descricao}>Entre para continuar sua experiência no Health Food.</Text>

      <Campo
        rotulo="E-mail"
        value={email}
        onChangeText={setEmail}
        placeholder="voce@exemplo.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      <Campo
        rotulo="Senha"
        value={senha}
        onChangeText={setSenha}
        placeholder="Digite sua senha"
        secureTextEntry
        autoCapitalize="none"
        onSubmitEditing={enviar}
      />

      <Botao titulo="Entrar" onPress={enviar} carregando={carregando} estilo={styles.botao} />

      <View style={styles.linha}>
        <Text style={styles.texto}>Ainda não tem conta?</Text>
        <Pressable onPress={() => router.replace('/cadastro')}>
          <Text style={styles.link}>Cadastre-se</Text>
        </Pressable>
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  icone: { fontSize: 44, textAlign: 'center', marginTop: 8 },
  titulo: { fontSize: 28, fontWeight: '800', color: cores.texto, marginTop: 12 },
  descricao: { color: cores.textoSuave, fontSize: 14, lineHeight: 22, marginTop: 8, marginBottom: 24 },
  botao: { marginTop: 8 },
  linha: { flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 24 },
  texto: { color: cores.textoSuave },
  link: { color: cores.verde, fontWeight: '800' },
});
