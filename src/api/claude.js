import { calcOp } from "../utils/calculations";
import { cvPct } from "../utils/math";

export const analisarComClaude = async (estudo, operacoes, tol, claudeApiKey, setClaudeAnalise, setClaudeCarregando) => {
  if (!claudeApiKey.trim()) {
    alert("Configure a chave API do Claude na aba CONFIG");
    return;
  }
  setClaudeCarregando(true);
  try {
    const prompt = `Você é um especialista em engenharia industrial e estudo de tempos.

**DADOS DO ESTUDO:**
- Nome: ${estudo.nome || "Sem nome"}
- Analista: ${estudo.analista || "Não informado"}
- Produto: ${estudo.produto || "Não informado"}
- Takt Time: ${estudo.taktTime || 0} s
- Tolerância/Fadiga: ${estudo.tolerancia}%

**OPERAÇÕES CRONOMETRADAS:**
${operacoes.map((op, i) => {
  const c = calcOp(op, tol);
  const temposValidos = op.tempos.filter(v => v > 200);
  const cv = temposValidos.length > 0 ? cvPct(temposValidos).toFixed(1) : "0";
  return `OP${i+1} ${op.nome}: TP=${c?.tpVal?.toFixed(0) || "?"}ms | ${op.tempos.length} obs | CV=${cv}%`;
}).join('\n')}

**ANÁLISE SOLICITADA:**
1. Identifique gargalos (TP > Takt Time)
2. Detecte operações instáveis (CV% > 15%)
3. Avalie o balanceamento de carga
4. Recomendações práticas (SMED, redistribuição, treinamento, etc.)

Seja conciso e prático.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": claudeApiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }
    const data = await response.json();
    const texto = data.content[0].text;
    setClaudeAnalise(texto);
  } catch (error) {
    alert("Erro ao analisar com Claude: " + error.message);
    setClaudeAnalise(null);
  } finally {
    setClaudeCarregando(false);
  }
};
