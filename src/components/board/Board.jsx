import React, { useContext, useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getBoardDetails, moveCharacter, executeActionsInTurn, getEventsForCell } from './BoardServices';
import { getMatchDetails, nextPlayer } from '../matches/MatchService';
import spriteX from '../../assets/imgs/X.jpg';
import spriteEmpty from '../../assets/imgs/empty.png';
import spriteD from '../../assets/imgs/D.jpg';
import spriteB from '../../assets/imgs/B.jpg';
import spriteFrontKnight from '../../assets/imgs/knight/front.png';
import spriteFrontArcher from '../../assets/imgs/archer/front.png';
import spriteFrontMage from '../../assets/imgs/mage/front.png';
import spriteFrontDwarf from '../../assets/imgs/dwarf/front.png';
import spriteFrontdruid from '../../assets/imgs/druid/front.png';
import spriteFrontElf from '../../assets/imgs/elf/front.png';
import battleView from '../../views/battle';
import '../../assets/styles/style.css';
import { AuthContext } from '../auth/AuthContext';
import parseJwt from '../auth/AuthParser';

function Board() {
    const { matchId } = useParams();
    const [cells, setCells] = useState([]);
    const [boardType, setBoardType] = useState('');
    const [characters, setCharacters] = useState([]);
    const [currentCharacter, setCurrentCharacter] = useState(null);
    const [selectedEvents, setSelectedEvents] = useState([]);
    const [availableActions, setAvailableActions] = useState(0);
    const [isActionPhase, setIsActionPhase] = useState(false);
    const [messages, setMessages] = useState([]);
    const [isTurnComplete, setIsTurnComplete] = useState(false);
    const [cellEvents, setCellEvents] = useState([]);
    const [characterTurn, setCharacterTurn] = useState(null);
    const {token} = useContext(AuthContext);
    const userId = Number(parseJwt(token)?.sub);
    const navigate = useNavigate();
    // Para el combate
    const [isInCombat, setIsInCombat] = useState(false);

    async function fetchBoard() {
        try {
            const boardResponse = await getBoardDetails(matchId, token);
            const matchResponse = await getMatchDetails(matchId, token);

            if (boardResponse.status === 'success' && matchResponse.status === 'success') {
                setCells(boardResponse.cells || []); 
                setBoardType(boardResponse.board.type || '');
                setCharacters(boardResponse.characters || []);

                const characterInTurn = boardResponse.characters.find(
                    char => char.id === matchResponse.match.characterTurn
                );
                setCurrentCharacter(characterInTurn);
                setCharacterTurn(matchResponse.match.characterTurn);
                const cellEventsResponse = await getEventsForCell(characterInTurn.cellId, token);
                if (cellEventsResponse.status === 'success') {
                        setCellEvents(cellEventsResponse.events);
                }
            } else {
                console.error("Error: Unable to fetch board or match details");
            }
        } catch (error) {
            console.error('Error fetching board or match details:', error);
        }
    }

    useEffect(() => {
        fetchBoard();
    }, [matchId]);

    const cellSprites = {
        'X': spriteX,
        '-': spriteEmpty,
        'D': spriteD,
        'B': spriteB,
    };

    const characterSprites = {
        "knight": spriteFrontKnight,
        "archer": spriteFrontArcher,
        "mage": spriteFrontMage,
        "dwarf": spriteFrontDwarf,
        "druid": spriteFrontdruid,
        "elf": spriteFrontElf,
    };

    const handleCellClick = async (cell) => {
        const parseMatchId = parseInt(matchId, 10);
        if (currentCharacter?.userId !== userId) {
            alert(`It's not your turn. You are ${characters.find(c=> c.userId === userId)?.name}`);
            return;
        }
        if (['-', 'B'].includes(cell.type) && currentCharacter) {
            try {
                const response = await moveCharacter(currentCharacter, parseMatchId, cell.x, cell.y, token);
                if (response.status === 'success') {
                    setMessages([response.message]);
                    const updatedCharacter = response.character;
                    setCharacters(prevCharacters =>
                        prevCharacters.map(char =>
                            char.id === updatedCharacter.id ? updatedCharacter : char
                        )
                    );
                    //setAvailableActions(updatedCharacter.actions);
                    setIsActionPhase(true);

                    const cellEventsResponse = await getEventsForCell(cell.id, token);
                    if (cellEventsResponse.status === 'success') {
                        setCellEvents(cellEventsResponse.events);

                        // Redirect to battle
                        // if (cellEventsResponse.events.some(event => event.type === 'combat')) {
                        //     setIsInCombat(true);
                        // }

                        // if (cellEventsResponse.events.length === 0) {
                        //     await handleEndTurn();
                        // }
                    }
                } else {
                    alert("Error: " + response.message);
                }
            } catch (error) {
                if (error.message === "Cell out of reach.") {
                    alert("Not valid move, the cell is out of reach.");
                } else if (error.message === "Movement blocked by an obstacle.") {
                    alert("Movement blocked: there is an obstacle in the way.");
                } else {
                    console.error("Error moving character:", error);
                }
            }
        }
    };

    const handleEventCheck = (event) => {
        setSelectedEvents((prevSelectedEvents) => {
          if (prevSelectedEvents.includes(event.id)) {
            return prevSelectedEvents.filter((id) => id !== event.id);
          } else {
            return [...prevSelectedEvents, event.id];
          }
        });
      };

    const executeActions = async () => {
        try {
            const parseMatchId = parseInt(matchId, 10);
            const response = await executeActionsInTurn(parseMatchId, currentCharacter.id, selectedEvents, token);
            if (response.status === 'success') {
                setMessages(response.messages);
                setSelectedEvents([]);
                setIsTurnComplete(true);
                setIsActionPhase(false);
                fetchBoard();
            } else {
                alert("Error executing actions: " + response.message);
            }
        } catch (error) {
            console.error("Error executing actions:", error);
        }
    };

    useEffect(() => {
        if (isTurnComplete) {
            alert("Turn completed.");
            setIsTurnComplete(false);
        }
    }, [isTurnComplete, matchId]);

    const renderCell = (cell) => {
        const sprite = cellSprites[cell.type] || cellSprites['-'];
        const character = characters.find(char => char.cellId === cell.id);
        const isClickable = cell.type === '-' || cell.type === 'D' || cell.type === 'B';
    
        return (
            <div
                key={cell.id}
                className={`board-cell ${isClickable ? 'clickable' : ''}`}
                style={{ backgroundImage: `url(${sprite})` }}
                onClick={isClickable ? () => handleCellClick(cell) : undefined}
            >
                {character && (
                    <img
                        src={characterSprites[character.class.toLowerCase()]}
                        className="character-sprite"
                        alt={character.class}
                    />
                )}
            </div>
        );
    };

    const handleInventoryClick = async (inventoryId) => {

        try {
            navigate(`/inventories/${inventoryId}`)
        } catch (error) {
            alert("Error while getting inventory: " + error.message);
        }
    };
    const handleStatsClick = async (characterId) => {

        try {
            navigate(`/stats/${characterId}`)
        } catch (error) {
            alert("Error while getting stats: " + error.message);
        }
    };
    const handleScoreboardClick = async (matchId) => {

        try {
            navigate(`/scoreboard/${matchId}`)
        } catch (error) {
            alert("Error while getting scoreboard: " + error.message);
        }
    };

    return (
        <div className="board-container">
            {/* Si isInCombat es true, renderizar la vista de batalla */}
            {isInCombat ? (
                <battleView matchId={matchId} /> 
            ) : (
                <>
                    <div>
                        <h2 className="board-title">Map: {boardType}</h2>
                        <h3>
                            Current turn: {currentCharacter?.name}
                            {(currentCharacter?.userId === userId)? (<> (You)</>):<></>}
                        </h3>
                        <div className="message-container">
                            {messages.map((message, index) => (
                        <div key={index} className="message">{message}</div>
                            ))}
                        </div>
                        <div className='other'>
                            <button 
                                className='actions-button'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleInventoryClick(characters.find(c=> c.userId === userId)?.inventoryId);
                                }}>
                                Open Inventory
                            </button>
                            <button 
                                className='actions-button'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleStatsClick(characters.find(c=> c.userId === userId)?.id);
                                }}>
                                Show Stats
                            </button>
                            <button 
                                className='actions-button'
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handleScoreboardClick(matchId);
                                }}>
                                Show Scoreboard
                            </button>
                        </div>
                        <div className="board">
                            {cells.map((cell) => renderCell(cell))}
                        </div>
                        <button className="actions-button" onClick={executeActions} disabled={!isActionPhase}>
                            Execute Actions
                        </button>
                        <div className="cell-events-container">
                            <h3>Events in this cell</h3>
                            {cellEvents.length > 0 ? (
                                cellEvents.map((event, index) => (
                                    <div key={index} className="cell-event">
                                        <p>Event: {event.name}</p>
                                        <input 
                                            type="checkbox"
                                            onChange={() => handleEventCheck(event)}
                                        />
                                    </div>
                                ))
                            ) : (
                                <p>There are no events in this cell</p>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );    
}

export default Board;