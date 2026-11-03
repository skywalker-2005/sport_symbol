const benefits = [
  ["✳", "Для любого повода", "Рекорды, старание, участие"],
  ["⌁", "Персонализация", "Нанесём логотип и надпись"],
  ["◷", "Сроки заранее", "Согласуем дату изготовления"],
  ["↗", "Помощь с выбором", "Подберём тираж и комплект"],
];

export default function BenefitsSection() {
  return (
    <section className="benefits" aria-label="Наши преимущества">
      <div className="container benefits__grid">
        {benefits.map(([icon, title, description]) => (
          <div className="benefit" key={title}>
            <span className="benefit__icon">{icon}</span>
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
