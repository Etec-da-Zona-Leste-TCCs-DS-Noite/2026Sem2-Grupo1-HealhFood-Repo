import { Redirect, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Botao from '../components/Botao';
import Carregando from '../components/Carregando';
import Tela from '../components/Tela';
import { useApp } from '../context/AppContext';
import { cores } from '../theme';

export default function Boasvindas() {
  const { carregando, usuario } = useApp();

  if (carregando) return <Carregando />;
  if (usuario) return <Redirect href="/inicio" />;

  return (
    <Tela estiloConteudo={styles.conteudo}>
      <View style={styles.marca}>
        <Text style={styles.icone}>🥗</Text>
        <Text style={styles.logo}>Health Food</Text>
        <Text style={styles.subtitulo}>Alimentação personalizada para você</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.titulo}>Sua alimentação começa aqui.</Text>
        <Text style={styles.descricao}>
          Descubra opções alimentares considerando suas restrições e preferências.
        </Text>

        <Botao titulo="Criar minha conta" onPress={() => router.push('/cadastro')} />
        <Botao
          titulo="Já tenho uma conta"
          variante="secundario"
          onPress={() => router.push('/login')}
          estilo={styles.segundo}
        />

        <Text style={styles.aviso}>
          O Health Food auxilia na escolha de alimentos, mas não substitui orientações médicas ou
          nutricionais.
        </Text>
      </View>
    </Tela>
  );
}

const styles = StyleSheet.create({
  conteudo: { justifyContent: 'center' },
  marca: { alignItems: 'center', marginBottom: 32 },
  icone: { fontSize: 64, marginBottom: 8 },
  logo: { fontSize: 34, fontWeight: '800', color: cores.verde },
  subtitulo: { fontSize: 14, color: cores.textoSuave, marginTop: 8, textAlign: 'center' },
  card: { backgroundColor: cores.cartao, padding: 24, borderRadius: 20, borderWidth: 1, borderColor: cores.borda },
  titulo: { fontSize: 24, fontWeight: '800', color: cores.texto, textAlign: 'center', marginBottom: 12 },
  descricao: { fontSize: 15, color: cores.textoSuave, lineHeight: 23, textAlign: 'center', marginBottom: 24 },
  segundo: { marginTop: 12 },
  aviso: { fontSize: 11, color: '#777777', lineHeight: 16, textAlign: 'center', marginTop: 16 },
});
