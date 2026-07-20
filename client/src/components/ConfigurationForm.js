import { useEffect, useState } from 'react';

function ConfigurationForm({ sectors, onSave }) {
  const [formData, setFormData] = useState({
    sectorId: sectors[0]?.id || '',
    startTime: '06:00',
    durationMinutes: 15,
    enabled: true,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      sectorId: sectors[0]?.id || '',
    }));
  }, [sectors]);

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave({
      sectorId: Number(formData.sectorId),
      startTime: formData.startTime,
      durationMinutes: Number(formData.durationMinutes),
      enabled: formData.enabled,
    });
  };

  if (!sectors.length) {
    return (
      <section className="panel empty-panel">
        <div className="panel-title-row">
          <h3>Programación</h3>
          <span>En espera</span>
        </div>
        <p className="empty-state">Crea un sector para habilitar la programación del riego.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <div className="panel-title-row">
        <h3>Nueva configuración</h3>
        <span>Guarda una programación</span>
      </div>
      <form className="config-form" onSubmit={handleSubmit}>
        <label>
          Sector
          <select name="sectorId" value={formData.sectorId} onChange={handleChange}>
            {sectors.map((sector) => (
              <option key={sector.id} value={sector.id}>
                {sector.name}
              </option>
            ))}
          </select>
        </label>

        <label>
          Hora de inicio
          <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} />
        </label>

        <label>
          Duración (min)
          <input
            type="number"
            name="durationMinutes"
            min="5"
            max="180"
            value={formData.durationMinutes}
            onChange={handleChange}
          />
        </label>

        <label className="checkbox-row">
          <input type="checkbox" name="enabled" checked={formData.enabled} onChange={handleChange} />
          Habilitar configuración
        </label>

        <button type="submit" className="main-button start full-width">
          Guardar configuración
        </button>
      </form>
    </section>
  );
}

export default ConfigurationForm;
