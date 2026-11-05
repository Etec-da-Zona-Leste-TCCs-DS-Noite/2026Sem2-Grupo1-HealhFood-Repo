import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';

import CardProduto from '../../components/CardProduto';
import Carregando from '../../components/Carregando';
import Tela from '../../components/Tela';
import { useApp } from '../../context/AppContext';
import { CATEGORIAS } from '../../data/produtos';
import { listarProdutos } from '../../services/produtosService';
import { BORDAS_ABAS, cores } from '../../theme';
import { avaliarProduto, ordemDoNivel } from '../../utils/restricoes';

export default function Alimentos() {
  const { perfil, adicionarAoCarrinho } = useApp();
  const [produtos, setProdutos] = useState(null);
  const [busca, setBusca] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [mostrarEvitados, setMostrarEvitados] = useState(false);

  useEffect(() => {
    listarProdutos().then(setProdutos).catch(() => setProdutos([]));
  }, []);

  const avaliados = useMemo(
    () => (produtos ?? []).map((produto) => ({ produto, avaliacao: avaliarProduto(produto, perfil) })),
    [produtos, perfil]
  );

  const temPerfil = avaliados.length > 0 && !avaliados[0].avaliacao.semPerfil;

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return avaliados
      .filter(({ produto, avaliacao }) => {
        if (categoria !== 'Todas' && produto.categoria !== categoria) return false;
        if (!mostrarEvitados && avaliacao.nivel === 'evitar') return false;
        if (!termo) return true;
        return `${produto.nome} ${produto.restaurante}`.toLowerCase().includes(termo);
      })
      .sort((a, b) => ordemDoNivel(a.avaliacao.nivel) - ordemDoNivel(b.avaliacao.nivel));
  }, [avaliados, busca, categoria, mostrarEvitados]);

  if (produtos === null) return <Carregando texto="Carregando alimentos..." />;

  return (
    <Tela bordas={BORDAS_ABAS}>
      <Text style={styles.titulo}>Alimentos</Text>

      <TextInput
        style={styles.busca}
        value={busca}
        onChangeText={setBusca}
        placeholder="Buscar por nome ou restaurante"
        placeholderTextColor="#89958D"
      />

      <View style={styles.chips}>
        {['Todas', ...CATEGORIAS].map((nome) => (
          <Pressable
            key={nome}
            onPress={() => setCategoria(nome)}
            style={[styles.chip, categoria === nome && styles.chipMarcado]}
          >
            <Text style={[styles.chipTexto, categoria === nome && styles.chipTextoMarcado]}>{nome}</Text>
          </Pressable>
        ))}
      </View>

      {temPerfil ? (
        <View style={styles.opcao}>
          <Text style={styles.opcaoTexto}>Mostrar também os que contêm itens que evito</Text>
          <Switch
            value={mostrarEvitados}
            onValueChange={setMostrarEvitados}
            trackColor={{ true: cores.verde }}
          />
        </View>
      ) : null}

      <Text style={styles.aviso}>
        Dados demonstrativos. A compatibilidade usa o cadastro do produto e não substitui a leitura do
        rótulo nem a orientação de um profissional de saúde.
      </Text>

      {visiveis.length === 0 ? (
        <Text style={styles.vazio}>Nenhum alimento encontrado com esses filtros.</Text>
      ) : (
        visiveis.map(({ produto, avaliacao }) => (
          <CardProduto
            key={produto.id}
            produto={produto}
            avaliacao={avaliacao}
            onAbrir={() => router.push(`/produto/${produto.id}`)}
            onAdicionar={() => adicionarAoCarrinho(produto)}
          />
        ))
      )}
    </Tela>
  );
}

const styles = StyleSheet.create({
  titulo: { color: cores.texto, fontSize: 28, fontWeight: '800', marginBottom: 14 },
  busca: {
    minHeight: 50,
    backgroundColor: cores.cartao,
    borderWidth: 1,
    borderColor: cores.borda,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: cores.texto,
    marginBottom: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: cores.borda,
    backgroundColor: cores.cartao,
  },
  chipMarcado: { backgroundColor: cores.verde, borderColor: cores.verde },
  chipTexto: { color: cores.texto, fontWeight: '600' },
  chipTextoMarcado: { color: '#FFFFFF' },
  opcao: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 },
  opcaoTexto: { flex: 1, color: cores.texto, fontSize: 14 },
  aviso: { color: cores.atencao, backgroundColor: cores.atencaoClaro, borderRadius: 10, padding: 12, fontSize: 12, lineHeight: 18, marginBottom: 16 },
  vazio: { color: cores.textoSuave, textAlign: 'center', marginTop: 24 },
});
