// TODO(backend): trocar por chamadas à API de autenticação.
// Versão atual: contas guardadas no aparelho, SOMENTE PARA DEMONSTRAÇÃO
// (a senha fica salva localmente e sem proteção; não usar em produção).
import { gerarId } from '../utils/formatar';
import { CHAVES, gravar, ler, remover } from './storage';

function publico(usuario) {
  return { id: usuario.id, nome: usuario.nome, email: usuario.email };
}

// POST /auth/cadastro  { nome, email, senha } -> { id, nome, email }
export async function cadastrar({ nome, email, senha }) {
  const emailNormalizado = email.trim().toLowerCase();
  const usuarios = await ler(CHAVES.usuarios, []);

  if (usuarios.some((item) => item.email === emailNormalizado)) {
    throw new Error('Já existe uma conta com este e-mail.');
  }

  const usuario = { id: gerarId(), nome: nome.trim(), email: emailNormalizado, senha };
  await gravar(CHAVES.usuarios, [...usuarios, usuario]);
  await gravar(CHAVES.sessao, publico(usuario));
  return publico(usuario);
}

// POST /auth/login  { email, senha } -> { id, nome, email }
export async function entrar({ email, senha }) {
  const emailNormalizado = email.trim().toLowerCase();
  const usuarios = await ler(CHAVES.usuarios, []);
  const usuario = usuarios.find((item) => item.email === emailNormalizado && item.senha === senha);

  if (!usuario) {
    throw new Error('E-mail ou senha incorretos.');
  }

  await gravar(CHAVES.sessao, publico(usuario));
  return publico(usuario);
}

// Recupera quem estava logado ao abrir o app (com a API: validar o token salvo).
export async function obterSessao() {
  return ler(CHAVES.sessao, null);
}

// POST /auth/logout
export async function sair() {
  await remover(CHAVES.sessao);
}
