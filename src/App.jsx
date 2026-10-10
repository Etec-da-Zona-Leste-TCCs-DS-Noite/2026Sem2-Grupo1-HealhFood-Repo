import { useState } from 'react';
import './App.css';

function App() {
  // Guarda a tela que o visitante está visualizando.
  const [tela, setTela] = useState('inicio');

  // Conteúdo principal de cada tela da SPA.
  function renderizarTela() {
    switch (tela) {
      case 'funciona':
        return (
          <section className="pagina">
            <span className="etiqueta">COMO FUNCIONA</span>

            <h1>Alimentação e tecnologia em um só lugar.</h1>

            <p>
              O Health Food é um projeto que busca facilitar o acesso
              a informações alimentares, considerando diferentes
              necessidades e preferências.
            </p>

            <div className="cartoes">
              <article className="cartao">
                <span className="icone">👤</span>
                <h2>1. Conhecer as necessidades</h2>
                <p>
                  A proposta é permitir que as pessoas informem suas
                  preferências e restrições alimentares.
                </p>
              </article>

              <article className="cartao">
                <span className="icone">🔎</span>
                <h2>2. Consultar informações</h2>
                <p>
                  Organizar informações sobre alimentos, ingredientes
                  e características relevantes.
                </p>
              </article>

              <article className="cartao">
                <span className="icone">🥗</span>
                <h2>3. Explorar opções</h2>
                <p>
                  Facilitar a exploração de opções alimentares
                  de maneira clara e organizada.
                </p>
              </article>
            </div>

            <div className="aviso">
              <strong>Importante:</strong> as informações apresentadas
              não garantem que um alimento seja seguro para todas as
              pessoas. Sempre confirme ingredientes e alergênicos
              diretamente com o fornecedor.
            </div>
          </section>
        );

      case 'sobre':
        return (
          <section className="pagina">
            <span className="etiqueta">SOBRE O PROJETO</span>

            <h1>Conheça o Health Food.</h1>

            <p>
              O Health Food é um projeto acadêmico que explora como
              a tecnologia pode ajudar as pessoas a consultar
              informações alimentares de forma mais simples.
            </p>

            <div className="cartao destaque">
              <span className="icone">🌿</span>
              <h2>Nossa missão</h2>

              <p>
                Tornar informações alimentares mais organizadas
                e acessíveis, considerando que cada pessoa pode
                ter necessidades diferentes.
              </p>
            </div>

            <h2 className="titulo-secundario">
              Objetivos do projeto
            </h2>

            <ul className="lista">
              <li>Facilitar a consulta de informações sobre alimentos.</li>
              <li>Valorizar a transparência sobre ingredientes.</li>
              <li>Planejar uma experiência acessível e intuitiva.</li>
              <li>Explorar soluções tecnológicas para necessidades alimentares.</li>
            </ul>
          </section>
        );

      case 'app':
        return (
          <section className="pagina">
            <span className="etiqueta">NOSSO APLICATIVO</span>

            <h1>O Health Food no seu celular.</h1>

            <p>
              Estamos planejando uma experiência móvel que facilite
              o acesso às informações alimentares.
            </p>

            <div className="cartoes">
              <article className="cartao">
                <span className="icone">📱</span>
                <h2>Acesso simplificado</h2>
                <p>
                  Uma proposta pensada para facilitar a consulta
                  pelo celular.
                </p>
              </article>

              <article className="cartao">
                <span className="icone">📋</span>
                <h2>Informações organizadas</h2>
                <p>
                  Informações sobre alimentos apresentadas
                  de maneira clara.
                </p>
              </article>

              <article className="cartao">
                <span className="icone">💚</span>
                <h2>Experiência acessível</h2>
                <p>
                  Uma interface planejada para ser simples
                  e fácil de utilizar.
                </p>
              </article>
            </div>

            <div className="aviso">
              <strong>Em desenvolvimento:</strong> o aplicativo ainda
              não possui um link de publicação na Play Store.
              Adicionaremos o endereço oficial quando estiver disponível.
            </div>

            <button
              className="botao botao-principal"
              onClick={() => setTela('inicio')}
            >
              Voltar ao início
            </button>
          </section>
        );

      default:
        return (
          <>
            <section className="hero">
              <div className="hero-conteudo">
                <span className="etiqueta">
                  TECNOLOGIA + ALIMENTAÇÃO
                </span>

                <h1>
                  Alimentação que
                  <span className="texto-verde">
                    {' '}entende você.
                  </span>
                </h1>

                <p>
                  Mais clareza para explorar escolhas alimentares.
                  Conheça o Health Food, um projeto que busca aproximar
                  tecnologia e informação alimentar.
                </p>

                <div className="botoes">
                  <button
                    className="botao botao-principal"
                    onClick={() => setTela('funciona')}
                  >
                    Como funciona →
                  </button>

                  <button
                    className="botao botao-secundario"
                    onClick={() => setTela('sobre')}
                  >
                    Sobre o projeto
                  </button>
                </div>
              </div>

              <div className="ilustracao" aria-hidden="true">
                <div className="circulo">
                  🥑
                </div>

                <span className="selo selo-superior">
                  🥗 Informação
                </span>

                <span className="selo selo-inferior">
                  💚 Consciência
                </span>
              </div>
            </section>

            <section className="pagina">
              <span className="etiqueta">NOSSA PROPOSTA</span>

              <h2>Informação que faz a diferença.</h2>

              <p>
                Escolher alimentos pode ser um desafio para quem
                possui alergias, intolerâncias ou outras necessidades
                alimentares. Queremos explorar como a tecnologia
                pode ajudar nesse processo.
              </p>

              <div className="cartoes">
                <article className="cartao">
                  <span className="icone">🔎</span>
                  <h2>Transparência</h2>
                  <p>
                    Facilitar a consulta de informações sobre
                    ingredientes e alimentos.
                  </p>
                </article>

                <article className="cartao">
                  <span className="icone">🥦</span>
                  <h2>Necessidades diferentes</h2>
                  <p>
                    Considerar diferentes preferências e necessidades
                    alimentares.
                  </p>
                </article>

                <article className="cartao">
                  <span className="icone">📲</span>
                  <h2>Tecnologia</h2>
                  <p>
                    Planejar uma experiência digital simples,
                    organizada e acessível.
                  </p>
                </article>
              </div>
            </section>
          </>
        );
    }
  }

  return (
    <div className="site">
      {/* Cabeçalho compartilhado entre todas as telas. */}
      <header className="cabecalho">
        <button
          className="marca"
          onClick={() => setTela('inicio')}
          aria-label="Ir para o início"
        >
          <span className="marca-icone">🌿</span>

          <span>
            <strong>Health Food</strong>
            <small>Alimentação que entende você</small>
          </span>
        </button>

        <nav className="navegacao" aria-label="Menu principal">
          <button
            className={tela === 'inicio' ? 'ativo' : ''}
            onClick={() => setTela('inicio')}
          >
            Início
          </button>

          <button
            className={tela === 'funciona' ? 'ativo' : ''}
            onClick={() => setTela('funciona')}
          >
            Como funciona
          </button>

          <button
            className={tela === 'sobre' ? 'ativo' : ''}
            onClick={() => setTela('sobre')}
          >
            Sobre o projeto
          </button>

          <button
            className={tela === 'app' ? 'ativo' : ''}
            onClick={() => setTela('app')}
          >
            Conheça o app
          </button>
        </nav>
      </header>

      {/* O React atualiza esta área conforme a tela selecionada. */}
      <main>{renderizarTela()}</main>

      {/* Rodapé compartilhado por toda a aplicação. */}
      <footer className="rodape">
        <div>
          <strong>🌿 Health Food</strong>
          <p>Projeto acadêmico em desenvolvimento.</p>
          <p>
            Confirme sempre os ingredientes e alergênicos
            com o fornecedor.
          </p>
        </div>

        <button
          className="botao-rodape"
          onClick={() => setTela('inicio')}
        >
          Voltar ao início ↑
        </button>
      </footer>
    </div>
  );
}

export default App;