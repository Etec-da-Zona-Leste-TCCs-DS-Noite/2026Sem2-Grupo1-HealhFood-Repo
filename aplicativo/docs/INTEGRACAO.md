# Guia de integração (backend / API)

O app usa só as funções de `src/services/`. Cada uma já traz no comentário o endpoint sugerido.
Trocar o armazenamento local por chamadas `fetch` nessas funções é suficiente; o resto do app não muda.

| Arquivo | Função | Endpoint sugerido | Retorno esperado |
|---|---|---|---|
| authService | `cadastrar({nome,email,senha})` | `POST /auth/cadastro` | `{ id, nome, email }` |
| authService | `entrar({email,senha})` | `POST /auth/login` | `{ id, nome, email }` (+ token) |
| authService | `obterSessao()` | validar token salvo | `{ id, nome, email }` ou `null` |
| authService | `sair()` | `POST /auth/logout` | - |
| perfilService | `obterPerfil(usuarioId)` | `GET /clientes/:id/perfil` | `{ restricoes, ingredientesEvitados, respondido }` |
| perfilService | `salvarPerfil(usuarioId, perfil)` | `PUT /clientes/:id/perfil` | o perfil salvo |
| produtosService | `listarProdutos()` | `GET /produtos` | `Produto[]` |
| produtosService | `obterProduto(id)` | `GET /produtos/:id` | `Produto` ou `null` |
| pedidosService | `criarPedidos(usuario, itens)` | `POST /pedidos` | `Pedido[]` |
| pedidosService | `listarPedidos(usuarioId)` | `GET /clientes/:id/pedidos` | `Pedido[]` |

`carrinhoService` pode continuar local.

Se a API exigir token, o lugar natural para guardá-lo é `authService` (e para enviá-lo, um pequeno
`fetch` wrapper em `src/services/api.js`).

## Formatos

**Produto**

```json
{
  "id": "1",
  "nome": "Bowl de quinoa com legumes",
  "categoria": "Refeição",
  "restaurante": "Cozinha Verde",
  "preco": 32.9,
  "descricao": "texto curto",
  "ingredientes": ["Quinoa", "Abobrinha"],
  "alergenos": ["Leite", "Ovos"],
  "tags": ["vegano", "vegetariano", "sem_gluten", "baixo_acucar", "baixo_sodio"]
}
```

- `categoria`: Refeição, Lanche, Bebida ou Sobremesa (as mesmas do administrativo).
- `alergenos`: usar exatamente estes nomes: Leite, Amendoim, Castanhas, Ovos, Soja, Trigo, Peixes, Crustáceos, Gergelim.
  `[]` significa "nenhum declarado"; `null`/ausente significa "não informado" (o app mostra *confira antes de consumir*).
- `tags`: `vegano`, `vegetariano`, `sem_gluten`, `baixo_acucar`, `baixo_sodio`.

**Pedido** (mesmos campos do painel administrativo, mais os itens)

```json
{
  "id": "abc",
  "clienteId": "u1",
  "cliente": "Ana Silva",
  "restaurante": "Cozinha Verde",
  "itens": [{ "produtoId": "1", "nome": "Bowl de quinoa", "preco": 32.9, "quantidade": 2 }],
  "valor": 65.8,
  "status": "Pendente",
  "criadoEm": "2026-11-04T22:00:00.000Z"
}
```

Status: `Pendente`, `Em preparo`, `Concluído`, `Cancelado`.
O app cria **um pedido por restaurante**, como a tabela de pedidos do administrativo.

## O que o painel administrativo precisa mudar

Hoje o `administrativo/adm.js` e o `fornecedores/fornecedores.js` guardam tudo no `localStorage` do
navegador, então nenhum outro sistema consegue ler esses dados. Para os três conversarem, os dois
painéis também precisam passar a usar a mesma API/banco.

No cadastro de **produtos** do administrativo faltam os campos que o app usa para filtrar:
`descricao`, `ingredientes`, `alergenos` e `tags` (hoje existem só nome, preço, restaurante e categoria).
