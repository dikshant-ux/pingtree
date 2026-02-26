'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import CreateBuyerWizard from "@/components/buyers/wizard/CreateBuyerWizard";
import api from '@/lib/api';
import { Buyer } from '@/types';

export default function EditBuyerPage() {
    const params = useParams();
    const [buyer, setBuyer] = useState<Buyer | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBuyer = async () => {
            try {
                const res = await api.get(`/buyers/${params.id}`);
                setBuyer(res.data);
            } catch (err) {
                console.error("Failed to fetch buyer", err);
            } finally {
                setLoading(false);
            }
        };
        if (params.id) {
            fetchBuyer();
        }
    }, [params.id]);

    if (loading) return <div className="text-foreground">Loading...</div>;
    if (!buyer) return <div className="text-destructive">Buyer not found</div>;

    return (
        <div>
            <h1 className="text-2xl font-bold text-foreground mb-6">Edit Buyer: {buyer.name}</h1>
            <CreateBuyerWizard initialData={buyer} isEditing={true} />
        </div>
    );
}
