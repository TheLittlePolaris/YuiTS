export function errorLogger(error: Error | string, scope?: string): null {
  const now = new Date();
  console.error(
    `================= ERROR =================\n` +
      `========= ${scope || "NO_SCOPE"} ========\n` +
      `=========== ${now.toString()} ===========\n` +
      `${error}`
  );
  return null;
}
