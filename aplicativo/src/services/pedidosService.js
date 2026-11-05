// TODO(backend): POST /pedidos e GET /clientes/:id/pedidos
// O painel administrativo guarda pedidos como { cliente, restaurante, valor, status }.
// Status usados lá: Pendente, Em preparo, Concluído, Cancelado.
import { gerarId } from '../utils/formatar';
import { CHAVES, gravar, ler } from './storage';

// POST /pedidos -> Pedido[]  (um pedido por restaurante, como no administrativo)
export async function criarPedidos(usuario, itens) {
  const porRestaurante = {};
  for (const item of itens) {
    (porRestaurante[item.restaurante] ??= []).push(item);
  }

  const agora = new Date().toISOString();
  const novos = Object.entries(porRestaurante).map(([restaurante, lista]) => ({
    id: gerarId(),
    clienteId: usuario.id,
    cliente: usuario.nome,
    restaurante,
    itens: lista.map((item) => ({
      produtoId: item.id,
      nome: item.nome,
      preco: item.preco,
      quantidade: item.quantidade,
    })),
    valor: lista.reduce((soma, item) => soma + item.preco * item.quantidade, 0),
    status: 'Pendente',
    criadoEm: agora,
  }));

  const existentes = await ler(CHAVES.pedidos, []);
  await gravar(CHAVES.pedidos, [...existentes, ...novos]);
  return novos;
}

// GET /clientes/:id/pedidos -> Pedido[]
export async function listarPedidos(usuarioId) {
  const todos = await ler(CHAVES.pedidos, []);
  return todos
    .filter((item) => item.clienteId === usuarioId)
    .sort((a, b) => (a.criadoEm < b.criadoEm ? 1 : -1));
}
