import { NextRequest, NextResponse } from 'next/server'
import { OpenAI } from 'openai'

export async function POST(request: NextRequest) {
  try {
    const { content, customQuery } = await request.json()

    // Initialize OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OpenAI API key not configured' }, { status: 500 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const researchQuery = customQuery || `Help me explore this idea deeper with actual research, proven frameworks, scientific studies, and credible sources.`

    const prompt = `
${customQuery ? `Research request: ${customQuery}` : 'Help me explore this idea deeper with actual research, proven frameworks, scientific studies, and credible sources.'}

Content to research:
${content}

Provide research insights, credible sources, scientific studies, proven frameworks, and real-world examples that relate to this content. Include:

1. **Relevant Studies & Research**: Actual scientific studies, research papers, or credible reports that support or challenge the ideas
2. **Frameworks & Models**: Proven frameworks, mental models, or methodologies related to the topic
3. **Statistics & Data**: Real statistics, data points, or metrics from credible sources
4. **Expert Insights**: Quotes or findings from recognized experts in the field
5. **Case Studies**: Real-world examples or case studies that illustrate the concepts

For each insight, provide:
- The specific finding, framework, or insight
- The source (author, study, organization)
- Why it's relevant to the content

Return as a JSON array:
[
  {
    "type": "study" | "framework" | "statistic" | "insight",
    "content": "The actual research finding or insight (2-3 sentences)",
    "source": "Author/Organization/Study name",
    "url": "URL if available (optional)"
  }
]

Focus on credible, verifiable sources. Provide 5-8 highly relevant research insights.
`

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a research assistant that finds credible sources, scientific studies, proven frameworks, and expert insights related to the user\'s content. Always cite sources and provide verifiable information. Return only valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.7,
    })

    let results = []
    try {
      const responseContent = response.choices[0]?.message?.content
      if (responseContent) {
        results = JSON.parse(responseContent)
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError)
      // Return empty array if parsing fails
      results = []
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Research error:', error)
    return NextResponse.json({ 
      error: 'Failed to research topic',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
