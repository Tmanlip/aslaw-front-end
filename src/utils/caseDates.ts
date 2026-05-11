const DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-MY", {
  dateStyle: "medium",
  timeStyle: "short",
});

export const formatCaseDate = (value: unknown): string => {
  if (!value) {
    return "-";
  }

  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return DATE_TIME_FORMATTER.format(date);
};