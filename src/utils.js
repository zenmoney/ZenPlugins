export const extractErrorDetails = (error) => [
    error.message,
    error.stack && error.stack.replace("Error: " + error.message + "\n", ""),
].filter(Boolean).join("\n");
