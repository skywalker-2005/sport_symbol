import UiIcon from "./UiIcon.jsx";

export default function AboutSection() {
  return (
    <section className="about section" id="about">
      <div className="container about__grid">
        <div className="about__art" aria-hidden="true">
          <div className="about__red" />
          <div className="about__number">
            SS
            <br />
            <span>01</span>
          </div>
          <div className="about__quote">
            «Каждый шаг
            <br />
            вперёд — это
            <br />
            <em>уже достижение.</em>»
          </div>
          <span className="about__star"><UiIcon name="sparkle" /></span>
        </div>
        <div className="about__content">
          <p className="eyebrow">
            <span /> О СИМВОЛЕ СПОРТА
          </p>
          <h2>
            У каждого
            <br />
            достижения есть <em>символ</em>
          </h2>
          <p className="about__text">
            Мы помогаем отмечать то, чем можно гордиться: личный рекорд,
            старание, участие, командную работу или важный шаг на пути к цели.
          </p>
          <p className="about__text">
            Подберём награду под событие и предложим варианты оформления.
            Выберите изделие в каталоге или расскажите нам о своей идее.
          </p>
          <div className="about__stats">
            <div>
              <b>1 → ∞</b>
              <span>тираж под ваш запрос</span>
            </div>
            <div>
              <b>100%</b>
              <span>внимания к деталям</span>
            </div>
          </div>
          <a className="text-link" href="#contacts">
            Расскажите о своём событии <span><UiIcon name="arrow-up-right" /></span>
          </a>
        </div>
      </div>
    </section>
  );
}
