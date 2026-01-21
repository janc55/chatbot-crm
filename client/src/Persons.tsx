import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api';

export default function Persons() {
    const [persons, setPersons] = useState<any[]>([]);

    useEffect(() => {
        api.get('/persons').then(res => setPersons(res.data));
    }, []);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-bold leading-tight text-[#064A6F] mb-2">Gestión de Leads</h1>
                    <p className="text-gray-600">Gestión de Leads, Contactos y Clientes</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.location.href = 'http://localhost:3000/persons/export'}
                        className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 flex items-center"
                    >
                        Exportar Excel
                    </button>
                </div>
            </div>

            <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#064A6F]">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Celular</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Nombre</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Tipo</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Etapa</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Etiquetas</th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Editar</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {persons.map((person) => (
                                        <tr key={person.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {person.phone.replace('@s.whatsapp.net', '').replace('@lid', '')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{person.fullName || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${person.type === 'LEAD' ? 'bg-blue-100 text-blue-800' : person.type === 'CONTACT' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                                                    {person.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {person.pipelineStage ? (
                                                    <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: person.pipelineStage.color + '20', color: person.pipelineStage.color, border: `1px solid ${person.pipelineStage.color}` }}>
                                                        {person.pipelineStage.displayName}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <div className="flex flex-wrap gap-1">
                                                    {person.tags?.map((pt: any) => (
                                                        <span key={pt.tag.id} className="text-[10px] px-1 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                            {pt.tag.name}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link to={`/persons/${person.id}`} className="text-[#064A6F] hover:text-[#0a5a87] font-medium">Gestionar</Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
