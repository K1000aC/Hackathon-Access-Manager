import type { TeamPass } from "../../model/team";
function PassCode() {
  const cells = [
    1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0,
    1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 0, 1,
    1, 0, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1, 0, 1, 0, 1, 1, 0,
    1, 1, 0, 1,
  ];
  return (
    <div aria-label="Código visual del pase" className="pass-code">
      {cells.map((cell, index) => (
        <i className={cell ? "filled" : ""} key={index} />
      ))}
    </div>
  );
}

export function AccessPass({ pass }: { pass: TeamPass }) {
  return (
    <article className="access-pass">
      <div className="pass-topline">
        <span>HACKAFLOW / ACCESS PASS</span>
        <b>VALIDADO</b>
      </div>
      <div className="pass-content">
        <div>
          <small>EQUIPO ACREDITADO</small>
          <h3>{pass.teamName}</h3>
          <p>{pass.leader}</p>
          <div className="pass-data">
            <span>
              CATEGORÍA <b>{pass.category}</b>
            </span>
            <span>
              INTEGRANTES <b>{pass.members}</b>
            </span>
          </div>
        </div>
        <PassCode />
      </div>
      <div className="pass-footer">
        <strong>{pass.id}</strong>
        <span>R · REGISTRO COMPLETADO</span>
      </div>
    </article>
  );
}
