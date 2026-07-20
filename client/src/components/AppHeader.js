function AppHeader({ title, subtitle, status }) {
  return (
    <header className="app-header">
      <div>
        <p className="eyebrow">Control de riego</p>
        <h1>{title}</h1>
        <p className="subtitle">{subtitle}</p>
      </div>
      <div className={`status-pill ${status === 'Activo' ? 'active' : 'inactive'}`}>
        {status}
      </div>
    </header>
  );
}

export default AppHeader;
