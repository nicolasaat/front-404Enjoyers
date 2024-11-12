import React, { useEffect, useState } from 'react';
import { getAvailableMatches, joinMatch, getMatchDetails } from './MatchService';
import { useNavigate } from 'react-router-dom';

function AvailableMatches({ userId }) {
    const [matches, setMatches] = useState([]);
    const [selectedMatchId, setSelectedMatchId] = useState(null);
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        async function fetchMatches() {
            try {
                const response = await getAvailableMatches();
                setMatches(response.availableMatches || []);
            } catch (error) {
                alert("Error at load available matches: " + error.message);
            }
        }
        fetchMatches();
    }, []);

    // Función para verificar si el usuario ya está en la partida
    const isUserInMatch = (match) => {
        return match.users.some(user => user.id === userId);
    };

    // Manejar la unión a una partida
    const handleJoinMatch = async (match) => {
        if (isUserInMatch(match)) {
            alert(`You are already joined to the match with ID: ${match.id}`);
            return;
        }

        if (match.users.length >= 4) { // Cambio aquí: comparar con `>=` y no `=`
            alert(`The match with ID: ${match.id} is full.`);
            return;
        }

        if (!match.public) {
            setSelectedMatchId(match.id); // Solicitar contraseña si es privada
        } else {
            try {
                const response = await joinMatch(match.id, userId);
                if (response.status === 'success') {
                    alert(`You have joined de match with ID: ${match.id}`);
                } else {
                    alert(`Error when joining the match: ${response.message}`);
                }
            } catch (error) {
                alert("Error when trying to join the the match: " + error.message);
            }
        }
    };

    // Manejar la unión con contraseña
    const handleJoinWithPassword = async () => {
        try {
            const response = await joinMatch(selectedMatchId, userId, password);
            if (response.status === 'success') {
                alert(`You have joined the match with ID: ${selectedMatchId}`);
                setSelectedMatchId(null);
                setPassword('');
            } else {
                alert(`Error when joining the match: ${response.message}`);
            }
        } catch (error) {
            alert("Error al Error when trying to join the the match: " + error.message);
        }
    };

    const handleMatchClick = async (match) => {
        // Primero verifica si la partida existe en el backend antes de navegar
        try {
            const matchDetails = await getMatchDetails(match.id);
            if (matchDetails) {
                console.log(`Navigating to match with ID: ${match.id}`);
               navigate(`/matches/${match.id}`);
            } else {
                alert("Match not found.");
            }
        } catch (error) {
            alert("Error retrieving match details: " + error.message);
        }
    };

    return (
        <div>
            <h2>Waiting Matches</h2>
            <ul>
                {matches.map((match) => (
                    <li 
                        key={match.id} 
                        onClick={() => handleMatchClick(match)} // Redirige a la página de detalles
                        style={{ cursor: 'pointer', color: match.public ? 'black' : 'red' }}
                    >
                        ID: {match.id}, Public: {match.public ? 'yes' : 'No'}, 
                        Players: {match.users.length}/4
                        {match.status === 'waiting' && (
                            <button onClick={(e) => {
                                e.stopPropagation(); // Evita la navegación al hacer clic en el botón
                                handleJoinMatch(match);
                            }}>Join</button>
                        )}
                    </li>
                ))}
            </ul>

            {/* Formulario de contraseña para partidas privadas */}
            {selectedMatchId && (
                <div>
                    <h3>Enter the password to join the match {selectedMatchId}</h3>
                    <input
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                    <button onClick={handleJoinWithPassword}>Join</button>
                    <button onClick={() => setSelectedMatchId(null)}>Cancel</button>
                </div>
            )}
        </div>
    );
}

export default AvailableMatches;