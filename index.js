require('dotenv').config()

const express = require('express')
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { User, Exercise } = require("./models");
const app = express()
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://127.0.0.1:27017/exerciseTracker", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const cors = require('cors')

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// POST /api/users
app.post("/api/users", async (req, res) => {
  const { username } = req.body;

  const user = new User({ username });
  await user.save();

  res.json({ username: user.username, _id: user._id });
});

// GET /api/users
app.get("/api/users", async (req, res) => {
  const users = await User.find({}, { username: 1, _id: 1 });
  res.json(users);
});

// POST /api/users/:_id/exercises
app.post("/api/users/:_id/exercises", async (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;

  const user = await User.findById(_id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const exercise = new Exercise({
    userId: _id,
    description,
    duration: Number(duration),
    date: date ? new Date(date) : new Date(),
  });

  await exercise.save();

  res.json({
    username: user.username,
    description: exercise.description,
    duration: exercise.duration,
    date: exercise.date.toDateString(),
    _id: user._id,
  });
});

// GET /api/users/:_id/logs
app.get("/api/users/:_id/logs", async (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  const user = await User.findById(_id);
  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let filter = { userId: _id };
  if (from || to) {
    filter.date = {};
    if (from) filter.date.$gte = new Date(from);
    if (to) filter.date.$lte = new Date(to);
  }

  let query = Exercise.find(filter).select("description duration date -_id");
  if (limit) {
    query = query.limit(Number(limit));
  }

  const exercises = await query;

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log: exercises.map((ex) => ({
      description: ex.description,
      duration: ex.duration,
      date: ex.date.toDateString(),
    })),
  });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
