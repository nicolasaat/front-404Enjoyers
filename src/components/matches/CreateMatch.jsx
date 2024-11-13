import React, { useContext, useState, useEffect } from 'react';
import { createMatch } from './MatchService';
import { AuthContext } from '../auth/AuthContext';

function CreateMatch({ userId }) {
    const [turns, setTurns] = useState(10);
    const [isPublic, setIsPublic] = useState(false);
    const {token} = useContext(AuthContext);

    const handleCreateMatch = async () => {
        const response = await createMatch(userId, turns, isPublic, token);
        if (response.status === "success") {
            alert("Partida creada con éxito!");
        } else {
            alert("Error al crear la partida: " + response.message);
        }
    };

    return (
        <div>
            <h2>Create a Match</h2>
            <input
                type="number"
                value={turns}
                onChange={(e) => setTurns(e.target.value)}
                placeholder="Número de turnos"
            />
            <label>
                <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={() => setIsPublic(!isPublic)}
                />
                Public Match
            </label>
            <button onClick={handleCreateMatch}>Create</button>
        </div>
    );
}

export default CreateMatch;