export default function Brand({ footer = false }) {
  return (
    <a className={`brand${footer ? " brand--footer" : ""}`} href="#home">
      <span className="brand__mark" aria-hidden="true">
        <svg viewBox="0 0 42 42" fill="none">
          <path d="M12 7h18l-2 17-7 6-7-6-2-17Z" fill="currentColor" />
          <path
            d="M13 11H7c0 7 3 10 8 11M29 11h6c0 7-3 10-8 11M21 30v5m-7 2h14"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path d="m18 15 3-2 3 2-1 4h-4l-1-4Z" fill="#171717" />
        </svg>
      </span>
      <span className="brand__text">
        СИМВОЛ<span>СПОРТА</span>
      </span>
    </a>
  );
}
