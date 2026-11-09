import UiIcon from "./UiIcon.jsx";

const steps = [
  ["search", "Выбираете", "Находите награду в каталоге или описываете свою идею."],
  ["sparkle", "Согласуем", "Обсуждаем тираж, сроки и персонализацию наград."],
  ["arrow-up-right", "Изготавливаем", "Подготавливаем заказ и держим вас в курсе."],
  ["star", "Отмечаете", "Вручаете награду за любой важный результат."],
];

export default function StepsSection() {
  return (
    <section className="steps section">
      <div className="container">
        <div className="section-heading section-heading--center">
          <div>
            <p className="eyebrow">
              <span /> ВСЁ ПРОСТО
            </p>
            <h2>
              От идеи до <em>награды</em>
            </h2>
          </div>
        </div>
        <div className="steps__grid">
          {steps.map(([icon, title, description], index) => (
            <article className="step" key={title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div className="step__icon"><UiIcon name={icon} /></div>
              <h3>{title}</h3>
              <p>{description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
