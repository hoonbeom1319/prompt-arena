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
