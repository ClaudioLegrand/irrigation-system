function IrrigationControlCard({ isActive, onToggle }) {
  return (
    <section className="control-card">
      <div>
        <p className="eyebrow">Estado del sistema</p>
        <h2>{isActive ? 'Riego activo' : 'Riego detenido'}</h2>
        <p className="card-copy">
          {isActive
            ? 'El sistema está regando en este momento.'
            : 'El sistema está en espera.'}
        </p>
      </div>
      <button className={`main-button ${isActive ? 'stop' : 'start'}`} onClick={onToggle}>
        {isActive ? 'Apagar riego' : 'Encender riego'}
      </button>
    </section>
  );
}

export default IrrigationControlCard;
