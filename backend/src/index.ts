import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import 'dotenv/config';
import type { FormData } from './types/formData';
import { runAllValidations, SECTION_NAMES } from './validators/index';
import { isAiConfigured } from './ai/aiClient';
import { assessRequestSchema } from './schemas/formData';

// Overall budget for one assessment. Worst-case single validator runs
// 4 sequential checks of (15s scrape + 20s AI) = 140s; validators themselves
// run in parallel, so 150s covers the slowest path with headroom.
const ASSESSMENT_TIMEOUT_MS = 150_000;

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const assessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many assessment requests. Please try again in a few minutes.' },
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/assess', assessLimiter, async (req, res) => {
  const parsed = assessRequestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({
      error: 'Missing required form sections: identity, website, peerReview',
      details: parsed.error.issues
        .slice(0, 10)
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`),
    });
    return;
  }

  const { language, ...formData } = parsed.data;

  const withTimeout = (onSection?: Parameters<typeof runAllValidations>[2]) =>
    Promise.race([
      runAllValidations(formData as FormData, language, onSection),
      new Promise<never>((_resolve, reject) =>
        setTimeout(() => reject(new Error('assessment timed out')), ASSESSMENT_TIMEOUT_MS)
      ),
    ]);

  const wantsStream = (req.headers.accept ?? '').includes('text/event-stream');

  if (!wantsStream) {
    // Plain JSON path (backwards compatible).
    try {
      const report = await withTimeout();
      res.json(report);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      if (message === 'assessment timed out') {
        res.status(504).json({
          error:
            'The assessment took too long to complete. Some of the provided pages may be very slow — please try again.',
        });
        return;
      }
      console.error(`Assessment failed: ${message}`);
      res.status(500).json({ error: 'Assessment failed due to an internal error. Please try again.' });
    }
    return;
  }

  // SSE path: stream each section's results as its validator finishes.
  res.status(200);
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let closed = false;
  req.on('close', () => {
    closed = true;
  });

  const send = (event: string, data: unknown) => {
    if (closed) return;
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  // Keep intermediary proxies from dropping the idle connection.
  const heartbeat = setInterval(() => {
    if (!closed) res.write(': ping\n\n');
  }, 15_000);

  send('start', { sections: SECTION_NAMES });

  try {
    const report = await withTimeout((sectionResult) => send('section', sectionResult));
    send('done', { report });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Assessment failed (stream): ${message}`);
    send('error', {
      message:
        message === 'assessment timed out'
          ? 'The assessment took too long to complete. Some of the provided pages may be very slow — please try again.'
          : 'Assessment failed due to an internal error. Please try again.',
    });
  } finally {
    clearInterval(heartbeat);
    if (!closed) res.end();
  }
});

// Serve frontend (only when dist directory exists, e.g. production)
const frontendDist = path.join(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));
  app.use((req, res, next) => {
    if (req.method !== 'GET') return next();
    if (req.path.startsWith('/api/') || req.path === '/health') return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

const PORT = process.env.PORT || 3001;
if (process.env.NODE_ENV !== 'test') {
  if (!isAiConfigured()) {
    console.warn(
      'WARNING: OPENAI_API_KEY is not set. AI content checks will be skipped and reported as warnings.'
    );
  }
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

export default app;
