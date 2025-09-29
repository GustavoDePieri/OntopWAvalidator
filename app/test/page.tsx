'use client'

export default function TestPage() {
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          🎉 Login Funcionou!
        </h1>
        <p className="text-gray-600">
          Se você está vendo esta página, o login e redirecionamento estão funcionando corretamente.
        </p>
        <a 
          href="/" 
          className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Ir para o Dashboard
        </a>
      </div>
    </div>
  )
}



