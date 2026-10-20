import { useCallback, useEffect, useState } from 'react';

export default function App() {
  const [personas, setPersonas] = useState([]);
  const [nombre, setNombre] = useState('');
  const [correo, setCorreo] = useState('');
  const [mensaje, setMensaje] = useState('Cargando registros…');
  const [error, setError] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarPersonas = useCallback(async () => {
    try {
      const response = await fetch('/api/personas');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al consultar registros.');
      setPersonas(data);
      setMensaje('');
      setError(false);
    } catch (e) {
      setMensaje(e.message || 'No fue posible conectar con la API.');
      setError(true);
    }
  }, []);

  useEffect(() => { cargarPersonas(); }, [cargarPersonas]);

  async function guardar(e) {
    e.preventDefault();
    setGuardando(true);
    setMensaje('');
    try {
      const response = await fetch('/api/personas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, correo })
      });
      const data = response.status === 204 ? null : await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo guardar.');
      setNombre('');
      setCorreo('');
      setMensaje('Persona guardada correctamente.');
      setError(false);
      await cargarPersonas();
    } catch (e) {
      setMensaje(e.message || 'Error al guardar.');
      setError(true);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(id) {
    if (!window.confirm('¿Eliminar este registro?')) return;
    try {
      const response = await fetch(`/api/personas/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'No se pudo eliminar.');
      }
      setMensaje('Registro eliminado.');
      setError(false);
      await cargarPersonas();
    } catch (e) {
      setMensaje(e.message || 'Error al eliminar.');
      setError(true);
    }
  }

  return (
    <main className="container">
      <header>
        <p className="eyebrow">LABORATORIO DE DOCKER COMPOSE</p>
        <h1>Registro de personas</h1>
        <p className="subtitle">Aplicación de ejemplo con React, Node.js, PostgreSQL y Nginx.</p>
      </header>

      <section className="panel">
        <h2>Registrar persona</h2>
        <form onSubmit={guardar}>
          <label>Nombre
            <input value={nombre} onChange={e => setNombre(e.target.value)} maxLength="100" required placeholder="Ej. Ana Pérez" />
          </label>
          <label>Correo electrónico
            <input type="email" value={correo} onChange={e => setCorreo(e.target.value)} maxLength="150" required placeholder="ana@ejemplo.com" />
          </label>
          <button disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar registro'}</button>
        </form>
        {mensaje && <p className={error ? 'message error' : 'message'} role="status">{mensaje}</p>}
      </section>

      <section className="panel">
        <div className="list-heading">
          <h2>Personas registradas</h2>
          <button className="secondary" onClick={cargarPersonas}>Actualizar</button>
        </div>
        {personas.length === 0 ? <p className="empty">No hay registros todavía.</p> : (
          <div className="table-wrap"><table>
            <thead><tr><th>Nombre</th><th>Correo</th><th>Acción</th></tr></thead>
            <tbody>{personas.map(persona => (
              <tr key={persona.id}>
                <td>{persona.nombre}</td><td>{persona.correo}</td>
                <td><button className="danger" onClick={() => eliminar(persona.id)}>Eliminar</button></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </section>
      <footer>Los registros se almacenan en PostgreSQL mediante un volumen persistente.</footer>
    </main>
  );
}
