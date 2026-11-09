import UiIcon from "./UiIcon.jsx";

const benefits = [
  ["sparkle", "Для любого повода", "Рекорды, старание, участие"],
  ["pencil", "Персонализация", "Нанесём логотип и надпись"],
  ["clock", "Сроки заранее", "Согласуем дату изготовления"],
  ["arrow-up-right", "Помощь с выбором", "Подберём тираж и комплект"],
];

export default function BenefitsSection() {
  return (
    <section className="benefits" aria-label="Наши преимущества">
      <div className="container benefits__grid">
        {benefits.map(([icon, title, description]) => (
          <div className="benefit" key={title}>
            <span className="benefit__icon"><UiIcon name={icon} /></span>
            <p>
              <b>{title}</b>
              <br />
              {description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
