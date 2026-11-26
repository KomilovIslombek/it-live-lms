const priceFormat = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export function formatPrice(price: string | number) {
  const value = Number(price);
  if (value === 0) return "Free";
  return `${priceFormat.format(value)} UZS`;
}

export function formatDate(value: string) {
  return dateFormat.format(new Date(value));
}

export function formatPhone(phone: string | null) {
  if (!phone) return "—";
  const match = phone.match(/^\+998(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return match ? `+998 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone;
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function plural(count: number, one: string, many = `${one}s`) {
  return `${count.toLocaleString("en-US")} ${count === 1 ? one : many}`;
}
