function HistoryList({ historyItems }) {
  return (
    <section className="panel">
      <div className="panel-title-row">
        <h3>Historial</h3>
        <span>Últimas acciones</span>
      </div>
      <div className="history-list">
        {historyItems.length === 0 ? (
          <p className="empty-state">No hay eventos aún.</p>
        ) : (
          historyItems.slice(0, 5).map((item) => (
            <article key={item.id} className="history-item">
              <div>
                <h4>{item.originOrder || 'Evento'}</h4>
                <p>{item.startDateTime || 'Sin fecha'}</p>
              </div>
              <span className="history-badge">{item.endDateTime ? 'Finalizado' : 'Pendiente'}</span>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

export default HistoryList;
