/**
 * Calls the AI provider and returns parsed JSON.
 *
 * Strategy:
 *  1. Admin settings saved in the EverShop setting table.
 *  2. Environment fallback for existing deployments.
 *  3. Gemini CLI fallback for local development only.
 */
import { execFile } from 'child_process';
import { existsSync } from 'fs';
import { buildSystemPrompt, buildUserPrompt } from './buildAiPrompt.js';
import type { AiPromptOptions } from './buildAiPrompt.js';
import {
  getEffectiveAiDescriptionSettings,
  type EffectiveAiDescriptionSettings
} from './settings.js';

export interface AiGeneratedProduct {
  name: string;
  short_description: string;
  url_key: string;
  meta_title: string;
  meta_description: string;
  sections: AiSection[];
  gallery_images: string[];
  video_embeds: string[];
}

export type AiSection =
  | {
      type: 'introduction' | 'paragraph';
      heading?: string;
      content: string;
    }
  | {
      type: 'features';
      heading?: string;
      items: string[];
    }
  | {
      type: 'specifications';
      heading?: string;
      specs: Record<string, string>;
    };

/**
 * Main entry point — picks the best available provider.
 */
export async function callAiProvider(
  options: AiPromptOptions,
  configuredSettings?: EffectiveAiDescriptionSettings
): Promise<AiGeneratedProduct> {
  const settings =
    configuredSettings || (await getEffectiveAiDescriptionSettings());

  if (!settings.enabled) {
    throw new Error('Le générateur IA est désactivé dans les paramètres.');
  }

  if (settings.apiKey && !settings.apiKey.includes('your-')) {
    if (settings.provider === 'gemini') {
      return callGeminiApi(options, settings);
    }
    return callOpenAiCompatible(options, settings);
  }

  const geminiBin = findGeminiBinary();
  if (geminiBin) {
    return callGeminiCli(options, geminiBin);
  }

  throw new Error(
    'Aucune clé API IA configurée. Ajoutez la clé dans Paramètres > IA description produit.'
  );
}

// ─── Google Gemini REST API ─────────────────────────────────────────────────
//
// Works everywhere (local + production). Free tier: 15 req/min, 1M tokens/day.
// Get a key at: https://ai.google.dev/gemini-api/docs/api-key
//
// Env vars:
//   GEMINI_API_KEY=AIzaSy...
//   GEMINI_MODEL=gemini-2.0-flash          (optional, default: gemini-2.0-flash)

async function callGeminiApi(
  options: AiPromptOptions,
  settings: EffectiveAiDescriptionSettings
): Promise<AiGeneratedProduct> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(options);
  const baseUrl = settings.baseUrl.replace(/\/+$/, '').replace(/\/openai$/i, '');
  const model = settings.model.replace(/^models\//i, '');

  const res = await fetch(
    `${baseUrl}/models/${model}:generateContent?key=${settings.apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: userPrompt }]
          }
        ],
        generationConfig: {
          temperature: settings.temperature,
          maxOutputTokens: settings.maxTokens,
          responseMimeType: 'application/json'
        }
      })
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Erreur API Gemini (${res.status}): ${errorBody.slice(0, 500)}`
    );
  }

  const json = await res.json();

  // Check for blocked content
  if (json.promptFeedback?.blockReason) {
    throw new Error(
      `Contenu bloqué par Gemini: ${json.promptFeedback.blockReason}`
    );
  }

  const content =
    json.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    throw new Error('Réponse vide de Gemini');
  }

  return parseAiResponse(content);
}

// ─── OpenAI-compatible API ──────────────────────────────────────────────────
//
// Works with OpenAI, Groq, Mistral, Together, any OpenAI-compatible endpoint.
//
// Env vars:
//   OPENAI_API_KEY=sk-...       or  AI_DESCRIPTION_API_KEY=sk-...
//   AI_DESCRIPTION_MODEL=gpt-4o                (optional)
//   AI_DESCRIPTION_BASE_URL=https://api.openai.com/v1  (optional)

async function callOpenAiCompatible(
  options: AiPromptOptions,
  settings: EffectiveAiDescriptionSettings
): Promise<AiGeneratedProduct> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(options);
  const baseUrl = settings.baseUrl.replace(/\/+$/, '');

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: settings.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: settings.temperature,
      max_tokens: settings.maxTokens,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Erreur API IA (${res.status}): ${errorBody.slice(0, 500)}`
    );
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Réponse vide de l'API IA");
  }

  return parseAiResponse(content);
}

// ─── Gemini CLI (local dev fallback) ────────────────────────────────────────
//
// Uses the locally installed `gemini` CLI with your OAuth session.
// Only works when Gemini CLI is installed + authenticated.
// NOT suitable for production servers.

function findGeminiBinary(): string | null {
  const candidates = [
    process.execPath.replace(/\/node$/, '/gemini'),
    '/home/ilyes/.nvm/versions/node/v20.20.0/bin/gemini'
  ];
  for (const bin of candidates) {
    if (existsSync(bin)) {
      return bin;
    }
  }
  return null;
}

async function callGeminiCli(
  options: AiPromptOptions,
  geminiBin: string
): Promise<AiGeneratedProduct> {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(options);

  const fullPrompt = `${systemPrompt}\n\n---\n\n${userPrompt}`;

  const raw = await new Promise<string>((resolve, reject) => {
    execFile(
      geminiBin,
      ['-p', fullPrompt],
      {
        maxBuffer: 1024 * 1024 * 5,
        timeout: 120_000,
        env: { ...process.env, NODE_NO_WARNINGS: '1' }
      },
      (error, stdout, stderr) => {
        if (error) {
          reject(
            new Error(
              `Gemini CLI a échoué: ${error.message}${stderr ? '\n' + stderr : ''}`
            )
          );
          return;
        }
        resolve(stdout);
      }
    );
  });

  return parseAiResponse(raw);
}

// ─── Shared response parser ────────────────────────────────────────────────

function parseAiResponse(raw: string): AiGeneratedProduct {
  let cleaned = raw.trim();

  // Remove ```json ... ``` wrapper
  const jsonBlockMatch = cleaned.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (jsonBlockMatch) {
    cleaned = jsonBlockMatch[1].trim();
  }

  // Extract JSON object
  const jsonStart = cleaned.indexOf('{');
  const jsonEnd = cleaned.lastIndexOf('}');
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleaned = cleaned.slice(jsonStart, jsonEnd + 1);
  }

  let parsed: AiGeneratedProduct;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(
      "L'IA a retourné un JSON invalide. Veuillez réessayer.\n\nDébut de la réponse:\n" +
        raw.slice(0, 500)
    );
  }

  if (!parsed.name || !parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error(
      "L'IA a retourné un format incomplet. Champs manquants: name, sections."
    );
  }

  parsed.gallery_images = parsed.gallery_images || [];
  parsed.video_embeds = parsed.video_embeds || [];
  parsed.short_description = parsed.short_description || '';
  parsed.url_key = parsed.url_key || '';
  parsed.meta_title = parsed.meta_title || '';
  parsed.meta_description = parsed.meta_description || '';

  return parsed;
}
