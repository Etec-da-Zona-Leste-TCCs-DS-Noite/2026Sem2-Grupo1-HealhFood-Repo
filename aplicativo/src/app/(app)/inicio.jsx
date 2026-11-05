import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import Botao from '../../components/Botao';
import CardProduto from '../../components/CardProduto';
import Tela from '../../components/Tela';
import { useApp } from '../../context/AppContext';
import { listarProdutos } from '../../services/produtosService';
import { BORDAS_ABAS, cores } from '../../theme';
import { primeiroNome } from '../../utils/formatar';
import { avaliarProduto, tituloDaRestricao } from '../../utils/restricoes';

export default function Inicio() {
  const { usuario, perfil, adicionarAoCarrinho } = useApp();
  const [produtos, setProdutos] = useState([]);

  useEffect(() => {
    listarProdutos().then(setProdutos).catch(() => setProdutos([]));
  }, []);

  const avaliados = useMemo(
    () => produtos.map((produto) => ({ produto, avaliacao: avaliarProduto(produto, perfil) })),
    [produtos, perfil]
  );
  const semAlerta = avaliados.filter((item) => item.avaliacao.nivel !== 'evitar');
  const sugestoes = avaliados.filter((item) => item.avaliacao.nivel === 'ok').slice(0, 3);
  const restricoes = perfil.restricoes.filter((id) => id !== 'nenhuma');

  return (
    <Tela bordas={BORDAS_ABAS}>
      <Text style={styles.marca}>🥗 Health Food</Text>
      <Text style={styles.ola}>Olá, {primeiroNome(usuario.nome)}!</Text>

      <View style={styles.destaque}>
        {perfil.respondido ? (
          <>
            <Text style={styles.destaqueTitulo}>
              {semAlerta.length} de {produtos.length} alimentos sem alerta para você
            </Text>
            <Text style={styles.destaqueTexto}>
              {restricoes.length > 0
                ? `Seu perfil: ${restricoes.map(tituloDaRestricao).join(', ')}.`
                : 'Você não informou restrições. Todos os alimentos são exibidos.'}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.destaqueTitulo}>Conte suas necessidades alimentares</Text>
            <Text style={styles.destaqueTexto}>
              Com o questionário, mostramos primeiro os alimentos que combinam com você.
            </Text>
            <Botao
              titulo="Responder questionário"
              onPress={() => router.push('/questionario')}
              estilo={styles.botaoDestaque}
            />
          </>
        )}
      </View>

      <Text style={styles.secao}>Para você</Text>
      {sugestoes.map(({ produto, avaliacao }) => (
        <CardProduto
          key={produto.id}
          produto={produto}
          avaliacao={avaliacao}
          onAbrir={() => router.push(`/produto/${produto.id}`)}
          onAdicionar={() => adicionarAoCarrinho(produto)}
        />
      ))}

      <Botao titulo="Ver todos os alimentos" variante="secundario" onPress={() => router.push('/alimentos')} />

      <Text style={styles.aviso}>
        Sempre confira a composição e a rotulagem dos alimentos antes do consumo.
      </Text>
    </Tela>
  );
}

const styles = StyleSheet.create({
  marca: { color: cores.verde, fontWeight: '800', fontSize: 16 },
  ola: { color: cores.texto, fontSize: 28, fontWeight: '800', marginTop: 4, marginBottom: 16 },
  destaque: { backgroundColor: cores.verde, borderRadius: 18, padding: 20, marginBottom: 24 },
  destaqueTitulo: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', lineHeight: 26 },
  destaqueTexto: { color: '#E4F2E8', fontSize: 14, lineHeight: 21, marginTop: 8 },
  botaoDestaque: { backgroundColor: '#FFFFFF', marginTop: 16 },
  secao: { color: cores.texto, fontSize: 20, fontWeight: '800', marginBottom: 12 },
  aviso: { color: '#777777', fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 20 },
});
