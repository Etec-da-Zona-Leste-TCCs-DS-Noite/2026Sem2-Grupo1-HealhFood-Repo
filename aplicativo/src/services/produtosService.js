// TODO(backend): GET /produtos e GET /produtos/:id (os mesmos produtos do painel administrativo).
import { PRODUTOS_DEMO } from '../data/produtos';

// GET /produtos -> Produto[]
export async function listarProdutos() {
  return PRODUTOS_DEMO;
}

// GET /produtos/:id -> Produto | null
export async function obterProduto(id) {
  return PRODUTOS_DEMO.find((item) => item.id === String(id)) ?? null;
}
