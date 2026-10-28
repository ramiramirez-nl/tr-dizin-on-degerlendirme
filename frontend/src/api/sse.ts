export interface SseEvent {
  event: string;
  data: unknown;
}

/**
 * Parses a fetch() streaming Response body as Server-Sent Events.
 * Handles chunk boundaries that split an event mid-stream by buffering
 * incomplete lines/blocks until a full "event/data\n\n" block is available.
 */
export async function* parseSseStream(response: Response): AsyncGenerator<SseEvent> {
  const body = response.body;
  if (!body) return;

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex: number;
    while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
      const rawBlock = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);

      let event = 'message';
      let data = '';
      for (const line of rawBlock.split('\n')) {
        if (line.startsWith('event:')) event = line.slice(6).trim();
        else if (line.startsWith('data:')) data += line.slice(5).trim();
        // ": ping" comment lines are heartbeats — ignored.
      }
      if (!data) continue;
      try {
        yield { event, data: JSON.parse(data) };
      } catch {
        // Malformed event payload — skip rather than crash the stream.
      }
    }
  }
}
