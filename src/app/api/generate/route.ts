import Anthropic from "@anthropic-ai/sdk";
import { NextRequest } from "next/server";

const client = new Anthropic();

const SYSTEM_PROMPT = `You are an expert web developer. When given a description of a website, generate a complete, self-contained HTML file that includes:
- All CSS in a <style> tag in the <head>
- All JavaScript in a <script> tag before </body>
- No external dependencies (use inline SVG for icons, CSS animations for effects)
- Modern, responsive design with clean aesthetics
- Fully working interactive features as described

Output ONLY the raw HTML — no markdown, no code fences, no explanation. Start with <!DOCTYPE html> and end with </html>.`;

export async function POST(req: NextRequest) {
  const { prompt } = await req.json();

  if (!prompt?.trim()) {
    return new Response("Prompt is required", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = client.messages.stream({
          model: "claude-opus-4-8",
          max_tokens: 16000,
          thinking: { type: "enabled", budget_tokens: 8000 },
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: prompt }],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Generation failed";
        controller.enqueue(encoder.encode(`\n<!-- ERROR: ${msg} -->`));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
