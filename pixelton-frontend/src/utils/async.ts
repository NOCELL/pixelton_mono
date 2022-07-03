export const delayAsync = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const retryAsyncFunction = async (
  fn: () => Promise<any>,
  maxRetries: number,
  delay: number
) => {
  let retries = 0;
  while (true) {
    try {
      return await fn();
    } catch (e) {
      if (retries >= maxRetries) {
        throw e;
      }
      retries++;
      await delayAsync(delay);
    }
  }
};
