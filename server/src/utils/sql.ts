// Builds the SET part of an UPDATE from only the fields that were sent, so
// PATCH can change one field without touching the others.
//
//   buildSet({ title: "React", status: false })
//   → { set: "title = $1, status = $2", values: ["React", false] }
//
// The column names are put into the SQL text, so they must never come
// straight from the request. Here they are the keys of an object that a zod
// schema already checked, and zod drops every key the schema doesn't know.
// The values still go in as $1, $2, ... like everywhere else.
export function buildSet(data: Record<string, unknown>) {
  const columns = Object.keys(data).filter((key) => data[key] !== undefined);

  const set = columns
    .map((column, index) => `${column} = $${index + 1}`)
    .join(", ");
  const values = columns.map((column) => data[column]);

  return { set, values };
}
