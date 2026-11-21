// "Frontend (React)" → "frontend-react", "O'zbek tili" → "ozbek-tili".
// Used when the admin doesn't type a slug. Returns "" when nothing is left
// (a title written only in Cyrillic, for example); the caller checks that.
export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD") // "é" → "e" + accent mark
    .replace(/[̀-ͯ]/g, "") // drop the accent marks
    .replace(/['‘’`ʻʼ]/g, "") // Uzbek apostrophes: o'zbek → ozbek
    .replace(/[^a-z0-9]+/g, "-") // everything else becomes a dash
    .replace(/^-+|-+$/g, ""); // no dash at the start or the end
}
