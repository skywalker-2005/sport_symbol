const illustrations = {
  cup: `<path d="M45 22h50l-5 41c-2 18-11 30-20 36-9-6-18-18-20-36l-5-41Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="M46 32H29c0 24 6 35 23 39m59-39h-17c0 24-6 35-23 39" fill="none" stroke="url(#gold)" stroke-width="9" stroke-linecap="round"/><path d="M64 99h13l6 23H58l6-23Zm-17 23h47l9 15H38l9-15Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="M39 137h61v10H39z" fill="#a76b21"/><path d="m70 39 5 10 11 2-8 7 2 11-10-5-10 5 2-11-8-7 11-2 5-10Z" fill="#fff5d5"/>`,
  ball: `<path d="M50 30h40l-4 34c-2 16-10 27-16 31-7-5-15-16-17-31l-3-34Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="M51 40H38c0 15 4 24 15 28m36-28h13c0 15-4 24-15 28" fill="none" stroke="url(#gold)" stroke-width="6" stroke-linecap="round"/><circle cx="70" cy="55" r="17" fill="#f3f1ea" stroke="#a87532" stroke-width="2"/><g clip-path="url(#ball-clip-id)"><path d="m70 41 7 5-3 8h-8l-3-8 7-5Zm-15 12 8 3 2 8-7 4-6-5 3-10Zm29 0-3 10-7 4-2-7 4-8 8 1Zm-25 16 8-4 7 4-1 8-8 3-6-5Zm23 0 6-5 6 5-1 8-8 2-3-10Z" fill="#252624"/></g><path d="M62 96h16l5 23H57l5-23Zm-16 23h48l8 14H38l8-14Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="M39 133h62v12H39z" fill="#aa7229"/>`,
  glass: `<path d="M45 23h50l-7 42-18 25-18-25-7-42Z" fill="rgba(255,255,255,.48)" stroke="#fff" stroke-width="3"/><path d="M53 30h34l-5 31-13 19-13-19-3-31Z" fill="rgba(237,249,250,.48)" stroke="#a7c7cb" stroke-width="2"/><path d="M65 91h12v29H65z" fill="#b9d1d2" stroke="#fff" stroke-width="2"/><path d="M53 119h36l9 15H44l9-15Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="M42 134h58v11H42z" fill="#4c686b"/><path d="m70 39 3 8 9 1-7 6 2 9-7-4-7 4 1-9-6-6 9-1 3-8Z" fill="#fff"/>`,
  star: `<path d="m70 20 14 29 32 5-23 22 6 32-29-15-29 15 6-32-23-22 32-5 14-29Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><circle cx="70" cy="70" r="18" fill="#f8e9c2" stroke="#bd8c3d" stroke-width="2"/><path d="m70 56 4 9 10 1-7 7 2 10-9-5-9 5 2-10-7-7 10-1 4-9Z" fill="#d0a04e"/><path d="M61 108h18l6 20H55l6-20Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="M49 128h42v12H49z" fill="#a76b21"/>`,
  medal: `<path d="m49 18 21 24 21-24-9 42H58l-9-42Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><circle cx="70" cy="88" r="33" fill="url(#gold)" stroke="#fff4d0" stroke-width="3"/><circle cx="70" cy="88" r="25" fill="none" stroke="#b57f2c" stroke-width="2"/><path d="m70 68 6 12 13 2-10 9 3 13-12-7-12 7 2-13-9-9 13-2 6-12Z" fill="#fff5d2"/><path d="M70 121v19m-14-1h28v8H56z" fill="#8e642d"/>`,
  medalSport: `<path d="m48 18 22 23 22-23-10 43H58L48 18Z" fill="#bf3530" stroke="#ffd8d4" stroke-width="2"/><circle cx="70" cy="89" r="32" fill="#c9c7c2" stroke="#fff" stroke-width="3"/><circle cx="70" cy="89" r="24" fill="#363738"/><path d="m70 69 6 12 13 2-10 9 3 13-12-7-12 7 2-13-9-9 13-2 6-12Z" fill="#f2d994"/><path d="M70 121v18m-14 0h28v8H56z" fill="#aa712c"/>`,
  acrylic: `<path d="m48 18 22 24 22-24-10 43H58L48 18Z" fill="#c93139" stroke="#fff" stroke-width="2"/><path d="M70 58 99 76v26l-29 18-29-18V76l29-18Z" fill="rgba(255,255,255,.55)" stroke="#fff" stroke-width="3"/><path d="M70 68 89 80v18L70 110 51 98V80l19-12Z" fill="rgba(235,96,98,.35)" stroke="#d88a8e" stroke-width="2"/><path d="m70 73 5 10 11 2-8 7 2 11-10-5-10 5 2-11-8-7 11-2 5-10Z" fill="#b52d34"/><path d="M70 120v18m-14 0h28v8H56z" fill="#a47136"/>`,
  plaque: `<path d="M40 23h60l7 17v78H33V40l7-17Z" fill="#775236" stroke="#b99571" stroke-width="3"/><path d="M45 31h50l5 12v66H40V43l5-12Z" fill="#d9c6a9"/><path d="M70 41 82 48v15l-12 8-12-8V48l12-7Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="M70 46 74 53l8 1-6 6 1 8-7-4-7 4 1-8-6-6 8-1 4-7Z" fill="#fff5d2"/><path d="M50 80h40v4H50zm6 10h28v3H56zm-6 9h40v3H50z" fill="#af9678"/>`,
  figure: `<path d="M70 25c-12 0-20 10-20 21 0 8 4 13 9 17l-2 14-16 12-5 25h68l-5-25-16-12-2-14c5-4 9-9 9-17 0-11-8-21-20-21Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><circle cx="70" cy="45" r="10" fill="#fff0cf" opacity=".75"/><path d="M47 89h46l11 22H36l11-22Z" fill="#b17b32" stroke="#ffe8b5" stroke-width="2"/><path d="M34 111h72v14H34z" fill="#745332"/><path d="M41 115h58v4H41z" fill="#d5aa62"/>`,
  sport: `<circle cx="70" cy="39" r="12" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="m62 51 13 2 8 26-9 4-8-13-7 15-10-4 10-25 3-5Zm-1 30-6 21-11 13-8-6 10-17 3-17m21 0 10 14 15 8-4 9-20-6-11-12m-5-33-12 8-11 3-3-8 13-7 12-9m14 14 12 6 9 1 2-8-13-3-9-8" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="M39 116h62v13H39z" fill="#9a692c"/><circle cx="70" cy="121" r="7" fill="#fff1cd"/>`,
  base: `<path d="M49 31h42v17H49z" fill="#d2d2ce" stroke="#fff" stroke-width="2"/><path d="M43 48h54v18H43z" fill="#8e8f8c" stroke="#f8f8f5" stroke-width="2"/><path d="M49 66h42v19H49z" fill="#c0c0bc" stroke="#fff" stroke-width="2"/><path d="M36 85h68v23H36z" fill="#777977" stroke="#f4f4ef" stroke-width="2"/><path d="M29 108h82v17H29z" fill="#4e504f"/><path d="M37 112h66v5H37z" fill="#999a96"/><circle cx="49" cy="56" r="3" fill="#eee"/><circle cx="91" cy="56" r="3" fill="#eee"/>`,
  diploma: `<path d="M37 23h65v99H37z" fill="#76553b" stroke="#a98a6e" stroke-width="3"/><path d="M43 30h53v84H43z" fill="#f8f1df"/><path d="M50 38h39v26H50z" fill="#e1d3b9"/><path d="m70 42 8 5-2 10h-12l-2-10 8-5Z" fill="url(#gold)" stroke="#fff1cd" stroke-width="2"/><path d="M52 72h35v3H52zm4 8h27v3H56zm-4 8h35v3H52z" fill="#9f8c73"/><path d="M69 94c-6 5-5 12 1 17 6-5 7-12 1-17l-1-8-1 8Z" fill="#d64a42"/><path d="M29 119h82v15H29z" fill="#805d38"/><path d="M39 123h62v4H39z" fill="#cba974"/>`,
};

export default function ProductArtwork({ type, id, className = "product-card__art" }) {
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, "");
  const goldId = `gold-${safeId}`;
  const ballClipId = `ball-clip-${safeId}`;
  const artwork = illustrations[type] || illustrations.star;
  const markup = artwork
    .replaceAll("url(#gold)", `url(#${goldId})`)
    .replaceAll("url(#ball-clip-id)", `url(#${ballClipId})`);

  return (
    <svg
      className={className}
      viewBox="0 0 140 160"
      fill="none"
      role="img"
      aria-label="Иллюстрация товара"
      focusable="false"
    >
      <defs>
        <clipPath id={ballClipId}>
          <circle cx="70" cy="55" r="17" />
        </clipPath>
        <linearGradient
          id={goldId}
          x1="38"
          y1="18"
          x2="103"
          y2="140"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#fff0b7" />
          <stop offset=".36" stopColor="#d7a64e" />
          <stop offset=".64" stopColor="#f8df96" />
          <stop offset="1" stopColor="#a87127" />
        </linearGradient>
      </defs>
      <g dangerouslySetInnerHTML={{ __html: markup }} />
    </svg>
  );
}
