import { GoogleGenAI } from '@google/genai'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! })

export async function generateWithPrompt({
  prompt,
  modelName = 'gemini-2.5-flash',
  temperature = 0.7,
  wrapperText,
}: {
  prompt: string
  modelName?: string
  temperature?: number
  wrapperText?: string | null
}) {
  const fullPrompt = wrapperText
    ? wrapperText.includes('{{prompt}}')
      ? wrapperText.replaceAll('{{prompt}}', prompt)
      : `${wrapperText}\n\n${prompt}`
    : prompt

  const response = await ai.models.generateContent({
    model: modelName,
    contents: fullPrompt,
    config: {
      temperature,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  })

  return response.text ?? ''
}

// AI 중립 요약 (PRD v1.1 4.6.4) — 평가가 아닌 색인.
// 시스템 프롬프트에 "평가 금지"를 명시해 앵커링(점수·우열 암시로 투표 쏠림)을 차단한다.
// 챌린지 주제는 참고 맥락으로만 제공한다 — 같은 주제의 출품작끼리는 "무엇을 다뤘는지"가
// 동어반복이 되므로, 주제를 알아야 주제 *내에서의 접근 각도*를 색인할 수 있다.
// 단, 주제 부합 여부·충실도 판단은 우열 암시(점수의 우회 표현)라 명시적으로 금지한다.
export const generateNeutralSummary = async (
  resultText: string,
  topic?: { title: string; instruction: string } | null,
): Promise<string> => {
  const contents = topic
    ? `[챌린지 주제 — 참고 맥락]\n제목: ${topic.title}\n지시문: ${topic.instruction}\n\n[요약할 글]\n${resultText}`
    : resultText

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents,
    config: {
      systemInstruction:
        '너는 평가자가 아니라 색인 작성자다. 주어진 글의 객관적 특징만 묘사하라: '
        + '무엇을 다뤘는지, 접근·구조, 길이·톤·형식. '
        + '가치판단·우열·칭찬·비판·점수·추천은 절대 금지다. '
        + '("잘 썼다", "인상적", "아쉽다" 같은 표현 금지) '
        + '챌린지 주제가 주어지면 참고 맥락으로만 쓴다: 주제를 그대로 되풀이하지 말고, '
        + '주제 안에서 이 글이 택한 각도·초점을 묘사하라. '
        + '주제 부합 여부·충실도에 대한 언급("주제를 잘 반영", "주제와 동떨어짐" 류)은 절대 금지다. '
        + '한국어 1~2문장, 80자 이내로만 답하라. '
        + '예: "단계별 설명형, 약 300자, 격식체. 예산 중심의 일정 구성에 초점"',
      temperature: 0.2,
      maxOutputTokens: 200,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  })

  return (response.text ?? '').trim()
}

export async function generateChallengeDraft(topic: string): Promise<{
  title: string
  instruction: string
}> {
  const prompt = `
당신은 AI 프롬프트 대회 기획자입니다.
주제: "${topic}"

이 주제로 프롬프트 대회 챌린지를 만들어주세요.
참가자들이 AI에게 보낼 프롬프트를 작성하는 대회입니다.

JSON 형식으로 응답해주세요:
{
  "title": "챌린지 제목 (20자 이내)",
  "instruction": "챌린지 설명 및 규칙 (100-200자, 참가자들이 어떤 프롬프트를 작성해야 하는지 명확하게)"
}
`

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: {
      temperature: 0.8,
      responseMimeType: 'application/json',
      thinkingConfig: {
        thinkingBudget: 0,
      },
    },
  })

  const text = response.text ?? ''

  try {
    const parsed = JSON.parse(text)
    return {
      title: parsed.title || topic,
      instruction: parsed.instruction || `${topic}에 관한 최고의 프롬프트를 작성해주세요.`,
    }
  } catch {
    return {
      title: topic,
      instruction: `${topic}에 관한 최고의 프롬프트를 작성해주세요.`,
    }
  }
}
