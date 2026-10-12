// A large upload's plain JSON can exceed a proxy's request-size cap (413)
export const gzipJsonBody = async (
  body: unknown,
): Promise<{ body: unknown; headers: Record<string, string> }> => {
  if (typeof CompressionStream === 'undefined') return { body, headers: {} };
  const stream = new Blob([JSON.stringify(body)]).stream().pipeThrough(new CompressionStream('gzip'));
  const compressed = await new Response(stream).blob();
  return {
    body: new Blob([compressed], { type: 'application/json' }),
    headers: { 'Content-Encoding': 'gzip' },
  };
};
