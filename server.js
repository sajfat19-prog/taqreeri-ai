import express from 'express';
import OpenAI from 'openai';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
const PORT = process.env.PORT || 3000;
const client = () => {
  if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY_MISSING');
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};
const validLang = (v) => v === 'en' ? 'English' : 'Arabic';

app.get('/api/health', (_req, res) => res.json({ ok: true, aiConfigured: Boolean(process.env.OPENAI_API_KEY) }));

app.post('/api/suggest-titles', async (req, res) => {
  try {
    const { topic, language = 'ar' } = req.body || {};
    if (typeof topic !== 'string' || topic.trim().length < 2) return res.status(400).json({ error: 'اكتب موضوعاً قصيراً أولاً.' });
    const response = await client().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.7,
      messages: [
        { role: 'system', content: `You are an academic writing assistant. Suggest exactly 6 distinct, clear, school-appropriate academic report titles in ${validLang(language)}. Return only valid JSON: {"titles":["..."]}. No markdown.` },
        { role: 'user', content: `Topic: ${topic.trim().slice(0, 500)}` }
      ], response_format: { type: 'json_object' }
    });
    const data = JSON.parse(response.choices[0].message.content || '{}');
    res.json({ titles: Array.isArray(data.titles) ? data.titles.slice(0, 6) : [] });
  } catch (e) { console.error(e); res.status(e.message === 'OPENAI_API_KEY_MISSING' ? 503 : 500).json({ error: e.message === 'OPENAI_API_KEY_MISSING' ? 'لم يتم إعداد مفتاح الذكاء الاصطناعي على الخادم بعد.' : 'تعذر اقتراح العناوين حالياً. حاول مرة أخرى.' }); }
});

app.post('/api/generate-report', async (req, res) => {
  try {
    const { title, studentName, stage = 'المرحلة الإعدادية', language = 'ar', pages = 5 } = req.body || {};
    if (!title || typeof title !== 'string' || title.trim().length < 3) return res.status(400).json({ error: 'يرجى إدخال عنوان التقرير.' });
    if (!studentName || typeof studentName !== 'string' || studentName.trim().length < 2) return res.status(400).json({ error: 'يرجى إدخال اسم الطالب.' });
    const pageCount = Math.max(2, Math.min(15, Number(pages) || 5));
    const lang = validLang(language);
    const response = await client().chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini', temperature: 0.55,
      messages: [
        { role: 'system', content: `You are a careful academic report writer for students. Write in ${lang}. Return valid JSON only with keys: title, abstract, sections (array of objects with heading and paragraphs array), conclusion, references (array of strings). Aim for content that will fill about ${pageCount} A4 pages including a cover; do not claim exact pagination. Structure: introduction, 3-6 substantive sections appropriate to topic, conclusion, and references. Use clear age-appropriate language for stage: ${stage}. Never invent specific books, URLs, authors, statistics, quotations, or citations. If exact sources are uncertain, provide a short "Suggested sources to verify" list with credible institutions or well-known source types, and explicitly indicate these should be checked. No markdown.` },
        { role: 'user', content: `Report title/topic: ${title.trim().slice(0, 500)}\nStudent name: ${studentName.trim().slice(0, 120)}\nAcademic stage: ${stage}\nLanguage: ${lang}\nTarget length: approximately ${pageCount} A4 pages including cover. Produce a coherent report.` }
      ], response_format: { type: 'json_object' }
    });
    const report = JSON.parse(response.choices[0].message.content || '{}');
    if (!Array.isArray(report.sections)) throw new Error('INVALID_REPORT_FORMAT');
    res.json({ report: { ...report, title: report.title || title.trim(), studentName: studentName.trim(), stage, language, pages: pageCount } });
  } catch (e) { console.error(e); res.status(e.message === 'OPENAI_API_KEY_MISSING' ? 503 : 500).json({ error: e.message === 'OPENAI_API_KEY_MISSING' ? 'لم يتم إعداد مفتاح الذكاء الاصطناعي على الخادم بعد.' : 'تعذر إنشاء التقرير. حاول مرة أخرى.' }); }
});

app.get('*', (_req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.listen(PORT, '0.0.0.0', () => console.log(`Taqreeri AI listening on ${PORT}`));
