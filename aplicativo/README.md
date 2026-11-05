# Health Food - aplicativo do cliente

App em **JavaScript** (Expo + React Native + Expo Router). Roda no celular, no emulador e no navegador.
Esta versão **não depende de backend**: contas, perfil, carrinho e pedidos ficam guardados no aparelho.
Os produtos vêm de `src/data/produtos.js` (dados de demonstração).

## Como rodar

Requisitos: Node.js (versão LTS ou mais recente) e, para o celular, o app **Expo Go** atualizado.

```bash
cd aplicativo
npm install
npx expo install --fix   # alinha as versões dos pacotes com o Expo
npx expo start
```

No terminal que abrir:

- **Celular:** leia o QR code com o Expo Go (celular e computador na mesma rede Wi-Fi).
- **Android (emulador):** tecle `a`.
- **iOS (simulador, só no Mac):** tecle `i`.
- **Navegador:** tecle `w`.

Se algo ficar estranho depois de mexer em arquivos de configuração: `npx expo start -c` (limpa o cache).

## Fluxo do app

1. Boas-vindas -> **Cadastro** ou **Login**
2. **Questionário** de restrições (alergias, lactose, glúten, vegano...). Pode ser editado depois no Perfil.
3. Abas: **Início**, **Alimentos**, **Carrinho**, **Pedidos**, **Perfil**
4. Os alimentos são avaliados contra o perfil: *combina*, *confira antes de consumir* ou *contém item que você evita*.
5. O carrinho gera **um pedido por restaurante**, com status `Pendente` (mesmos status do painel administrativo).

## Estrutura

```
src/
  app/            telas (cada arquivo é uma rota)
    (app)/        telas com abas: inicio, alimentos, carrinho, pedidos, perfil
    produto/[id]  detalhe do produto
  components/     Botao, Campo, Tela, CardProduto, Selo...
  context/        AppContext: estado global (usuário, perfil, carrinho)
  services/       ponto de integração com a API (veja docs/INTEGRACAO.md)
  data/           produtos de demonstração
  utils/          regras de restrição, formatação, diálogos
```

## Integração com o backend

Leia **docs/INTEGRACAO.md**. Resumindo: toda a comunicação com dados passa pelos arquivos de
`src/services/`. Para ligar a API, basta trocar o corpo dessas funções; as telas não mudam.

## Observações

- A senha do cadastro é guardada sem proteção no aparelho, **só para demonstração**. Autenticação de verdade deve ser feita no backend.
- O app auxilia na escolha de alimentos, mas não substitui a leitura do rótulo nem orientação médica ou nutricional.
