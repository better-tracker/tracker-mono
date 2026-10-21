import { useEffect, useState } from 'react';
import { getProjects } from '@project-tracker/api-client';

const API_URL = 'http://localhost:3001';

export function ApiConnectionTest() {
    const [message, setMessage] = useState('Connecting to backend...');

    useEffect(() => {
        getProjects(API_URL)
            .then((projects) => {
                setMessage(`Backend connected! Found ${projects.length} projects.`);
            })
            .catch((error: unknown) => {
                setMessage(
                    error instanceof Error ? error.message : 'Connection failed.'
                );
            });
        }, []);

    return <p role="status">{message}</p>;
}