import { exportInstrucoes } from "../../utils/export/exportSpecial";
import { logoDataUrl } from "../../utils/export/exportUtils";

export default function TabInstrucoes({ C, btnR }) {
  return (
    <div style={{maxWidth:820,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:24,flexWrap:"wrap"}}>
        <img src={logoDataUrl} alt="RitmoProd" style={{height:48,borderRadius:6}}/>
        <div style={{flex:1}}>
          <div style={{fontSize:18,fontWeight:900,color:C.txt}}>Manual de Uso — RitmoProd</div>
          <div style={{fontSize:11,color:C.muted,marginTop:2}}>Estudo de Tempos e Movimentos · Engenharia Industrial</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={exportInstrucoes} style={{...btnR,background:"#c0392b"}}>🖨 Imprimir</button>
          <button onClick={exportInstrucoes} style={{...btnR,background:"#1a7a4a"}}>💾 Salvar PDF</button>
        </div>
      </div>

      {/* Seção COMO COMEÇAR */}
      <div style={{background:`${C.grn}12`,border:`1px solid ${C.grn}44`,borderRadius:10,padding:"18px 22px",marginBottom:20}}>
        <div style={{fontSize:13,fontWeight:900,color:C.grn,marginBottom:14,letterSpacing:0.5}}>🚀 COMO COMEÇAR — 3 PASSOS</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:10}}>
          {[
            {num:"1",t:"Crie um estudo",d:"Vá para ① CONFIG. Preencha nome, analista, tolerância e cadastre as operações da linha.",c:C.red},
            {num:"2",t:"Cronometrize as operações",d:"Vá para ② CAPTURA. Clique ▶ INICIAR e pressione ESPAÇO a cada ciclo. Registre paradas com ⏸ PAUSAR.",c:"#7c3aed"},
            {num:"3",t:"Veja o relatório",d:"Vá para ③ RELATÓRIO. Analise TO, TN, TP, CV%, CAP/H e exporte PDF ou Excel.",c:"#0369a1"},
          ].map(p=>(
            <div key={p.num} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`4px solid ${p.c}`,borderRadius:"0 8px 8px 0",padding:"12px 14px"}}>
              <div style={{fontSize:22,fontWeight:900,color:p.c,lineHeight:1,marginBottom:6}}>{p.num}</div>
              <div style={{fontSize:12,fontWeight:800,color:C.txt,marginBottom:4}}>{p.t}</div>
              <div style={{fontSize:10,color:C.muted,lineHeight:1.6}}>{p.d}</div>
            </div>
          ))}
        </div>
      </div>

      {[
        {
          num:"①", titulo:"CONFIG — Configurar o Estudo",
          cor:C.red,
          itens:[
            ["Nome / Produto / Analista","Identifique o estudo. Esses dados aparecem no cabeçalho de todos os relatórios impressos e no nome dos arquivos exportados."],
            ["Tolerância %","Fator de fadiga aplicado ao TN para gerar o TP. Fórmula: TP = TN × (1 + Tol/100). Valores típicos: 10–15%."],
            ["Meta de observações","Mínimo de cronometragens por operação. Recomendado: ≥ 10. Fórmula de Nievel: n ≈ (1,96 × CV% / 5)²."],
            ["Calculadora Takt Time","Informe a Quantidade a Produzir (peças/dia) e o Tempo Disponível (s/dia). O sistema calcula Takt = Tempo ÷ Quantidade. Clique APLICAR para salvar. Os valores ficam salvos por estudo — não se apagam ao trocar de aba."],
            ["Takt Time (s)","Ritmo exigido. Pode ser digitado diretamente ou calculado pela calculadora. Usado no Yamazumi, balanceamento e dimensionamento."],
            ["Tempo Disponível / OEE","Tempo disponível (min/turno), peças produzidas e peças rejeitadas alimentam o cálculo do OEE no RELATÓRIO."],
            ["Operações","Cadastre cada operação com nome e FR%. FR% = 100% = ritmo normal. Pressione Enter ou clique ADD. Use ✕ para excluir."],
          ]
        },
        {
          num:"②", titulo:"CAPTURA — Cronometrar os Tempos",
          cor:"#7c3aed",
          itens:[
            ["▶ INICIAR / ▶ CONTINUAR","Inicia a cronometragem. Se já houver dados, continua adicionando observações às existentes."],
            ["↺ Apagar captura","Botão ↺ ao lado de cada operação com dados. Apaga todos os tempos, paradas e marcação de rodada (pede confirmação)."],
            ["⚑ R2 — Marcar Rodada 2","Botão verde na lista. Clique após coletar a Rodada 1 para separar as coletas em dois blocos (ex: antes e depois de melhoria, turno manhã vs tarde). Tempos exibem badge R1 (verde) e R2 (amarelo)."],
            ["⚑ R2 ✕ — Remover","Botão amarelo: remove a separação, unificando todos os tempos novamente."],
            ["Botão REG (grande)","Registra o tempo decorrido como nova observação. Atalho: ESPAÇO."],
            ["⏸ PAUSAR","Abre formulário de parada. Motivos: Puxar Pilha, Abastecer Isomantas, Troca de Plástico, Falta de Material, Setup, Falta de Peças, Outro. Atalho: P."],
            ["■ FIM","Encerra a captura e volta à lista. Botão vermelho e grande para fácil uso no celular. Atalho: ESC."],
            ["Modo Sequencial","Percorre todas as operações em ordem automaticamente. Ideal para linha de produção contínua."],
            ["Tempos coletados","Lista com número e valor de cada tempo. Badge R1/R2 quando há rodada marcada. Clique ✕ para excluir um tempo individual."],
          ]
        },
        {
          num:"③", titulo:"RELATÓRIO — Analisar os Resultados",
          cor:"#0369a1",
          itens:[
            ["TO (Tempo Observado)","Média dos tempos válidos (>200ms). Tempos abaixo de 200ms são ignorados como erro de toque."],
            ["TN (Tempo Normal)","TO × FR/100. Normaliza para operador em ritmo padrão. Ex: TO=10s, FR=110% → TN=11s."],
            ["TP (Tempo Padrão)","TN × (1 + Tol/100). Tempo oficial para planejamento. Ex: TN=11s, Tol=15% → TP=12,65s."],
            ["CV% (Coef. de Variação)","DP ÷ Média × 100. Estabilidade: ≤10% bom · 10–20% atenção · >20% instável."],
            ["CAP/H","3.600 ÷ TP(s). Peças por hora. Ex: TP=12s → 300 pçs/h."],
            ["OEE","Disponibilidade × Desempenho × Qualidade. Requer Tempo Disponível, Peças Produzidas e Rejeitadas na CONFIG."],
            ["Exportar PDF / Excel / Folha","PDF A4 landscape: relatório completo. Excel: 4 abas (Consolidado, Tempos, Paradas, Sugestões). Folha: A4 landscape em branco para coleta manual."],
          ]
        },
        {
          num:"④", titulo:"SUGESTÕES — Melhorias Automáticas",
          cor:C.ylw,
          itens:[
            ["Alta prioridade","CV% > 20% ou ≥ 3 paradas. Ação imediata: Ishikawa, SMED, TPM, revisão do MOP."],
            ["Média prioridade","CV% 10–20%, 1–2 paradas, TP elevado ou total parado > 10 min. Oportunidade de melhoria."],
            ["Baixa prioridade","Menos de 10 observações coletadas. Coletar mais dados para validade estatística."],
            ["Ações sugeridas","SMED (setup), TPM (manutenção), CEP (controle estatístico), Kanban (abastecimento), treinamento de operadores."],
          ]
        },
        {
          num:"⑤", titulo:"PADRÕES — Análise Estatística Avançada",
          cor:C.grn,
          itens:[
            ["Carta de Controle (±3σ)","Gráfico com todas as observações em sequência. UCL = Média + 3σ (vermelho), LCL = Média − 3σ (azul). Pontos fora = vermelho."],
            ["Sobreposição R1/R2","Com Rodada 2 marcada, o gráfico sobrepõe as duas rodadas: R1 em verde, R2 em amarelo, com linha de média tracejada para cada uma."],
            ["Comparativo de Rodadas","Bloco no topo: TO Méd, TP e CV% de cada rodada lado a lado, delta % (▼ GANHO / ▲ PERDA) e ganho em capacidade (pçs/h)."],
            ["Tendência","↑ CRESCENTE = fadiga · ↓ DECRESCENTE = aprendizado · → ESTÁVEL. R² > 0,5 = tendência significativa."],
            ["Δ 1ª→2ª Metade","Compara média da 1ª com a 2ª metade. Positivo = fadiga. Negativo = aprendizado/aquecimento."],
            ["Exportar PDF / Excel","PDF A4 landscape com tabela estatística completa. Excel com abas Padrões e Tempos Coletados."],
          ]
        },
        {
          num:"⑥", titulo:"YAMAZUMI — Balanceamento de Linha",
          cor:"#0891b2",
          itens:[
            ["Gráfico de barras","TP de cada operação em barras horizontais. Linha amarela vertical = Takt Time. Barras vermelhas = gargalos."],
            ["Capacidade esperada vs real","Esperada = 3600 ÷ Takt. Real = 3600 ÷ TP do gargalo. Atingimento % e déficit/superávit em pçs/h."],
            ["Balanceamento automático","Agrupa operações em estações respeitando o Takt (First Fit Decreasing). Mostra ocupação % de cada estação."],
            ["Eficiência da linha","Σ TP ÷ (N° estações × Takt) × 100. Meta: > 85%. Baixo = redistribuir operações."],
            ["Exportar PDF / Excel","PDF A4 landscape com gráfico, tabela de TPs e balanceamento. Excel com abas Yamazumi e Balanceamento."],
          ]
        },
        {
          num:"⑦", titulo:"OPERADORES — Dimensionamento",
          cor:"#7c3aed",
          itens:[
            ["Fórmula","N° ops = Σ TP ÷ Takt Time. Requer Takt Time definido na CONFIG."],
            ["Eficiência com esse número","(Resultado exato ÷ Arredondado) × 100. Ex: precisa 3,2 → arredonda para 4 → eficiência = 80%."],
            ["Comparador","Informe quantos operadores tem hoje. O sistema calcula excesso/falta e eficiência real com esse número."],
            ["Exportar PDF","Relatório A4 portrait com fórmula, resultado, tabela por operação e análise comparativa."],
          ]
        },
        {
          num:"⑧", titulo:"ANTES/DEPOIS — Comparativo de Melhoria",
          cor:"#7c3aed",
          itens:[
            ["Fluxo recomendado","1. Crie o estudo original e colete os tempos. 2. Clique ⧉ DUPLICAR ESTUDO na aba CONFIG — gera cópia com nome v2. 3. Abra o estudo v2 e ajuste tempos/processo após a melhoria. 4. Acesse a aba ⑧ ANTES/DEPOIS. 5. Selecione o estudo original como ANTES e o v2 como DEPOIS para ver o comparativo."],
            ["⧉ Duplicar Estudo","Botão azul na aba CONFIG. Cria cópia do estudo atual com nome automático (ex: Linha Embalagem → Linha Embalagem v2 → v3). Todos os dados e tempos são copiados. O duplicado aparece na lista principal."],
            ["Seleção ANTES/DEPOIS","Na aba ⑧, clique ANTES (vermelho) no estudo de referência e DEPOIS (verde) no estudo melhorado. O painel superior confirma a seleção."],
            ["Painel de comparação","Aparece automaticamente quando os dois estudos estão selecionados. Mostra badges de melhoria de tempo, redução de operadores e ganho de eficiência."],
            ["Tabela comparativa","Exibe linha a linha: TP Antes · TP Depois · Δ% · CAP/H Antes · CAP/H Depois · Status (↑ melhora / ↓ piora)."],
            ["Δ% (variação)","Negativo = melhoria (tempo reduziu, capacidade aumentou). Positivo = piora. Verde = ganho, vermelho = perda."],
            ["Exportar PDF","Botão ⎙ EXPORTAR PDF A4: gera relatório A4 portrait com cabeçalho, tabela comparativa, KPIs e rodapé."],
          ]
        },
        {
          num:"⊕", titulo:"Dicas Gerais e Backup",
          cor:C.muted,
          itens:[
            ["FR% (Fator de Ritmo)","85% = muito lento · 95% = levemente abaixo · 100% = normal · 110% = acima. FR errado distorce todo o estudo."],
            ["Backup JSON","Tela inicial → ↓ EXPORTAR JSON: salva todos os estudos. ↑ IMPORTAR JSON: restaura. Faça backup antes de trocar de computador."],
            ["Pendrive / Auto-save","Vincule o pendrive pelo botão VINCULAR PENDRIVE na tela inicial. O app salva automaticamente no arquivo ritmoprod-dados.json após cada alteração."],
            ["Dados locais","Os dados ficam no localStorage do navegador da máquina. Use backup JSON ou vincule o pendrive para não perder dados."],
            ["Comparar estudos","Tela inicial → ⇄ COMPARAR: selecione 2 estudos para tabela comparativa lado a lado."],
            ["Folha de coleta","RELATÓRIO → 📋 FOLHA: A4 landscape em branco para coleta manual no chão de fábrica."],
          ]
        },
      ].map(sec=>(
        <div key={sec.num} style={{background:C.card,border:`1px solid ${C.brd}`,borderLeft:`4px solid ${sec.cor}`,borderRadius:"0 8px 8px 0",padding:"16px 20px",marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
            <span style={{background:sec.cor,color:"#fff",fontWeight:900,fontSize:13,padding:"2px 10px",borderRadius:3}}>{sec.num}</span>
            <span style={{fontSize:14,fontWeight:800,color:C.txt}}>{sec.titulo}</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {sec.itens.map(([label,desc])=>(
              <div key={label} style={{display:"flex",gap:12,alignItems:"flex-start",fontSize:12}}>
                <span style={{color:sec.cor,fontWeight:700,whiteSpace:"nowrap",minWidth:160,flexShrink:0}}>{label}</span>
                <span style={{color:C.muted,lineHeight:1.6}}>{desc}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{marginTop:8,padding:"12px 16px",background:C.card,border:`1px solid ${C.brd}`,borderRadius:8,fontSize:10,color:C.muted,textAlign:"center",lineHeight:1.8}}>
        Desenvolvido por <strong style={{color:C.txt}}>Oderli Sergio Garcia</strong> &amp; <strong style={{color:C.red}}>Claude (Anthropic)</strong><br/>
        RitmoProd IE · Estudo de Tempos e Movimentos
      </div>
    </div>
  );
}
