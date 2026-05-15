export const extractErrorDetail = (error: any, fallbackMessage: string): string => {
  const responseData = error?.response?.data;

  const validationErrors = responseData?.errors;
  if (validationErrors && typeof validationErrors === "object") {
    const messages = Object.values(validationErrors)
      .flatMap((value: unknown) => {
        if (Array.isArray(value)) {
          return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
        }
        if (typeof value === "string" && value.trim().length > 0) {
          return [value];
        }
        return [];
      })
      .slice(0, 3);

    if (messages.length > 0) {
      return messages.join(" ");
    }
  }

  if (typeof responseData === "string" && responseData.trim()) {
    return responseData;
  }

  if (responseData?.error && typeof responseData.error === "string") {
    return responseData.error;
  }

  if (responseData?.message && typeof responseData.message === "string") {
    return responseData.message;
  }

  if (error?.request) {
    return "No response from server. Check your connection.";
  }

  if (error?.message && typeof error.message === "string") {
    return error.message;
  }

  return fallbackMessage;
};

export const createFailureMessage = (
  action: string,
  error: any,
  fallbackMessage: string
): string => {
  const detail = extractErrorDetail(error, fallbackMessage);
  return `Failed to ${action}: ${detail}`;
};
