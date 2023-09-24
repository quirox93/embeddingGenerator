import natural from "natural";

export const preprocessText = (_text) => {
  const text = _text.toLowerCase().trim();
  const tokenizer = new natural.WordTokenizer();
  const tokens = tokenizer.tokenize(text);
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "my",
    "i",
    "is",
    "no",
    "yes",
    "q",
  ]);
  const filteredTokens = tokens.filter((token) => !stopWords.has(token));

  const stemmedTokens = filteredTokens.map((token) =>
    natural.PorterStemmer.stem(token)
  );
  const preprocessedText = stemmedTokens.join(" ");
  return preprocessedText;
};
