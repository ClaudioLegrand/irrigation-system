function SectorList({ sectors, onToggleSector }) {
  return (
    <section className="panel">
      <div className="panel-title-row">
        <h3>Sectores</h3>
        <span>{sectors.length} activos</span>
      </div>
      <div className="sector-list">
        {sectors.map((sector) => (
          <article key={sector.id} className="sector-card">
            <div>
              <h4>{sector.name}</h4>
              <p>{sector.description || 'Sin descripción'}</p>
            </div>
            <button
              className={`mini-button ${sector.currentState === 'ACTIVE' ? 'active' : 'inactive'}`}
              onClick={() => onToggleSector(sector)}
            >
              {sector.currentState === 'ACTIVE' ? 'On' : 'Off'}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
}

export default SectorList;
