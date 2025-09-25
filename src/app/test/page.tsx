export default function TestPage() {
  return (
    <div style={{ padding: '20px', backgroundColor: 'white', color: 'black' }}>
      <h1>🟢 Test Page - Si ves esto, React funciona</h1>
      <p>Servidor: Funcionando</p>
      <p>Next.js: Funcionando</p>
      <p>Hora: {new Date().toLocaleString()}</p>
      <a href="/dashboard" style={{ color: 'blue' }}>Ir al Dashboard</a>
    </div>
  )
}