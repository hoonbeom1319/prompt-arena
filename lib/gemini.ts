import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

export async function generateWithPrompt({
  prompt,
  modelName = 'gemini-1.5-flash',
  temperature = 0.7,
  wrapperText,
}: {
  prompt: string
  modelName?: string
  temperature?: number
  wrapperText?: string | null
}) {
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      temperature,
    },
  })

  const fullPrompt = wrapperText
    ? wrapperText.replace('{{prompt}}', prompt)
    : prompt

  const result = await model.generateContent(fullPrompt)
  const response = result.response
  const text = response.text()

  return text
}

export async function generateChallengeDraft(topic: string): Promise<{
  title: string
  instruction: string
}> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      temperature: 0.8,
      responseMimeType: 'application/json',
    },
  })

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

  const result = await model.generateContent(prompt)
  const text = result.response.text()

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
