// TODO(backend): GET/PUT /clientes/:id/perfil
import { CHAVES, gravar, ler } from './storage';

export const PERFIL_VAZIO = {
  restricoes: [],
  ingredientesEvitados: [],
  respondido: false,
};

// GET /clientes/:id/perfil -> { restricoes: string[], ingredientesEvitados: string[], respondido: boolean }
export async function obterPerfil(usuarioId) {
  const perfis = await ler(CHAVES.perfis, {});
  return { ...PERFIL_VAZIO, ...(perfis[usuarioId] ?? {}) };
}

// PUT /clientes/:id/perfil  { restricoes, ingredientesEvitados }
export async function salvarPerfil(usuarioId, { restricoes, ingredientesEvitados }) {
  const perfis = await ler(CHAVES.perfis, {});
  const perfil = { restricoes, ingredientesEvitados, respondido: true };
  await gravar(CHAVES.perfis, { ...perfis, [usuarioId]: perfil });
  return perfil;
}
