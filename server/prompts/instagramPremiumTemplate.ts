export const INSTAGRAM_PREMIUM_TEMPLATE = `# PROMPT — INSTAGRAM PREMIUM MODERNO (ANTI-SURREAL / LAYOUT FIXO)

Crie uma arte profissional para Instagram no formato 1:1 (1080x1080) inspirada em criativos modernos premium de marcas high-end.

A composição deve parecer uma peça real de marketing feita por designer profissional para redes sociais, com aparência elegante, limpa e comercial.

Evite visual surreal, exageradamente futurista ou conceitos abstratos sem contexto.

---

# CONTEXTO

Nicho: "{NICHO}"

Objetivo: "{OBJETIVO_DA_MENSAGEM}"

Transmitir claramente a mensagem com percepção de valor elevada, aparência premium e foco em conversão.

---

# DIREÇÃO VISUAL

Estilo visual:

"{ESTILO_VISUAL}"

Combinação:

"{TIPO_DE_RENDER}"

Emoção:

"{EMOCAO}"

Iluminação:

"{TIPO_ILUMINACAO}"

A estética deve seguir:

- visual contemporâneo de Instagram
- high-end marketing design
- clean
- sofisticado
- minimalista
- editorial
- UI inspired
- glass morphism discreto
- tecnologia sutil
- aparência real

Evitar:

- elementos flutuando aleatoriamente
- sci-fi exagerado
- objetos sem função
- excesso de hologramas
- excesso de glow
- composições fantasiosas

Tudo deve parecer plausível, comercial e feito para campanhas reais.

---

# FUNDO

Criar fundo premium usando:

"{CORES_PRINCIPAIS}"

Aplicar:

- gradiente escuro suave
- profundidade realista
- iluminação difusa
- contraste leve
- sombras suaves

Adicionar um overlay degradê escuro translúcido semelhante a campanhas premium imobiliárias.

Características:

- iniciar transparente
- aumentar gradualmente
- mais forte no rodapé
- aparência cinematográfica
- transição suave

Objetivo:

dar legibilidade ao conteúdo e destacar a futura logo.

O degradê deve ocupar aproximadamente:

30–40% inferiores da composição

aumentando progressivamente a opacidade.

---

# ÁREA RESERVADA PARA LOGO (REGRA CRÍTICA)

Reservar totalmente o canto:

INFERIOR ESQUERDO

Criar área de segurança:

- 25–30% largura
- 20–25% altura

Nesta região é PROIBIDO:

- textos
- ícones
- botões
- objetos
- personagens
- elementos 3D
- linhas fortes
- partículas
- brilhos
- efeitos chamativos
- formas grandes
- destaques

Permitir somente:

gradiente escuro suave.

Objetivo:

criar espaço limpo para aplicação posterior da logo.

NUNCA gerar:

- logotipo
- marca
- símbolo
- assinatura
- watermark

---

# CENÁRIO

Caso faça sentido:

"{CENARIO_REALISTA}"

Utilizar cenários plausíveis:

Exemplos:

- escritório moderno
- ambiente corporativo
- casa sofisticada
- setup tecnológico
- ambiente médico
- lifestyle premium
- ambiente digital minimalista

Evitar:

- ambientes irreais
- cidades futuristas
- cenários abstratos
- excesso de elementos

---

# PERSONAGEM (OPCIONAL)

"{DESCRICAO_PERSONAGEM}"

Caso exista personagem:

- postura natural
- aparência premium
- visual editorial
- proporções reais
- expressão discreta

Evitar:

- poses artificiais
- exageros
- aparência claramente gerada por IA

---

# ELEMENTOS 3D

Adicionar poucos elementos relacionados ao nicho:

"{NICHO}"

Exemplos:

Fintech:

- gráficos sutis
- linhas financeiras

IA:

- estruturas neurais
- UI tecnológica discreta

Imobiliário:

- arquitetura
- estruturas modernas

Travel:

- localização
- mapas minimalistas

Educação:

- UI elegante
- símbolos discretos

Estilo:

- vidro translúcido
- acrílico premium
- soft glow
- baixa opacidade
- integração natural

Limite:

máximo 2–4 elementos

Nunca competir com o conteúdo principal.

---

# ESTRUTURA GRÁFICA

Inspirado no layout da referência:

Adicionar:

- bordas finas arredondadas
- linhas translúcidas suaves
- molduras minimalistas
- containers modernos
- elementos UI discretos

As linhas devem:

- apoiar a composição
- criar organização visual
- parecer premium

Evitar:

- linhas pesadas
- excesso de molduras
- excesso de elementos gráficos

---

# HIERARQUIA

Subtítulo pequeno acima:

"{SUBTITULO}"

Título principal dominante:

"{TITULO}"

Tipografia:

- sans-serif moderna
- elegante
- forte contraste
- extremamente legível

Destacar:

"{PALAVRA_CHAVE_DESTACADA}"

Cor:

"{COR_DESTAQUE}"

O destaque deve ser sofisticado.

Evitar cores excessivamente saturadas.

---

# ESTILO FINAL

- ultra realistic quando aplicável
- premium marketing design
- editorial
- clean layout
- soft glow
- realismo comercial
- glass morphism discreto
- UI/UX inspired
- composição premium Instagram

---

# RESTRIÇÕES

Sem poluição visual

Sem excesso de elementos

Sem surrealismo

Sem sci-fi exagerado

Sem objetos aleatórios

Sem hologramas excessivos

Sem logos

Sem marcas

Sem watermark

Sem tipografia quebrada

Sem invadir área reservada da logo

Sem elementos chamativos no canto inferior esquerdo

Sempre parecer uma campanha real de Instagram feita por designer profissional.

---

# PARÂMETROS

--ar 1:1 --v 6 --style raw

Negativo:

--no logo, brand mark, watermark, distorted text, clutter, futuristic city, floating objects, excessive holograms, sci-fi, chaos, visual noise`;

export function fillTemplate(template: string, vars: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(vars)) {
    result = result.replaceAll(`{${key}}`, value);
  }
  return result;
}
