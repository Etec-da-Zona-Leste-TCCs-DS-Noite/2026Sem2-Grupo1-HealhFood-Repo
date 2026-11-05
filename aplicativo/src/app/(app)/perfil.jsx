import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import Botao from '../../components/Botao';
import Tela from '../../components/Tela';
import { useApp } from '../../context/AppContext';
import { BORDAS_ABAS, cores } from '../../theme';
import { avisar } from '../../utils/dialogo';
import { tituloDaRestricao } from '../../utils/restricoes';

export default function Perfil() {
  const { usuario, perfil, sair } = useApp();
  const restricoes = perfil.restricoes.filter((id) => id !== 'nenhuma');

  async function aoSair() {
    try {
      await sair();
      router.replace('/');
    } catch {
      avisar('Erro', 'Não foi possível sair da conta.');
    }
  }

  return (
    <Tela bordas={BORDAS_ABAS}>
      <Text style={styles.icone}>👤</Text>
      <Text style={styles.titulo}>Meu perfil</Text>

      <View style={styles.card}>
        <Text style={styles.rotulo}>Nome</Text>
        <Text style={styles.valor}>{usuario.nome}</Text>

        <Text style={styles.rotulo}>E-mail</Text>
        <Text style={styles.valor}>{usuario.email}</Text>

        <Text style={styles.rotulo}>Restrições e preferências</Text>
        <Text style={styles.valor}>
          {!perfil.respondido
            ? 'Questionário ainda não respondido.'
            : restricoes.length > 0
              ? restricoes.map(tituloDaRestricao).join(', ')
              : 'Nenhuma informada.'}
        </Text>

        {perfil.ingredientesEvitados.length > 0 ? (
          <>
            <Text style={styles.rotulo}>Ingredientes a evitar</Text>
            <Text style={styles.valor}>{perfil.ingredientesEvitados.join(', ')}</Text>
          </>
        ) : null}
      </View>

      <Botao
        titulo={perfil.respondido ? 'Editar restrições' : 'Responder questionário'}
        onPress={() => router.push({ pathname: '/questionario', params: { origem: 'perfil' } })}
      />
      <Botao titulo="Sair da conta" variante="perigo" onPress={aoSair} estilo={styles.sair} />
    </Tela>
  );
}

const styles = StyleSheet.create({
  icone: { fontSize: 48, textAlign: 'center' },
  titulo: { color: cores.texto, fontSize: 28, fontWeight: '800', textAlign: 'center', marginVertical: 12 },
  card: { backgroundColor: cores.cartao, borderWidth: 1, borderColor: cores.borda, borderRadius: 16, padding: 18, marginBottom: 20 },
  rotulo: { color: cores.textoSuave, fontSize: 12, marginTop: 12 },
  valor: { color: cores.texto, fontSize: 16, fontWeight: '600', marginTop: 2 },
  sair: { marginTop: 12 },
});
