import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';

import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { StatusBar } from 'expo-status-bar';

// Opções de necessidades e preferências alimentares.
const restricoes = [
  {
    id: 'diabetes',
    titulo: 'Diabetes',
    descricao: 'Necessidades relacionadas ao controle da glicose.',
    emoji: '🩸',
  },
  {
    id: 'hipertensao',
    titulo: 'Hipertensão',
    descricao: 'Atenção às informações sobre sódio.',
    emoji: '❤️',
  },
  {
    id: 'alergia',
    titulo: 'Alergia alimentar',
    descricao: 'Identifique os ingredientes que precisam ser evitados.',
    emoji: '⚠️',
  },
  {
    id: 'lactose',
    titulo: 'Intolerância à lactose',
    descricao: 'Atenção à presença de lactose e derivados.',
    emoji: '🥛',
  },
  {
    id: 'gluten',
    titulo: 'Necessidade de evitar glúten',
    descricao: 'Verifique ingredientes e informações relevantes.',
    emoji: '🌾',
  },
  {
    id: 'vegetariano',
    titulo: 'Preferência vegetariana',
    descricao: 'Preferência alimentar, não condição médica.',
    emoji: '🥦',
  },
  {
    id: 'vegano',
    titulo: 'Preferência vegana',
    descricao: 'Preferência por alimentos sem ingredientes de origem animal.',
    emoji: '🌱',
  },
  {
    id: 'nenhuma',
    titulo: 'Nenhuma dessas opções',
    descricao: 'Quero explorar os alimentos sem cadastrar restrições.',
    emoji: '🍽️',
  },
];

const ingredientes = [
  'Leite',
  'Amendoim',
  'Castanhas',
  'Ovos',
  'Soja',
  'Trigo',
  'Peixes',
  'Crustáceos',
  'Gergelim',
  'Outro',
];

