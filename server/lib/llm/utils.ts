export function cleanJson(text: string): string {
  return text.replace(/```json\n?|\n?```/g, "").trim();
}

export function parseJson<T>(text: string, fallback: T): T {
  try {
    const jsonStr = cleanJson(text);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse JSON:", text);
    return fallback;
  }
}
