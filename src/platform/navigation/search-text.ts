const turkishLetters: Readonly<Record<string, string>> = {
  ç: "c",
  ğ: "g",
  ı: "i",
  ö: "o",
  ş: "s",
  ü: "u",
};

/**
 * Folds text for search: Turkish lower case, then Turkish letters to their plain Latin
 * counterparts, so "gorev" finds "Görevler" and "ik" finds "İK". People on site phones often
 * type without Turkish characters.
 */
export function foldSearchText(text: string): string {
  return text
    .toLocaleLowerCase("tr-TR")
    .replace(/[çğıöşü]/g, (letter) => turkishLetters[letter] ?? letter)
    .trim();
}

/** True when every word of the query appears in the text, in any order. */
export function matchesSearch(text: string, query: string): boolean {
  const haystack = foldSearchText(text);
  return foldSearchText(query)
    .split(/\s+/)
    .every((word) => haystack.includes(word));
}
