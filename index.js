const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

mongoose.connect('mongodb://localhost:27017/lottery', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => console.log('MongoDB Connected')).catch(err => console.log(err));

const UserSchema = new mongoose.Schema({
    name: String,
    grid: [[Number]],
    cutGrid: [[Boolean]],
});

const User = mongoose.model('User', UserSchema);

// API to save user grids
app.post('/api/users', async (req, res) => {
    const { name, grid } = req.body;

    // Check if there are already two users in the database
    const userCount = await User.countDocuments();
    if (userCount >= 2) {
        return res.status(400).send({ message: 'Two players are already playing. Please wait for the game to finish.' });
    }

    const cutGrid = Array(3).fill().map(() => Array(3).fill(false));
    const user = new User({ name, grid, cutGrid });
    await user.save();
    res.send(user);
});

// API to generate random number and update the grid
app.post('/api/play', async (req, res) => {
    const number = Math.floor(Math.random() * 9) + 1;
    const users = await User.find({});
    
    for (let user of users) {
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (user.grid[i][j] === number) {
                    user.cutGrid[i][j] = true;
                }
            }
        }
        await user.save();
    }

    // Check for a winner
    let winner = null;
    for (let user of users) {
        for (let i = 0; i < 3; i++) {
            if (user.cutGrid[i].every(v => v === true) || user.cutGrid.map(row => row[i]).every(v => v === true)) {
                winner = user;
                break;
            }
        }
    }

    // Send the result back without deleting the users
    res.send({ number, winner });
});

// API to reset the game by deleting the data of both players
app.delete('/api/reset', async (req, res) => {
    await User.deleteMany({});
    res.send({ message: 'Game reset successfully' });
});

app.listen(4000, () => {
    console.log('Server running on port 4000');
});
