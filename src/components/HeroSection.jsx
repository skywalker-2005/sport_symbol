import UiIcon from "./UiIcon.jsx";

export default function HeroSection() {
  return (
    <section className="hero" id="home">
      <div className="hero__grain" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="eyebrow eyebrow--light">
            <span /> НАГРАДЫ ДЛЯ ЛЮБОГО ДОСТИЖЕНИЯ
          </p>
          <h1>
            Каждый шаг
            <br />
            достоин <em>признания</em>
          </h1>
          <p className="hero__description">
            Кубки, медали и награды для рекордов, старания, участия и
            личных достижений. Поможем отметить то, что важно именно вам.
          </p>
          <div className="hero__buttons">
            <a className="button button--light" href="#catalog">
              Выбрать награды <span><UiIcon name="arrow-up-right" /></span>
            </a>
            <a className="hero__link" href="#about">
              Узнать о нас <span><UiIcon name="arrow-down" /></span>
            </a>
          </div>
          <div className="hero__proof">
            <div className="hero__avatars" aria-hidden="true">
              <span>А</span>
              <span>М</span>
              <span>И</span>
            </div>
            <p>
              <b>Для самых разных событий</b>
              <br />
              от турниров до личных рекордов
            </p>
            <span className="hero__proof-divider" />
            <p>
              <b>От 1 штуки</b>
              <br />
              до крупных тиражей
            </p>
          </div>
        </div>

        <div className="hero-art" aria-label="Иллюстрация спортивного кубка">
          <div className="hero-art__orbit hero-art__orbit--one" />
          <div className="hero-art__orbit hero-art__orbit--two" />
          <span className="hero-art__star hero-art__star--one"><UiIcon name="sparkle" /></span>
          <span className="hero-art__star hero-art__star--two"><UiIcon name="star" /></span>
          <div className="hero-art__label">
            <span>01</span> ВАШЕ
            <br />
            ДОСТИЖЕНИЕ
          </div>
          <svg
            className="hero-art__cup"
            viewBox="0 0 400 450"
            fill="none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient
                id="gold"
                x1="120"
                y1="30"
                x2="300"
                y2="330"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFF1AE" />
                <stop offset=".23" stopColor="#DFAE48" />
                <stop offset=".48" stopColor="#FFF0AD" />
                <stop offset=".72" stopColor="#B97A20" />
                <stop offset="1" stopColor="#F6D576" />
              </linearGradient>
              <linearGradient
                id="stem"
                x1="150"
                y1="260"
                x2="250"
                y2="400"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#FFE7A0" />
                <stop offset=".5" stopColor="#BE8529" />
                <stop offset="1" stopColor="#F6D576" />
              </linearGradient>
              <filter
                id="cup-shadow"
                x="30"
                y="0"
                width="340"
                height="460"
                filterUnits="userSpaceOnUse"
              >
                <feGaussianBlur stdDeviation="13" />
              </filter>
            </defs>
            <ellipse
              cx="202"
              cy="424"
              rx="119"
              ry="15"
              fill="#170B0A"
              opacity=".48"
              filter="url(#cup-shadow)"
            />
            <path
              d="M130 67H270L258 180C253 230 229 263 200 278C171 263 147 230 142 180L130 67Z"
              fill="url(#gold)"
              stroke="#FFE9A4"
              strokeWidth="2"
            />
            <path
              d="M130 88H92C92 157 114 196 150 202M270 88H308C308 157 286 196 250 202"
              stroke="url(#gold)"
              strokeWidth="20"
              strokeLinecap="round"
            />
            <path
              d="M163 99H237L231 174C228 202 216 218 200 229C184 218 172 202 169 174L163 99Z"
              fill="#D92C27"
              opacity=".9"
            />
            <path
              d="m200 122 8 16 18 2-13 12 3 18-16-9-16 9 3-18-13-12 18-2 8-16Z"
              fill="#FFF1AE"
            />
            <path
              d="M179 275H221L230 345H170L179 275Z"
              fill="url(#stem)"
            />
            <path
              d="M150 345H250L270 384H130L150 345Z"
              fill="url(#gold)"
            />
            <path d="M126 384H274V410H126V384Z" fill="#A86F1B" />
            <path
              d="M126 384H274V393H126V384Z"
              fill="#FFE7A0"
              opacity=".65"
            />
            <path
              d="M160 112 173 190"
              stroke="#FFF5C9"
              strokeWidth="4"
              strokeLinecap="round"
              opacity=".6"
            />
          </svg>
          <div className="hero-art__caption">
            <span>ВАШ МОМЕНТ</span>
            <i />
            <span>ВАША ИСТОРИЯ</span>
          </div>
        </div>
      </div>
      <div className="hero__bottom container">
        <span>ОТМЕЧАЕМ ВАЖНОЕ</span>
        <span className="hero__bottom-line" />
        <span>РЕКОРДЫ, СТАРАНИЕ И КАЖДЫЙ ШАГ ВПЕРЁД</span>
        <a href="#catalog" aria-label="Листайте к ассортименту">
          <UiIcon name="arrow-down" />
        </a>
      </div>
    </section>
  );
}
