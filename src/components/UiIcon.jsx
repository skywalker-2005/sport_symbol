export default function UiIcon({ name, className = "" }) {
  const shared = {
    className: `ui-icon${className ? ` ${className}` : ""}`,
    viewBox: "0 0 24 24",
    fill: "none",
    "data-icon": name,
    "aria-hidden": true,
    focusable: "false",
  };

  if (name === "arrow-up-right") {
    return (
      <svg {...shared}>
        <path d="M7 17 17 7M7 7h10v10" />
      </svg>
    );
  }
  if (name === "arrow-down") {
    return (
      <svg {...shared}>
        <path d="M12 4v16m0 0 7-7m-7 7-7-7" />
      </svg>
    );
  }
  if (name === "arrow-up") {
    return (
      <svg {...shared}>
        <path d="M12 20V4m0 0 7 7m-7-7-7 7" />
      </svg>
    );
  }
  if (name === "check") {
    return (
      <svg {...shared}>
        <path d="m5 12.5 4.2 4.2L19 7" />
      </svg>
    );
  }
  if (name === "close") {
    return (
      <svg {...shared}>
        <path d="m6 6 12 12M18 6 6 18" />
      </svg>
    );
  }
  if (name === "heart" || name === "heart-filled") {
    return (
      <svg {...shared}>
        <path d="M20.2 8.8c0 5.2-8.2 10.1-8.2 10.1S3.8 14 3.8 8.8a4.5 4.5 0 0 1 8.2-2.6 4.5 4.5 0 0 1 8.2 2.6Z" />
      </svg>
    );
  }
  if (name === "search") {
    return (
      <svg {...shared}>
        <circle cx="10.8" cy="10.8" r="6.3" />
        <path d="m15.5 15.5 4 4" />
      </svg>
    );
  }
  if (name === "clock") {
    return (
      <svg {...shared}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7v5l3.5 2" />
      </svg>
    );
  }
  if (name === "pencil") {
    return (
      <svg {...shared}>
        <path d="m4 16.8-.8 4 4-.8L20 7.2 16.8 4 4 16.8Z" />
        <path d="m14.8 6 3.2 3.2" />
      </svg>
    );
  }
  if (name === "star") {
    return (
      <svg {...shared}>
        <path d="m12 2.8 2.7 5.7 6.3.8-4.6 4.4 1.1 6.3-5.5-3-5.5 3 1.1-6.3L3 9.3l6.3-.8L12 2.8Z" />
      </svg>
    );
  }
  if (name === "sparkle") {
    return (
      <svg {...shared}>
        <path d="M12 2.5 14.2 9l6.5 2.2-6.5 2.2-2.2 6.5-2.2-6.5L3.3 11.2 9.8 9 12 2.5Z" />
        <path d="m19 16 .9 2.1L22 19l-2.1.9L19 22l-.9-2.1L16 19l2.1-.9L19 16Z" />
      </svg>
    );
  }
  return null;
}
