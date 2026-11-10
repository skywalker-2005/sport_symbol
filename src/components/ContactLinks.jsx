const phone = "79911369230";
const message = encodeURIComponent("Здравствуйте! Пишу с сайта Символ Спорта.");

const links = [
  {
    label: "Telegram",
    href: `https://t.me/+${phone}?text=${message}`,
    path: <path d="m21 4-3.1 15c-.2 1.1-.9 1.4-1.8.9l-5-3.7-2.4 2.3c-.3.3-.5.5-1 .5l.4-5.1L17.4 7c.4-.4-.1-.6-.6-.3L6.5 13.2l-5-1.6c-1.1-.3-1.1-1.1.2-1.6l18.4-7.1c.9-.3 1.6.2 1.3 1.1Z" />,
  },
  {
    label: "WhatsApp",
    href: `https://wa.me/${phone}?text=${message}`,
    path: <path d="M20.2 11.7a8.3 8.3 0 0 1-12.3 7.2L3 20l1.2-4.7a8.3 8.3 0 1 1 16-3.6ZM8.1 7.7c-.2-.5-.5-.5-.8-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.7s1.2 3.1 1.4 3.3c.2.2 2.3 3.7 5.7 5 2.8 1.1 3.4.9 4 .8.6-.1 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.7-.4l-2.1-1c-.3-.1-.5-.2-.7.2-.2.4-.8 1-1-1.2-.2.2-.4.2-.8.1-.4-.2-1.6-.6-3-1.9-1.1-1-1.8-2.2-2-2.6-.2-.4 0-.6.1-.8l.5-.6c.2-.2.2-.4.3-.6.1-.2 0-.5 0-.7l-.9-2.2Z" />,
  },
  {
    label: "MAX",
    href: `https://max.ru/+${phone}`,
    path: <path d="M4 19V5l4.7 7L13.5 5v14M17 5h3v14h-3z" />,
  },
];

export default function ContactLinks() {
  return (
    <nav className="contact-links" aria-label="Написать нам">
      {links.map(({ label, href, path }) => (
        <a
          className="contact-links__link"
          href={href}
          key={label}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}, номер +7 (991) 136-92-30`}
          title={`${label}: +7 (991) 136-92-30`}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            {path}
          </svg>
          <span>{label}</span>
        </a>
      ))}
    </nav>
  );
}
