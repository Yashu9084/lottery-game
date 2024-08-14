import React, { useState } from 'react';
import axios from 'axios';
import './Game.css';

const Game = () => {
    const [grid1, setGrid1] = useState(Array(3).fill().map(() => Array(3).fill('')));
    const [grid2, setGrid2] = useState(Array(3).fill().map(() => Array(3).fill('')));
    const [cutGrid1, setCutGrid1] = useState(Array(3).fill().map(() => Array(3).fill(false)));
    const [cutGrid2, setCutGrid2] = useState(Array(3).fill().map(() => Array(3).fill(false)));
    const [started, setStarted] = useState(false);
    const [message, setMessage] = useState('');
    const [winner, setWinner] = useState(null);

    const handleChange = (grid, setGrid, row, col, value) => {
        value = Number(value);
        if (value < 1 || value > 9 || isNaN(value)) return;

        if (grid.flat().includes(value)) {
            alert('This number is already taken in this grid!');
            return;
        }

        const newGrid = grid.map(row => [...row]); // Clone the grid
        newGrid[row][col] = value;
        setGrid(newGrid);
    };

    const startGame = async () => {
        if (grid1.flat().includes('') || grid2.flat().includes('')) {
            alert('Please fill all the cells with unique numbers from 1 to 9 before starting the game.');
            return;
        }

        await axios.post('http://localhost:4000/api/users', { name: 'User 1', grid: grid1 });
        await axios.post('http://localhost:4000/api/users', { name: 'User 2', grid: grid2 });
        setStarted(true);
        setMessage('Game Started!');
    };

    const playTurn = async () => {
        const res = await axios.post('http://localhost:4000/api/play');
        const { number, winner } = res.data;
        setMessage(`Number ${number} drawn!`);

        updateCutGrid(grid1, cutGrid1, setCutGrid1, number);
        updateCutGrid(grid2, cutGrid2, setCutGrid2, number);

        if (winner) {
            setMessage(`${winner.name} wins!`);
            setWinner(winner.name);
            setStarted(false);
        }
    };

    const updateCutGrid = (grid, cutGrid, setCutGrid, number) => {
        const newCutGrid = cutGrid.map((row, i) =>
            row.map((cell, j) => (grid[i][j] === number ? true : cell))
        );
        setCutGrid(newCutGrid);
    };

    const resetGame = async () => {
        await axios.delete('http://localhost:4000/api/reset'); // API call to delete both players' data

        setGrid1(Array(3).fill().map(() => Array(3).fill('')));
        setGrid2(Array(3).fill().map(() => Array(3).fill('')));
        setCutGrid1(Array(3).fill().map(() => Array(3).fill(false)));
        setCutGrid2(Array(3).fill().map(() => Array(3).fill(false)));
        setWinner(null);
        setMessage('');
    };

    const renderGridInput = (grid, setGrid) => (
        <div>
            {grid.map((row, i) => (
                <div key={i} className="row">
                    {row.map((cell, j) => (
                        <input 
                            key={j} 
                            type="number" 
                            value={cell || ''} 
                            min="1" 
                            max="9"
                            onChange={(e) => handleChange(grid, setGrid, i, j, e.target.value)} 
                            disabled={started} 
                        />
                    ))}
                </div>
            ))}
        </div>
    );

    const renderGrid = (grid, cutGrid) => (
        <div>
            {grid.map((row, i) => (
                <div key={i} className="row">
                    {row.map((cell, j) => (
                        <div key={j} className={`cell ${cutGrid[i][j] ? 'cut' : ''}`}>
                            {cell}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );

    return (
        <div>
            <h1>Lottery Game</h1>
            <div>
                <h3>Grid 1</h3>
                {!started && !winner ? renderGridInput(grid1, setGrid1) : renderGrid(grid1, cutGrid1)}
            </div>

            <div>
                <h3>Grid 2</h3>
                {!started && !winner ? renderGridInput(grid2, setGrid2) : renderGrid(grid2, cutGrid2)}
            </div>

            <button onClick={startGame} disabled={started || winner}>Start Game</button>
            <button onClick={playTurn} disabled={!started}>Next Turn</button>
            {winner && <button onClick={resetGame}>Reset Game</button>}

            <p>{message}</p>
        </div>
    );
};

export default Game;
