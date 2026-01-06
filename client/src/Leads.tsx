import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from './api';

export default function Leads() {
    const [leads, setLeads] = useState<any[]>([]);

    useEffect(() => {
        api.get('/leads').then(res => setLeads(res.data));
    }, []);

    return (
        <div>
            <h1 className="text-4xl font-bold leading-tight text-[#064A6F] mb-2">Leads</h1>
            <p className="text-gray-600 mb-6">Gestión de contactos y conversaciones</p>
            <div className="flex flex-col">
                <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                        <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-[#064A6F]">
                                    <tr>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Phone</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Name</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Interest</th>
                                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                                        <th scope="col" className="relative px-6 py-3">
                                            <span className="sr-only">Edit</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {leads.map((lead) => (
                                        <tr key={lead.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {lead.phone.replace('@s.whatsapp.net', '').replace('@lid', '')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.fullName || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{lead.careerInterest || '-'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${lead.status === 'NUEVO' ? 'bg-[#A7CF3B] text-[#064A6F]' : 'bg-gray-100 text-gray-800'}`}>
                                                    {lead.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Link to={`/leads/${lead.id}`} className="text-[#064A6F] hover:text-[#0a5a87] font-medium">View Chat</Link>
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
