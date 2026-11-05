import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import Botao from '../components/Botao';
import BotaoVoltar from '../components/BotaoVoltar';
import Tela from '../components/Tela';
import { useApp } from '../context/AppContext';
import { cores } from '../theme';
import { avisar } from '../utils/dialogo';
import { primeiroNome } from '../utils/formatar';
import { INGREDIENTES, RESTRICOES } from '../utils/restricoes';

function selecaoInicial(perfil) {
  if (perfil.restricoes.length > 0) return perfil.restricoes;
  return perfil.respondido ? ['nenhuma'] : [];
}

export default function Questionario() {
  const { usuario, perfil, salvarRestricoes } = useApp();
  const { origem } = useLocalSearchParams();
  const [selecionadas, setSelecionadas] = useState(() => selecaoInicial(perfil));
  const [evitados, setEvitados] = useState(perfil.ingredientesEvitados);
  const [salvando, setSalvando] = useState(false);

  if (!usuario) return <Redirect href="/" />;

  const editando = origem === 'perfil';

  function alternarRestricao(id) {
    setSelecionadas((atuais) => {
      if (id === 'nenhuma') return atuais.includes('nenhuma') ? [] : ['nenhuma'];
      const semNenhuma = atuais.filter((item) => item !== 'nenhuma');
      return semNenhuma.includes(id) ? semNenhuma.filter((item) => item !== id) : [...semNenhuma, id];
    });
  }

  function alternarIngrediente(nome) {
    setEvitados((atuais) =>
      atuais.includes(nome) ? atuais.filter((item) => item !== nome) : [...atuais, nome]
    );
  }

  async function guardar(restricoes, ingredientes) {
    try {
      setSalvando(true);
      await salvarRestricoes({ restricoes, ingredientesEvitados: ingredientes });
      router.replace(editando ? '/perfil' : '/inicio');
    } catch {
      avisar('Erro', 'Não foi possível salvar suas escolhas.');
      setSalvando(false);
    }
  }

  function continuar() {
    const restricoes = selecionadas.filter((item) => item !== 'nenhuma');
    const temAlergia = restricoes.includes('alergia');

    if (temAlergia && evitados.length === 0) {
      avisar(
        'Identifique os alimentos',
        'Você selecionou alergia alimentar. Informe os ingredientes que precisam ser evitados ou escolha "Outro".'
      );
      return;
    }

    guardar(restricoes, temAlergia ? evitados : []);
  }

  return (
    <Tela>
      <BotaoVoltar destino={editando ? '/perfil' : '/'} />
      <Text style={styles.emoji}>🌿</Text>
      <Text style={styles.titulo}>
        Vamos conhecer suas necessidades, {primeiroNome(usuario.nome)}?
      </Text>
      <Text style={styles.descricao}>
        Selecione as condições e preferências que deseja informar. Você pode marcar várias opções.
      </Text>

      <View style={styles.lista}>
        {RESTRICOES.map((item) => {
          const marcada = selecionadas.includes(item.id);
          return (
            <Pressable
              key={item.id}
              onPress={() => alternarRestricao(item.id)}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: marcada }}
              style={[styles.cartao, marcada && styles.cartaoMarcado]}
            >
              <Text style={styles.cartaoEmoji}>{item.emoji}</Text>
              <View style={styles.cartaoTexto}>
                <Text style={styles.cartaoTitulo}>{item.titulo}</Text>
                <Text style={styles.cartaoDescricao}>{item.descricao}</Text>
              </View>
              <View style={[styles.caixa, marcada && styles.caixaMarcada]}>
                {marcada ? <Text style={styles.check}>✓</Text> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      {selecionadas.includes('alergia') ? (
        <View style={styles.ingredientes}>
          <Text style={styles.secao}>Quais ingredientes precisam ser evitados?</Text>
          <View style={styles.chips}>
            {INGREDIENTES.map((nome) => {
              const marcado = evitados.includes(nome);
              return (
                <Pressable
                  key={nome}
                  onPress={() => alternarIngrediente(nome)}
                  style={[styles.chip, marcado && styles.chipMarcado]}
                >
                  <Text style={[styles.chipTexto, marcado && styles.chipTextoMarcado]}>
                    {marcado ? '✓ ' : '+ '}
                    {nome}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.aviso}>
            Esta seleção ajuda a filtrar os alimentos, mas não garante que um alimento seja seguro.
            Confirme os ingredientes e os riscos de contaminação cruzada com o estabelecimento.
          </Text>
        </View>
      ) : null}

      <View style={styles.privacidade}>
        <Text style={styles.privacidadeTexto}>
          🔒 Você poderá revisar suas escolhas no perfil. As informações alimentares exigem proteção e
          não substituem orientação médica ou nutricional.
        </Text>
      </View>

      <Botao titulo="Continuar" onPress={continuar} carregando={salvando} />
      {!editando ? (
        <Pressable style={styles.pular} onPress={() => guardar([], [])} disabled={salvando}>
          <Text style={styles.pularTexto}>Prefiro não informar agora</Text>
        </Pressable>
      ) : null}
    </Tela>
  );
}

const styles = StyleSheet.create({
  emoji: { fontSize: 40, textAlign: 'center' },
  titulo: { fontSize: 26, fontWeight: '800', color: cores.texto, marginTop: 8 },
  descricao: { color: cores.textoSuave, fontSize: 14, lineHeight: 21, marginTop: 8, marginBottom: 20 },
  lista: { gap: 10 },
  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 14,
    padding: 14,
  },
  cartaoMarcado: { borderColor: cores.verde, backgroundColor: cores.verdeClaro },
  cartaoEmoji: { fontSize: 24 },
  cartaoTexto: { flex: 1 },
  cartaoTitulo: { color: cores.texto, fontWeight: '700', fontSize: 15 },
  cartaoDescricao: { color: cores.textoSuave, fontSize: 12, marginTop: 2 },
  caixa: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: cores.borda,
    alignItems: 'center',
    justifyContent: 'center',
  },
  caixaMarcada: { backgroundColor: cores.verde, borderColor: cores.verde },
  check: { color: '#FFFFFF', fontWeight: '800' },
  ingredientes: { marginTop: 20 },
  secao: { color: cores.texto, fontWeight: '700', fontSize: 16, marginBottom: 10 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
  },
  chipMarcado: { backgroundColor: cores.verde, borderColor: cores.verde },
  chipTexto: { color: cores.texto, fontWeight: '600' },
  chipTextoMarcado: { color: '#FFFFFF' },
  aviso: { color: cores.atencao, backgroundColor: cores.atencaoClaro, borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 18, marginTop: 12 },
  privacidade: { marginVertical: 20 },
  privacidadeTexto: { color: cores.textoSuave, fontSize: 12, lineHeight: 18 },
  pular: { alignItems: 'center', paddingVertical: 16 },
  pularTexto: { color: cores.textoSuave, textDecorationLine: 'underline' },
});
