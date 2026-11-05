import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Botao from '../../components/Botao';
import BotaoVoltar from '../../components/BotaoVoltar';
import Carregando from '../../components/Carregando';
import Selo from '../../components/Selo';
import Tela from '../../components/Tela';
import { useApp } from '../../context/AppContext';
import { obterProduto } from '../../services/produtosService';
import { cores } from '../../theme';
import { avisar, confirmar } from '../../utils/dialogo';
import { formatarPreco } from '../../utils/formatar';
import { avaliarProduto, TAGS_PRODUTO } from '../../utils/restricoes';

function Lista({ titulo, itens, cor, fundo }) {
  if (itens.length === 0) return null;
  return (
    <View style={[styles.lista, { backgroundColor: fundo }]}>
      <Text style={[styles.listaTitulo, { color: cor }]}>{titulo}</Text>
      {itens.map((texto) => (
        <Text key={texto} style={[styles.listaItem, { color: cor }]}>
          • {texto}
        </Text>
      ))}
    </View>
  );
}

export default function DetalheProduto() {
  const { id } = useLocalSearchParams();
  const { perfil, adicionarAoCarrinho } = useApp();
  const [produto, setProduto] = useState(undefined); // undefined = carregando, null = não existe

  useEffect(() => {
    const codigo = Array.isArray(id) ? id[0] : id;
    obterProduto(codigo).then(setProduto).catch(() => setProduto(null));
  }, [id]);

  if (produto === undefined) return <Carregando />;

  if (produto === null) {
    return (
      <Tela>
        <BotaoVoltar destino="/alimentos" />
        <Text style={styles.nome}>Produto não encontrado</Text>
      </Tela>
    );
  }

  const avaliacao = avaliarProduto(produto, perfil);

  async function adicionar() {
    if (avaliacao.nivel === 'evitar') {
      const continuar = await confirmar(
        'Atenção',
        `${avaliacao.evitar.join('. ')}.\n\nDeseja adicionar ao carrinho mesmo assim?`,
        'Adicionar'
      );
      if (!continuar) return;
    }
    await adicionarAoCarrinho(produto);
    avisar('Adicionado', `${produto.nome} foi adicionado ao carrinho.`);
  }

  return (
    <Tela>
      <BotaoVoltar destino="/alimentos" />
      <Text style={styles.meta}>
        {produto.categoria} - {produto.restaurante}
      </Text>
      <Text style={styles.nome}>{produto.nome}</Text>
      <Text style={styles.preco}>{formatarPreco(produto.preco)}</Text>
      <Text style={styles.descricao}>{produto.descricao}</Text>

      <Selo avaliacao={avaliacao} />

      <View style={styles.bloco}>
        <Lista titulo="Contém algo que você evita" itens={avaliacao.evitar} cor={cores.erro} fundo={cores.erroClaro} />
        <Lista titulo="Confira antes de consumir" itens={avaliacao.atencao} cor={cores.atencao} fundo={cores.atencaoClaro} />
        <Lista titulo="Combina com seu perfil" itens={avaliacao.ok} cor={cores.verdeEscuro} fundo={cores.verdeClaro} />
      </View>

      <Text style={styles.secao}>Ingredientes</Text>
      <Text style={styles.texto}>{(produto.ingredientes ?? []).join(', ') || 'Não informados.'}</Text>

      <Text style={styles.secao}>Alérgenos declarados</Text>
      <Text style={styles.texto}>
        {produto.alergenos == null
          ? 'Não informados.'
          : produto.alergenos.length > 0
            ? produto.alergenos.join(', ')
            : 'Nenhum declarado.'}
      </Text>

      {(produto.tags ?? []).length > 0 ? (
        <>
          <Text style={styles.secao}>Características</Text>
          <Text style={styles.texto}>
            {produto.tags.map((tag) => TAGS_PRODUTO[tag] ?? tag).join(', ')}
          </Text>
        </>
      ) : null}

      <Text style={styles.aviso}>
        Informações demonstrativas. Confira a rotulagem e os riscos de contaminação cruzada com o
        estabelecimento antes de consumir.
      </Text>

      <Botao titulo="Adicionar ao carrinho" onPress={adicionar} />
      <Botao
        titulo="Ver carrinho"
        variante="secundario"
        onPress={() => router.push('/carrinho')}
        estilo={styles.segundo}
      />
    </Tela>
  );
}

const styles = StyleSheet.create({
  meta: { color: cores.textoSuave, fontSize: 13 },
  nome: { color: cores.texto, fontSize: 28, fontWeight: '800', marginTop: 4 },
  preco: { color: cores.verde, fontSize: 22, fontWeight: '800', marginTop: 6 },
  descricao: { color: cores.textoSuave, fontSize: 15, lineHeight: 22, marginVertical: 12 },
  bloco: { gap: 10, marginTop: 14 },
  lista: { borderRadius: 12, padding: 14 },
  listaTitulo: { fontWeight: '800', marginBottom: 6 },
  listaItem: { fontSize: 14, lineHeight: 21 },
  secao: { color: cores.texto, fontSize: 16, fontWeight: '800', marginTop: 20, marginBottom: 6 },
  texto: { color: cores.textoSuave, fontSize: 14, lineHeight: 21 },
  aviso: { color: '#777777', fontSize: 11, lineHeight: 16, marginVertical: 20 },
  segundo: { marginTop: 10 },
});
