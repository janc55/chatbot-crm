import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from './api';

export default function LeadDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lead, setLead] = useState<any>(null);

    useEffect(() => {
        api.get(`/leads/${id}`).then(res => setLead(res.data));
    }, [id]);

    if (!lead) return <div>Loading...</div>;

    return (
        <div className="h-[80vh] flex flex-col">
            <div className="bg-white shadow px-4 py-5 sm:px-6 mb-4 flex justify-between items-center">
                <div>
                    <h3 className="text-xl leading-6 font-bold text-[#064A6F]">
                        Chat with {lead.phone.replace('@s.whatsapp.net', '').replace('@lid', '')}
                    </h3>
                    <p className="mt-1 max-w-2xl text-sm text-gray-500">{lead.fullName} - {lead.careerInterest}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/chat/${id}`)}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                        Open Chat
                    </button>
                    <span className={`mr-2 text-sm font-medium ${lead.isHandoverActive ? 'text-red-600' : 'text-[#064A6F]'}`}>
                        {lead.isHandoverActive ? 'Human Agent Active' : 'Bot Active'}
                    </span>
                    <button
                        onClick={async () => {
                            await api.patch(`/leads/${id}/handover`, { status: !lead.isHandoverActive });
                            setLead({ ...lead, isHandoverActive: !lead.isHandoverActive });
                        }}
                        className={`relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#064A6F] ${lead.isHandoverActive ? 'bg-red-600' : 'bg-[#A7CF3B]'}`}
                    >
                        <span className="sr-only">Use setting</span>
                        <span aria-hidden="true" className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition ease-in-out duration-200 ${lead.isHandoverActive ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 border rounded-lg space-y-4">
                {lead.interactions?.map((interaction: any) => (
                    <div key={interaction.id} className={`flex ${interaction.direction === 'INBOUND' ? 'justify-start' : 'justify-end'}`}>
                        <div className={`max-w-xs md:max-w-md lg:max-w-lg px-4 py-2 rounded-lg ${interaction.direction === 'INBOUND' ? 'bg-white border border-gray-200' : 'bg-[#A7CF3B] bg-opacity-20 border border-[#A7CF3B]'}`}>
                            <div className="text-sm text-gray-900">{interaction.content}</div>
                            <div className="text-xs text-gray-400 mt-1 flex justify-between">
                                <span>{new Date(interaction.createdAt).toLocaleTimeString()}</span>
                                {interaction.templateKey && <span className="ml-2 font-mono text-[10px]">{interaction.templateKey}</span>}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