export default function QuestionarioScreen() {
  // Recupera os dados enviados pela navegação, se existirem.
  const params = useLocalSearchParams();
  const nome = Array.isArray(params.nome)
    ? params.nome[0]
    : params.nome;

  const email = Array.isArray(params.email)
    ? params.email[0]
    : params.email;

  const [selecionadas, setSelecionadas] = useState([]);
  const [ingredientesEvitados, setIngredientesEvitados] = useState([]);

  // Marca ou desmarca uma necessidade alimentar.
  function alternarRestricao(id) {
    setSelecionadas((atuais) => {
      if (id === 'nenhuma') {
        return atuais.includes('nenhuma') ? [] : ['nenhuma'];
      }

      const semNenhuma = atuais.filter(
        (item) => item !== 'nenhuma'
      );

      if (semNenhuma.includes(id)) {
        return semNenhuma.filter((item) => item !== id);
      }

      return [...semNenhuma, id];
    });
  }

  // Marca ou desmarca um ingrediente.
  function alternarIngrediente(ingrediente) {
    setIngredientesEvitados((atuais) =>
      atuais.includes(ingrediente)
        ? atuais.filter((item) => item !== ingrediente)
        : [...atuais, ingrediente]
    );
  }

  // Envia as escolhas para a tela inicial.
  function continuar() {
    if (
      selecionadas.includes('alergia') &&
      ingredientesEvitados.length === 0
    ) {
      Alert.alert(
        'Identifique os alimentos',
        'Você selecionou alergia alimentar. Informe os ingredientes que precisam ser evitados ou escolha "Outro".'
      );

      return;
    }

    router.replace({
      pathname: '/inicio',
      params: {
        nome: nome || 'Visitante',
        email: email || '',
        restricoes: JSON.stringify(selecionadas),
        ingredientes: JSON.stringify(ingredientesEvitados),
      },
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.voltar}
          onPress={() => router.back()}
        >
          <Text style={styles.voltarTexto}>‹ Voltar</Text>
        </TouchableOpacity>

        <View style={styles.progressoContainer}>
          <View style={styles.progressoFundo}>
            <View style={styles.progressoPreenchido} />
          </View>

          <Text style={styles.progressoTexto}>
            ETAPA 1 DE 2
          </Text>
        </View>

        <Text style={styles.emojiPrincipal}>🌿</Text>

        <Text style={styles.titulo}>
          Vamos conhecer suas necessidades
          {nome ? `, ${nome.split(' ')[0]}` : ''}?
        </Text>

        <Text style={styles.descricao}>
          Selecione as condições e preferências que deseja
          informar. Você pode marcar várias opções.
        </Text>

        <Text style={styles.secaoTitulo}>
          Suas necessidades alimentares
        </Text>

        <View style={styles.lista}>
          {restricoes.map((item) => {
            const selecionada = selecionadas.includes(item.id);

            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => alternarRestricao(item.id)}
                style={[
                  styles.cartao,
                  selecionada && styles.cartaoSelecionado,
                ]}
              >
                <Text style={styles.cartaoEmoji}>
                  {item.emoji}
                </Text>

                <View style={styles.cartaoTextoContainer}>
                  <Text style={styles.cartaoTitulo}>
                    {item.titulo}
                  </Text>

                  <Text style={styles.cartaoDescricao}>
                    {item.descricao}
                  </Text>
                </View>

                <View
                  style={[
                    styles.checkbox,
                    selecionada && styles.checkboxSelecionado,
                  ]}
                >
                  {selecionada && (
                    <Text style={styles.check}>✓</Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {selecionadas.includes('alergia') && (
          <View style={styles.ingredientesContainer}>
            <Text style={styles.secaoTitulo}>
              Quais ingredientes precisam ser evitados?
            </Text>

            <Text style={styles.ingredientesDescricao}>
              Selecione todos os que se aplicam.
            </Text>

            <View style={styles.chipsContainer}>
              {ingredientes.map((ingrediente) => {
                const selecionado =
                  ingredientesEvitados.includes(ingrediente);

                return (
                  <TouchableOpacity
                    key={ingrediente}
                    onPress={() => alternarIngrediente(ingrediente)}
                    style={[
                      styles.chip,
                      selecionado && styles.chipSelecionado,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipTexto,
                        selecionado && styles.chipTextoSelecionado,
                      ]}
                    >
                      {selecionado ? '✓ ' : '+ '}
                      {ingrediente}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.aviso}>
              Esta seleção ajuda a personalizar a busca, mas não
              garante que um alimento seja seguro. Confirme os
              ingredientes e os riscos de contaminação cruzada
              com o estabelecimento.
            </Text>
          </View>
        )}

        <View style={styles.privacidade}>
          <Text style={styles.privacidadeEmoji}>🔒</Text>

          <Text style={styles.privacidadeTexto}>
            Você poderá revisar suas escolhas. As informações
            alimentares exigem proteção e não substituem
            orientação médica ou nutricional.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.botao}
          activeOpacity={0.85}
          onPress={continuar}
        >
          <Text style={styles.botaoTexto}>Continuar</Text>
          <Text style={styles.botaoSeta}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.pular}
          onPress={() => {
            setSelecionadas(['nenhuma']);
            setIngredientesEvitados([]);

            // Continua sem restrições cadastradas.
            router.replace({
              pathname: '/inicio',
              params: {
                nome: nome || 'Visitante',
                email: email || '',
                restricoes: JSON.stringify(['nenhuma']),
                ingredientes: JSON.stringify([]),
              },
            });
          }}
        >
          <Text style={styles.pularTexto}>
            Prefiro não informar agora
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6FAF7',
  },

  conteudo: {
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 35,
  },

  voltar: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
  },

  voltarTexto: {
    color: '#237A45',
    fontSize: 16,
    fontWeight: '700',
  },

  progressoContainer: {
    marginTop: 12,
    marginBottom: 25,
  },

  progressoFundo: {
    height: 5,
    backgroundColor: '#DCE9DF',
    borderRadius: 10,
    overflow: 'hidden',
  },

  progressoPreenchido: {
    width: '50%',
    height: '100%',
    backgroundColor: '#237A45',
  },

  progressoTexto: {
    color: '#728076',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 10,
  },

  emojiPrincipal: {
    fontSize: 36,
    marginBottom: 10,
  },

  titulo: {
    color: '#1C3023',
    fontSize: 27,
    lineHeight: 34,
    fontWeight: '800',
  },

  descricao: {
    color: '#68776D',
    fontSize: 14,
    lineHeight: 22,
    marginTop: 12,
    marginBottom: 25,
  },

  secaoTitulo: {
    color: '#294333',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 14,
  },

  lista: {
    gap: 10,
  },

  cartao: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1EAE3',
    borderRadius: 16,
    padding: 13,
    gap: 11,
  },

  cartaoSelecionado: {
    borderColor: '#27814A',
    backgroundColor: '#EDF7EF',
  },

  cartaoEmoji: {
    fontSize: 24,
  },

  cartaoTextoContainer: {
    flex: 1,
  },

  cartaoTitulo: {
    color: '#294333',
    fontSize: 13,
    fontWeight: '800',
  },

  cartaoDescricao: {
    color: '#758078',
    fontSize: 11,
    lineHeight: 16,
    marginTop: 4,
  },

  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CAD8CD',
    alignItems: 'center',
    justifyContent: 'center',
  },

  checkboxSelecionado: {
    backgroundColor: '#237A45',
    borderColor: '#237A45',
  },

  check: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },

  ingredientesContainer: {
    marginTop: 28,
  },

  ingredientesDescricao: {
    color: '#68776D',
    fontSize: 13,
    marginTop: -5,
    marginBottom: 15,
  },

  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
  },

  chip: {
    borderWidth: 1,
    borderColor: '#D7E4DA',
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 13,
  },

  chipSelecionado: {
    backgroundColor: '#237A45',
    borderColor: '#237A45',
  },

  chipTexto: {
    color: '#45604C',
    fontSize: 12,
    fontWeight: '600',
  },

  chipTextoSelecionado: {
    color: '#FFFFFF',
  },

  aviso: {
    color: '#886A30',
    backgroundColor: '#FFF6E3',
    padding: 13,
    borderRadius: 12,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 17,
  },

  privacidade: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    backgroundColor: '#EAF3EC',
    borderRadius: 14,
    marginTop: 24,
  },

  privacidadeEmoji: {
    fontSize: 18,
  },

  privacidadeTexto: {
    flex: 1,
    color: '#4C6753',
    fontSize: 11,
    lineHeight: 17,
  },

  botao: {
    minHeight: 56,
    backgroundColor: '#237A45',
    borderRadius: 15,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    marginTop: 24,
  },

  botaoTexto: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },

  botaoSeta: {
    color: '#FFFFFF',
    fontSize: 21,
  },

  pular: {
    alignItems: 'center',
    padding: 16,
    marginTop: 5,
  },

  pularTexto: {
    color: '#68776D',
    fontSize: 13,
    fontWeight: '600',
  },
});