"use strict";
(function(){
  function patchAbout(){
    const overlay=document.querySelector('.about-app-overlay');
    const content=overlay&&overlay.querySelector('.about-app-content');
    if(!content||content.dataset.wosvipUpdated==='1')return;
    content.dataset.wosvipUpdated='1';
    content.innerHTML=`
      <section class="about-app-hero">
        <strong>WOSVIP Calculadora PRO®</strong>
        <p>Calculadora científica instalável com modo monetário, reconhecimento matemático por câmera e resolução passo a passo.</p>
        <a class="about-app-link" href="https://github.com/wosvip/wosvip-calculadora-pro" target="_blank" rel="noopener">Conheça o projeto e assista aos vídeos</a>
      </section>

      <section>
        <h3>Sobre o projeto</h3>
        <p>A WOSVIP Calculadora PRO reúne cálculo científico, recursos financeiros e ferramentas de estudo em uma interface inspirada em calculadoras físicas. Funciona no navegador e pode ser instalada como PWA no Windows, Android e tablets compatíveis.</p>
      </section>

      <section>
        <h3>Recursos científicos</h3>
        <ul>
          <li>Operações básicas, porcentagem, parênteses, troca de sinal e resultado instantâneo.</li>
          <li>Potências, raízes quadrada, cúbica e de índice variável.</li>
          <li>Seno, cosseno, tangente e funções inversas em <strong>DEG</strong> ou <strong>RAD</strong>.</li>
          <li>Logaritmos, exponenciais, fatorial, combinações, permutações e módulo.</li>
          <li>Integral definida, derivada numérica, limites, somatório Σ e produtório Π.</li>
          <li>Equações de 1º e 2º graus, números complexos, memória e histórico.</li>
        </ul>
      </section>

      <section>
        <h3>Resolução matemática passo a passo</h3>
        <p>A seta <strong>▼</strong> abre uma resolução didática adaptada ao tipo de cálculo. O aplicativo já possui tratamento específico para:</p>
        <ul>
          <li><strong>Potências:</strong> 12² = 12 × 12 = 144.</li>
          <li><strong>Trigonometria:</strong> sin(22,5) respeita o modo DEG ou RAD e informa qual unidade angular foi usada.</li>
          <li><strong>Somatório:</strong> Σ X=1…4 (X) = 1 + 2 + 3 + 4 = 10.</li>
          <li><strong>Produtório:</strong> Π X=1…4 (X) = 1 × 2 × 3 × 4 = 24.</li>
          <li><strong>Equação do 2º grau:</strong> identifica a, b e c, calcula Δ, aplica Bhaskara, verifica as raízes e gera o gráfico da parábola.</li>
          <li><strong>Integral definida:</strong> mostra a regra usada, a primitiva, a aplicação dos limites e a forma exata quando disponível.</li>
        </ul>
      </section>

      <section>
        <h3>Exemplo de integral definida</h3>
        <p>Para ∫[0,2] 2X² dX, a resolução mostra:</p>
        <p><strong>∫ 2X² dX = 2 · X³ / 3 = (2/3)X³</strong></p>
        <p>Depois aplica F(2) − F(0) e chega a <strong>16/3 = 5,333333333333</strong>.</p>
      </section>

      <section>
        <h3>Modo monetário inteligente</h3>
        <p>Com <strong>SHIFT + DRG</strong>, é possível selecionar Real, Dólar, Euro ou Libra. O símbolo e os separadores seguem a moeda escolhida.</p>
        <p>Exemplo financeiro: <strong>R$ 5.000 × 30%</strong> mostra primeiro <strong>R$ 1.500,00</strong>. Em seguida, o usuário escolhe <strong>+</strong> ou <strong>−</strong> para adicionar ou subtrair esse percentual do valor-base.</p>
      </section>

      <section>
        <h3>Reconhecimento matemático pela câmera</h3>
        <p>A câmera permite fotografar uma expressão, revisar o reconhecimento e inserir a fórmula no visor. A revisão manual continua disponível antes do cálculo para corrigir qualquer caractere reconhecido incorretamente.</p>
      </section>

      <section>
        <h3>Limites e observações</h3>
        <ul>
          <li>Algumas operações avançadas são resolvidas numericamente; resultados podem apresentar pequenas aproximações de ponto flutuante.</li>
          <li>Somatórios e produtórios exigem limites inteiros válidos e possuem proteção contra intervalos excessivamente grandes.</li>
          <li>Fatorial numérico é limitado a valores inteiros não negativos compatíveis com a precisão do JavaScript.</li>
          <li>Limites e derivadas numéricas dependem da estabilidade da função próxima ao ponto analisado.</li>
          <li>O reconhecimento por câmera pode exigir internet na primeira utilização para carregar o modelo matemático.</li>
          <li>Para cálculos críticos, confirme a expressão digitada e a resolução apresentada.</li>
        </ul>
      </section>

      <section>
        <h3>Funcionamento e privacidade</h3>
        <p>Depois do carregamento inicial, a interface e o motor principal podem funcionar offline conforme o cache do navegador. Cálculos, memória, histórico e preferências permanecem localmente no dispositivo.</p>
      </section>
    `;
  }
  const observer=new MutationObserver(patchAbout);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  patchAbout();
})();