import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface QuickReply {
    id: string;
    title: string;
    content: string;
    category: string;
}

const QuickRepliesManager: React.FC = () => {
    const [quickReplies, setQuickReplies] = useState<QuickReply[]>([]);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ title: '', content: '', category: 'general' });

    useEffect(() => {
        fetchQuickReplies();
    }, []);

    const fetchQuickReplies = async () => {
        try {
            const response = await axios.get('http://localhost:3000/chat/quick-replies');
            setQuickReplies(response.data);
        } catch (error) {
            console.error('Error fetching quick replies:', error);
        }
    };

    const handleCreate = async () => {
        try {
            await axios.post('http://localhost:3000/chat/quick-replies', formData);
            setFormData({ title: '', content: '', category: 'general' });
            setShowForm(false);
            fetchQuickReplies();
        } catch (error) {
            console.error('Error creating quick reply:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this quick reply?')) return;
        try {
            await axios.delete(`http://localhost:3000/chat/quick-replies/${id}`);
            fetchQuickReplies();
        } catch (error) {
            console.error('Error deleting quick reply:', error);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6 flex items-center justify-between">
                    <h1 className="text-3xl font-bold text-[#064A6F]">Quick Replies</h1>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-[#A7CF3B] text-white rounded hover:bg-[#8fb32d]"
                    >
                        {showForm ? 'Cancel' : 'Add Quick Reply'}
                    </button>
                </div>

                {showForm && (
                    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4">New Quick Reply</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Content</label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    rows={4}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Category</label>
                                <input
                                    type="text"
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                />
                            </div>
                            <button
                                onClick={handleCreate}
                                className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Create Quick Reply
                            </button>
                        </div>
                    </div>
                )}

                <div className="space-y-4">
                    {quickReplies.map((qr) => (
                        <div key={qr.id} className="bg-white rounded-lg shadow-md p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-[#064A6F]">{qr.title}</h3>
                                    <p className="text-sm text-gray-600 mt-1">{qr.content}</p>
                                    <span className="inline-block mt-2 px-2 py-1 bg-gray-100 text-xs rounded">
                                        {qr.category}
                                    </span>
                                </div>
                                <button
                                    onClick={() => handleDelete(qr.id)}
                                    className="ml-4 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default QuickRepliesManager;
