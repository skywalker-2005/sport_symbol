const rubles = new Intl.NumberFormat("ru-RU");

export function formatPrice(value) {
  return `${rubles.format(value)} ₽`;
}
