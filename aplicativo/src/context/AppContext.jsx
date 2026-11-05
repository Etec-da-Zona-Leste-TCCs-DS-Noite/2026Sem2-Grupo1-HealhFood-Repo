import { createContext, useCallback, useContext, useEffect, useState } from 'react';

import * as auth from '../services/authService';
import { obterCarrinho, salvarCarrinho } from '../services/carrinhoService';
import { criarPedidos } from '../services/pedidosService';
import { obterPerfil, PERFIL_VAZIO, salvarPerfil } from '../services/perfilService';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [carregando, setCarregando] = useState(true);
  const [usuario, setUsuario] = useState(null);
  const [perfil, setPerfil] = useState(PERFIL_VAZIO);
  const [carrinho, setCarrinho] = useState([]);

  const carregarDadosDoUsuario = useCallback(async (pessoa) => {
    const [perfilSalvo, carrinhoSalvo] = await Promise.all([
      obterPerfil(pessoa.id),
      obterCarrinho(pessoa.id),
    ]);
    setPerfil(perfilSalvo);
    setCarrinho(carrinhoSalvo);
  }, []);

  // Ao abrir o app, recupera a sessão anterior.
  useEffect(() => {
    let ativo = true;
    async function iniciar() {
      try {
        const sessao = await auth.obterSessao();
        if (sessao) {
          await carregarDadosDoUsuario(sessao);
          if (ativo) setUsuario(sessao);
        }
      } catch {
        // Se algo falhar, o app simplesmente abre sem sessão.
      } finally {
        if (ativo) setCarregando(false);
      }
    }
    iniciar();
    return () => {
      ativo = false;
    };
  }, [carregarDadosDoUsuario]);

  async function entrar(dados) {
    const pessoa = await auth.entrar(dados);
    await carregarDadosDoUsuario(pessoa);
    setUsuario(pessoa);
    return pessoa;
  }

  async function cadastrar(dados) {
    const pessoa = await auth.cadastrar(dados);
    await carregarDadosDoUsuario(pessoa);
    setUsuario(pessoa);
    return pessoa;
  }

  async function sair() {
    await auth.sair();
    setUsuario(null);
    setPerfil(PERFIL_VAZIO);
    setCarrinho([]);
  }

  async function salvarRestricoes(dados) {
    const novoPerfil = await salvarPerfil(usuario.id, dados);
    setPerfil(novoPerfil);
  }

  async function atualizarCarrinho(novosItens) {
    setCarrinho(novosItens);
    await salvarCarrinho(usuario.id, novosItens);
  }

  async function adicionarAoCarrinho(produto) {
    const existente = carrinho.find((item) => item.id === produto.id);
    const novos = existente
      ? carrinho.map((item) =>
          item.id === produto.id ? { ...item, quantidade: item.quantidade + 1 } : item
        )
      : [...carrinho, { ...produto, quantidade: 1 }];
    await atualizarCarrinho(novos);
  }

  async function alterarQuantidade(id, variacao) {
    const novos = carrinho
      .map((item) => (item.id === id ? { ...item, quantidade: item.quantidade + variacao } : item))
      .filter((item) => item.quantidade > 0);
    await atualizarCarrinho(novos);
  }

  async function removerDoCarrinho(id) {
    await atualizarCarrinho(carrinho.filter((item) => item.id !== id));
  }

  async function finalizarPedido() {
    const pedidos = await criarPedidos(usuario, carrinho);
    await atualizarCarrinho([]);
    return pedidos;
  }

  const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);

  const valor = {
    carregando,
    usuario,
    perfil,
    carrinho,
    totalItens,
    entrar,
    cadastrar,
    sair,
    salvarRestricoes,
    adicionarAoCarrinho,
    alterarQuantidade,
    removerDoCarrinho,
    finalizarPedido,
  };

  return <AppContext.Provider value={valor}>{children}</AppContext.Provider>;
}

export function useApp() {
  const contexto = useContext(AppContext);
  if (!contexto) {
    throw new Error('useApp precisa ser usado dentro de <AppProvider>.');
  }
  return contexto;
}
